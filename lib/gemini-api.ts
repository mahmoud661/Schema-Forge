import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure the Gemini AI client
let genAI: GoogleGenerativeAI | null = null;

// Initialize the API with your API key
export const initGeminiAPI = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("Gemini API key is required");
  }
  genAI = new GoogleGenerativeAI(apiKey);
};

// Get or create model instance
const getModel = (modelName = "gemini-1.5-flash") => {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Call initGeminiAPI first");
  }
  return genAI.getGenerativeModel({ model: modelName });
};

// Specialized retry function for common Gemini API errors
async function withRetry<T>(
  fn: () => Promise<T>, 
  retries = 2,
  delay = 1000,
  isStreamingOperation = false
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Don't retry on certain errors
    if (
      error.message?.includes("API key") ||
      error.message?.includes("quota") ||
      error.message?.includes("rate limit") ||
      retries <= 0
    ) {
      throw error;
    }
    
    // Add specific messaging for stream parsing errors
    if (error.message?.includes("Failed to parse stream")) {
      console.warn("Stream parsing failed, retrying with standard API...");
      // If it's a streaming failure, inform caller we should use non-streaming API
      if (isStreamingOperation) {
        throw new Error("SWITCH_TO_NON_STREAMING");
      }
    }
    
    console.log(`Retrying operation after ${delay}ms. Remaining retries: ${retries}`);
    
    // Wait for the delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return withRetry(fn, retries - 1, delay * 1.5, isStreamingOperation);
  }
}

// Simple completion endpoint for SQL assistance
export const generateSqlCompletion = async (prompt: string, context?: string) => {
  try {
    const model = getModel();
    const fullPrompt = context 
      ? `${context}\n\nUser request: ${prompt}` 
      : prompt;
      
    const result = await withRetry(() => model.generateContent(fullPrompt));
    const text = result.response.text();
    return { success: true, data: text };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to generate completion" 
    };
  }
};

// Stream completion with robust fallback to non-streaming API
export const streamSqlCompletion = async (
  prompt: string, 
  context?: string,
  onChunk?: (chunk: string) => void
) => {
  try {
    const model = getModel();
    const fullPrompt = context 
      ? `${context}\n\nUser request: ${prompt}` 
      : prompt;
    
    // Set flag to track if we've already shown a warning about streaming
    let streamErrorWarningShown = false;
    
    // First attempt: Try streaming with retry logic
    try {
      // Wrap the streaming in a try-catch with specific stream parsing error handling
      try {
        const result = await withRetry(
          () => model.generateContentStream(fullPrompt), 
          1, 
          500, 
          true
        );
        
        let accumulatedResponse = '';
        
        // Process each chunk as it arrives
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          accumulatedResponse += chunkText;
          
          if (onChunk) {
            onChunk(chunkText);
          }
        }
        
        return { success: true, data: accumulatedResponse };
      } catch (streamParseError: any) { // changed from streamParseError to streamParseError: any
        // Check specifically for stream parsing errors
        if ((streamParseError as any).message?.includes("Failed to parse stream")) {
          console.warn("Stream parsing error detected, falling back to standard API:", streamParseError);
          streamErrorWarningShown = true;
          
          if (onChunk) {
            onChunk("\n\n[Switching to standard response mode due to streaming error...]\n");
          }
          
          throw new Error("SWITCH_TO_NON_STREAMING");
        }
        throw streamParseError; // Re-throw if it's a different error
      }
    } 
    catch (streamError: any) {
      // Check for our special error that indicates we should switch to non-streaming
      const shouldSwitchToNonStreaming = 
        streamError.message === "SWITCH_TO_NON_STREAMING" ||
        streamError.message?.includes("Failed to parse stream");
        
      if (shouldSwitchToNonStreaming) {
        console.log("Switching to non-streaming API due to stream error");
        
        if (!streamErrorWarningShown && onChunk) {
          onChunk("[AI Assistant is preparing response using alternative method...]");
        }
        
        // Fall back to standard API with retry
        try {
          const result = await withRetry(() => model.generateContent(fullPrompt), 2, 1000);
          const text = result.response.text();
          
          if (onChunk) {
            // For UI continuity, send the entire response as a chunk
            onChunk("\n\n" + text);
          }
          
          return { success: true, data: text, usingFallback: true };
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          throw fallbackError;
        }
      }
      
      // For other errors, just rethrow
      throw streamError;
    }
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to generate completion" 
    };
  }
};

// Generate schema with improved error handling and fallback
export const streamSchemaFromDescription = async (
  description: string,
  onChunk?: (chunk: string) => void,
  onComplete?: (fullSql: string) => void,
  settings?: {
    caseSensitiveIdentifiers?: boolean;
    useInlineConstraints?: boolean;
    dbType?: string;
  }
): Promise<{
  success: boolean;
  data?: { sql: string; nodes?: any[]; edges?: any[] };
  error?: string;
  usingFallback?: boolean;
}> => {
  try {
    const model = getModel();
    const dbType = settings?.dbType || "postgresql";
    const useCaseSensitiveIdentifiers = settings?.caseSensitiveIdentifiers || false;
    const useInlineConstraints = settings?.useInlineConstraints !== undefined ? settings.useInlineConstraints : true;
    
    // Create identifiers based on settings
    const identifierExample = useCaseSensitiveIdentifiers ? 
      'Use quotes for identifiers (like "customer_id", "first_name", etc.)' :
      'Don\'t use quotes for regular identifiers (like customer_id, first_name, etc.)';
      
    // Create constraint example based on settings
    const constraintExample = useInlineConstraints ?
      'Use inline foreign key constraints (like: category_id INTEGER REFERENCES categories(category_id))' :
      'Define foreign keys using separate ALTER TABLE statements after creating all tables';
    
    const prompt = `
    I need to create a database schema for the following application:
    ${description}

    Please provide a SQL schema with tables, relationships, and appropriate constraints.
    Focus on ${dbType.toUpperCase()} syntax with proper primary keys, foreign keys, and data types.
    Return ONLY valid SQL code without any explanations or markdown formatting.
    
    IMPORTANT SQL FORMAT REQUIREMENTS:
    - Use "CREATE TABLE IF NOT EXISTS" for all table definitions
    - Use SERIAL for auto-incrementing primary keys
    - Use standard ${dbType.toUpperCase()} data types (VARCHAR, TEXT, NUMERIC, etc.)
    - ${identifierExample}
    - ${constraintExample}
    - Include proper CHECK constraints where appropriate
    - Use TIMESTAMP WITH TIME ZONE for datetime columns
    - Add NOT NULL constraints where appropriate
    - Use UNIQUE constraints where needed
    - Format the SQL with proper indentation (2 spaces) and clear readability
    
    Here's an example of the expected style:
    
    CREATE TABLE IF NOT EXISTS customers (
      ${useCaseSensitiveIdentifiers ? '"customer_id"' : 'customer_id'} SERIAL PRIMARY KEY,
      ${useCaseSensitiveIdentifiers ? '"first_name"' : 'first_name'} VARCHAR(255) NOT NULL,
      ${useCaseSensitiveIdentifiers ? '"email"' : 'email'} VARCHAR(255) UNIQUE NOT NULL,
      ${useCaseSensitiveIdentifiers ? '"address"' : 'address'} TEXT
    );
    
    CREATE TABLE IF NOT EXISTS products (
      ${useCaseSensitiveIdentifiers ? '"product_id"' : 'product_id'} SERIAL PRIMARY KEY,
      ${useCaseSensitiveIdentifiers ? '"name"' : 'name'} VARCHAR(255) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      ${useCaseSensitiveIdentifiers ? '"category_id"' : 'category_id'} INTEGER ${
        useInlineConstraints ? 
        `REFERENCES ${useCaseSensitiveIdentifiers ? '"categories"("category_id")' : 'categories(category_id)'}` : 
        ''
      }
    );
    
    Ensure proper indentation and clarity in the SQL code.
    `;
    
    let accumulatedSql = '';
    let usingFallback = false;
    let streamErrorWarningShown = false;
    // Try streaming first with retry logic
    try {
      // Wrap streaming in an additional try-catch for parsing errors
      try {
        if (onChunk) onChunk("-- Initializing schema generation\n");
        
        // Use our retry wrapper for streaming
        const result = await withRetry(
          () => model.generateContentStream(prompt),
          1,
          500,
          true
        );
        
        if (onChunk) onChunk("-- Streaming schema generation started\n");
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          accumulatedSql += chunkText;
          
          if (onChunk) {
            onChunk(chunkText);
          }
        }
      } catch (streamParseError: any) { // changed from streamParseError to streamParseError: any
        // Check specifically for stream parsing errors
        if (streamParseError.message?.includes("Failed to parse stream")) {
          console.warn("Stream parsing error detected, falling back to standard API:", streamParseError);
          streamErrorWarningShown = true;
          
          if (onChunk) {
            onChunk("\n\n-- Stream parsing error detected\n-- Switching to standard generation mode\n\n");
          }
          
          throw new Error("SWITCH_TO_NON_STREAMING");
        }
        throw streamParseError; // Re-throw if it's a different error
      }
    } 
    catch (streamError: any) {
      // Check if we should switch to non-streaming
      const shouldSwitchToNonStreaming = 
        streamError.message === "SWITCH_TO_NON_STREAMING" ||
        streamError.message?.includes("Failed to parse stream");
        
      if (shouldSwitchToNonStreaming) {
        usingFallback = true;
        
        if (!streamErrorWarningShown && onChunk) {
          onChunk("\n-- Switching to standard generation mode\n-- Please wait while we generate your schema...\n\n");
        }
        
        // Create a more focused prompt for the non-streaming attempt
        const fallbackPrompt = `
        Create a PostgreSQL database schema for: ${description}
        Return ONLY valid SQL code with no explanations.
        Include proper tables, relationships, and constraints.
        `;
        
        // Use non-streaming with retry and increased timeout
        try {
          const result = await withRetry(
            () => model.generateContent(fallbackPrompt),
            2,  // More retries
            1500 // Longer delay
          );
          
          const sqlCode = result.response.text();
          accumulatedSql = sqlCode;
          
          if (onChunk) {
            onChunk(sqlCode);
          }
        } catch (fallbackError) {
          console.error("Non-streaming fallback also failed:", fallbackError);
          throw fallbackError;
        }
      } else {
        // For other errors, rethrow
        throw streamError;
      }
    }
    
    // Call onComplete with the final result regardless of method
    if (onComplete) {
      onComplete(accumulatedSql);
    }
    
    if (!accumulatedSql.includes('CREATE TABLE')) {
      throw new Error("Generated SQL does not contain valid table definitions");
    }
    
    return { 
      success: true, 
      data: { sql: accumulatedSql },
      usingFallback
    };
  } catch (error: any) {
    console.error("Schema generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate schema"
    };
  }
};

// Standard non-streaming version as a fallback option
export const generateSchemaFromDescription = async (
  description: string
): Promise<{
  success: boolean;
  data?: { sql: string; nodes?: any[]; edges?: any[] };
  error?: string;
}> => {
  try {
    const model = getModel();
    
    const prompt = `
    I need to create a database schema for the following application:
    ${description}

    Please provide a SQL schema with tables, relationships, and appropriate constraints.
    Focus on PostgreSQL syntax with proper primary keys, foreign keys, and data types.
    Return ONLY valid SQL code without any explanations or markdown formatting.
    `;
    
    const result = await withRetry(() => model.generateContent(prompt));
    const sqlCode = result.response.text();
    
    if (!sqlCode.includes('CREATE TABLE')) {
      throw new Error("Generated SQL does not contain valid table definitions");
    }
    
    return { 
      success: true, 
      data: { sql: sqlCode }
    };
  } catch (error: any) {
    console.error("Schema generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate schema"
    };
  }
};

// Start a chat session with SQL context
export const startSqlChatSession = (context?: string) => {
  try {
    const model = getModel();
    const chatSession = model.startChat({
      history: context ? [
        {
          role: "user",
          parts: [{ text: "I need help with SQL schema design. Here is my current schema:" }]
        },
        {
          role: "model",
          parts: [{ text: "I'll help you with SQL schema design. What would you like to know or modify?" }]
        }
      ] : [],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    return { 
      success: true,
      chatSession
    };
  } catch (error: any) {
    console.error("Failed to start chat session:", error);
    return {
      success: false,
      error: error.message || "Failed to start chat session"
    };
  }
};
