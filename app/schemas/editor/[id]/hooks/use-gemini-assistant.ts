import { useState, useEffect } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { 
  generateSqlCompletion, 
  streamSqlCompletion, 
  streamSchemaFromDescription, 
  initGeminiAPI 
} from "@/lib/gemini-api";
import { parseSqlToSchema } from "../components/SQL-Editor/sqlParser";
import { showToast } from "@/components/ui/toast-notification";
import { useSqlEditor } from "../components/SQL-Editor/hooks/use-sql-editor";
import { useSqlEditorStore } from "../store/sql-editor-store"; // Add this import

interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  suggestion?: {
    nodes?: any[];
    edges?: any[];
    sql?: string;
  };
  id: string;
  timestamp: number;
}

export function useGeminiAssistant() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<GeminiMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you design your database schema with AI-powered suggestions. Enter your API key to get started.',
      id: 'welcome-msg',
      timestamp: Date.now()
    }
  ]);

  const { schema } = useSchemaStore();

  // Initialize API with stored key on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      try {
        initGeminiAPI(storedKey);
        setIsApiKeySet(true);
        setMessages([
          {
            role: 'assistant',
            content: 'I\'m ready to help with your schema design. You can ask questions about SQL, request schema improvements, or generate new tables.',
            id: 'init-msg',
            timestamp: Date.now()
          }
        ]);
      } catch (err: any) {
        setError(err.message);
      }
    }
  }, []);

  // Save API key when it changes
  const saveApiKey = (key: string) => {
    try {
      initGeminiAPI(key);
      localStorage.setItem('gemini_api_key', key);
      setApiKey(key);
      setIsApiKeySet(true);
      setError(null);
      setMessages([
        {
          role: 'assistant',
          content: 'API key saved! I\'m ready to help with your schema design. You can ask questions about SQL, request schema improvements, or generate new tables.',
          id: `msg-${Date.now()}`,
          timestamp: Date.now()
        }
      ]);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // Clear API key
  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey(null);
    setIsApiKeySet(false);
  };

  // Generate context from current schema
  const generateSchemaContext = () => {
    if (!schema.sqlCode || schema.nodes.length === 0) {
      return "No existing schema available. Let's start from scratch.";
    }
    
    return `Here's my current schema:\n\`\`\`sql\n${schema.sqlCode}\n\`\`\``;
  };

  // Get SQL Editor hook functions
  const sqlEditor = useSqlEditor();

  // Send a message to the assistant
  const sendMessage = async (prompt: string) => {
    if (!isApiKeySet || !apiKey) {
      setError("API key not configured. Please set your API key first.");
      return;
    }
    
    // Add user message immediately
    const userMessage: GeminiMessage = {
      role: 'user',
      content: prompt,
      id: `user-${Date.now()}`,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate context from current schema
      const context = generateSchemaContext();
      
      // Check more comprehensively for schema generation requests
      const isSchemaRequest = 
        prompt.toLowerCase().match(/generat(e|ing)(\s+a)?\s+(database|schema|tables)/i) ||
        prompt.toLowerCase().match(/creat(e|ing)(\s+a)?\s+(database|schema|tables)/i) ||
        prompt.toLowerCase().match(/design(\s+a)?\s+(database|schema)/i) ||
        prompt.toLowerCase().match(/build(\s+a)?\s+(database|schema)/i) ||
        prompt.toLowerCase().match(/make(\s+a)?\s+(database|schema)/i) ||
        prompt.toLowerCase().match(/add(\s+a)?\s+(database|schema)/i) ||
        prompt.toLowerCase().match(/schema\s+for\s+[a-z\s]+(site|website|application|app|system|platform)/i) ||
        prompt.toLowerCase().match(/database\s+for\s+[a-z\s]+(site|website|application|app|system|platform)/i) ||
        prompt.toLowerCase().match(/tables\s+for\s+[a-z\s]+(site|website|application|app|system|platform)/i) ||
        prompt.toLowerCase().includes('e-commerce database') ||
        prompt.toLowerCase().includes('database schema') ||
        prompt.toLowerCase().includes('e-commerce schema');
      
      if (isSchemaRequest) {
        try {
          await handleSchemaGeneration(prompt);
        } catch (schemaErr: any) {
          // Special error handling for schema generation
          showToast({
            title: "Schema Generation Error",
            description: schemaErr.message.includes("parse stream") ? 
              "Connection issue detected. Try using a shorter, more focused description." :
              `Error: ${schemaErr.message}`,
            type: 'error',
            duration: 6000
          });
          
          // Add user-friendly error message to the chat
          const errorMessage: GeminiMessage = {
            role: 'assistant',
            content: `I had trouble generating the schema. ${schemaErr.message.includes("parse stream") ? 
              "There seems to be a connection issue. Try again with a shorter, more focused description." : 
              `Error: ${schemaErr.message}.`} Would you like me to try again with a simpler approach?`,
            id: `assistant-${Date.now()}`,
            timestamp: Date.now()
          };
          
          setMessages(prev => prev.filter(m => !m.isStreaming).concat([errorMessage]));
        }
      } else {
        try {
          await handleRegularQuery(prompt, context);
        } catch (queryErr: any) {
          // Handle regular query errors
          showToast({
            title: "AI Assistant Error",
            description: queryErr.message.includes("parse stream") ? 
              "Connection issue detected. Try a shorter question." : 
              `Error: ${queryErr.message}`,
            type: 'error',
            duration: 5000
          });
          
          // Add user-friendly error message
          const errorMessage: GeminiMessage = {
            role: 'assistant',
            content: `I encountered an issue while processing your question. ${queryErr.message.includes("parse stream") ? 
              "There was a connection problem. Could you try asking a shorter question?" : 
              `The error was: ${queryErr.message}.`}`,
            id: `assistant-${Date.now()}`,
            timestamp: Date.now()
          };
          
          setMessages(prev => prev.filter(m => !m.isStreaming).concat([errorMessage]));
        }
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      
      // For errors that aren't caught earlier
      const errorMessage: GeminiMessage = {
        role: 'assistant',
        content: `I encountered an error: ${err.message}. Please try again with a different question.`,
        id: `error-${Date.now()}`,
        timestamp: Date.now()
      };
      
      setMessages(prev => prev.filter(m => !m.isStreaming).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function for schema generation requests
  const handleSchemaGeneration = async (prompt: string) => {
    console.log('[AI Debug] Starting schema generation, requesting AI editing mode');
    
    // First add a streaming message placeholder that clearly indicates the action
    const streamingMsgId = `assistant-streaming-${Date.now()}`;
    const processingMessage: GeminiMessage = {
      role: 'assistant',
      content: "I'll generate a complete database schema directly in the SQL editor based on your request. Please check the SQL tab to see the schema being created in real-time.",
      isStreaming: true,
      id: streamingMsgId,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    // Give user a moment to see the intent message before starting the process
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Start AI editing mode in SQL editor - get control interface
    const aiEditor = sqlEditor.startAiEditing();
    console.log('[AI Debug] AI Editor interface received:', !!aiEditor);
    
    // Get current SQL editor settings
    const currentSettings = {
      caseSensitiveIdentifiers: useSchemaStore.getState().schema.settings?.caseSensitiveIdentifiers || false,
      useInlineConstraints: useSchemaStore.getState().schema.settings?.useInlineConstraints !== undefined 
        ? useSchemaStore.getState().schema.settings.useInlineConstraints 
        : true,
      dbType: sqlEditor.dbType || "postgresql"
    };
    
    console.log('[AI Debug] Using SQL settings:', currentSettings);
    
    // Update the message to indicate active generation
    setMessages(prev => prev.map(msg => 
      msg.id === streamingMsgId 
        ? { 
            ...msg, 
            content: "I'll generate a complete database schema directly in the SQL editor based on your request. Please check the SQL tab to see the schema being created in real-time.\n\n*Schema generation in progress...*"
          }
        : msg
    ));
    
    // Show active AI toast
    const dismissToast = showToast({
      title: "AI Schema Generation",
      description: "Generating your database schema in SQL Editor...",
      type: 'ai',
      duration: 15000 // Longer timeout for schema generation
    });
    
    // Variable to track whether we used fallback mode
    let usedFallback = false;
    
    try {
      console.log('[AI Debug] Starting schema stream generation with user settings');
      // Start streaming response with our improved streaming function, passing settings
      const result = await streamSchemaFromDescription(
        prompt,
        // On each chunk
        (chunk) => {
          console.log('[AI Debug] Received chunk, length:', chunk.length);
          // Update the SQL editor with chunk
          aiEditor.updateStreamingContent(prev => prev + chunk);
          
          // Update the streaming message with status
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMsgId 
              ? { ...msg, content: 'Generating schema directly in the SQL editor...\n\n_See the SQL tab for live updates._' }
              : msg
          ));
        },
        // On complete - nothing additional to do
        () => {
          console.log('[AI Debug] Schema generation complete');
        },
        // Pass the current editor settings to instruct AI formatting
        currentSettings
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate schema");
      }
      
      usedFallback = result.usingFallback || false;
      
      // Finish AI editing
      console.log('[AI Debug] Finishing AI editing mode');
      aiEditor.finishEditing(true); // Pass true to indicate successful completion
      
      // Clear the toast
      dismissToast();
      
      // Apply SQL to schema store
      try {
        const parsedSchema = parseSqlToSchema(result.data?.sql || '');
        if (parsedSchema && parsedSchema.nodes.length > 0) {
          // Update the schema store
          useSchemaStore.getState().updateSchema({
            nodes: parsedSchema.nodes,
            edges: parsedSchema.edges || [],
            sqlCode: result.data?.sql || '',
            ...(parsedSchema.enumTypes ? { enumTypes: parsedSchema.enumTypes } : {})
          });
          
          // Force the SQL Editor store to sync with the updated schema
          useSqlEditorStore.getState().setSqlCode(result.data?.sql || '');
          useSqlEditorStore.getState().setIsEditing(false);
          
          // More detailed success toast with counts
          showToast({
            title: "Schema Generated Successfully",
            description: `Created ${parsedSchema.nodes.length} tables with ${
              parsedSchema.edges?.length || 0
            } relationships and ${
              parsedSchema.enumTypes?.length || 0
            } enum types.`,
            type: 'success',
            duration: 6000,
            action: {
              label: "View Schema",
              onClick: () => {
                // Switch to visual tab to see the schema
                useSchemaStore.getState().updateActiveTab("visual");
              }
            },
            position: 'top-center'
          });
          
          // Add a more detailed success message that includes what was created
          const successMessage: GeminiMessage = {
            role: 'assistant',
            content: `I've created a complete schema with ${parsedSchema.nodes.length} tables, ${
              parsedSchema.edges?.length || 0
            } relationships, and ${
              parsedSchema.enumTypes?.length || 0
            } enum types based on your description.`,
            suggestion: {
              sql: result.data?.sql // Include for reference
            },
            id: `assistant-${Date.now()}`,
            timestamp: Date.now()
          };
          
          setMessages(prev => {
            // Remove the streaming message
            const filtered = prev.filter(m => m.id !== streamingMsgId);
            return [...filtered, successMessage];
          });
        }
      } catch (parseErr) {
        // Handle schema parsing error
        console.error("Schema parsing error:", parseErr);
        showToast({
          title: "Schema Parsing Error",
          description: "Generated schema could not be parsed. Please try again.",
          type: 'error',
          duration: 6000
        });
        
        // Add error message to the chat
        const errorMessage: GeminiMessage = {
          role: 'assistant',
          content: `I generated a schema but encountered an error while parsing it: ${parseErr.message}. Please try again.`,
          id: `error-${Date.now()}`,
          timestamp: Date.now()
        };
        
        setMessages(prev => prev.filter(m => m.id !== streamingMsgId).concat([errorMessage]));
      }
      
      // Success toast
      showToast({
        title: "Schema Generated",
        description: usedFallback 
          ? "Schema created successfully (fallback mode)" 
          : "Schema created successfully",
        type: 'success',
        duration: 4000
      });
    } catch (error: any) {
      console.error("[AI Debug] Schema generation error:", error);
      // Clean up
      dismissToast();
      console.log('[AI Debug] Canceling AI editing mode due to error');
      aiEditor.cancel && aiEditor.cancel();
      
      // Handle schema generation error
      console.error("Schema generation error:", error);
      
      // Special handling for stream parsing errors
      if (error.message.includes("parse stream") || error.message.includes("SWITCH_TO_NON_STREAMING")) {
        // Try again with regular non-streaming method
        try {
          showToast({
            title: "Connection Issue Detected",
            description: "Switching to alternative generation method...",
            type: 'warning',
            duration: 4000
          });
          
          const fallbackResult = await generateSchemaFromDescription(prompt);
          if (fallbackResult.success && fallbackResult.data?.sql) {
            // Apply to SQL editor manually
            aiEditor.updateStreamingContent(fallbackResult.data.sql);
            aiEditor.finishEditing();
            
            // Update message
            const successMessage: GeminiMessage = {
              role: 'assistant',
              content: 'I\'ve created a schema using an alternative method and applied it to the SQL Editor.',
              suggestion: {
                sql: fallbackResult.data.sql
              },
              id: `assistant-${Date.now()}`,
              timestamp: Date.now()
            };
            
            setMessages(prev => {
              // Remove the streaming message
              const filtered = prev.filter(m => m.id !== streamingMsgId);
              return [...filtered, successMessage];
            });
            
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback generation also failed:", fallbackError);
          // Continue to the general error handler
        }
      }
      
      // Remove streaming message and add error message
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== streamingMsgId);
        return [...filtered, {
          role: 'assistant',
          content: `I encountered an error generating the schema: ${error.message.includes("parse stream") ? 
            "There was a problem with the connection to the AI service." : 
            error.message}. Would you like to try again with a simpler description?`,
          id: `error-${Date.now()}`,
          timestamp: Date.now()
        }];
      });
      
      // Re-throw for the caller to handle
      throw error;
    }
  };
  
  // Helper function for regular queries
  const handleRegularQuery = async (prompt: string, context: string) => {
    // Setup streaming message
    const streamingMsgId = `assistant-streaming-${Date.now()}`;
    const streamingMessage: GeminiMessage = {
      role: 'assistant',
      content: '',
      isStreaming: true,
      id: streamingMsgId,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, streamingMessage]);
    
    // Track SQL code blocks
    let streamedContent = '';
    let extractedSql = null;
    let isSqlSection = false;
    
    try {
      // Stream the response with improved error handling
      const result = await streamSqlCompletion(
        prompt, 
        context,
        (chunk) => {
          // Process the incoming chunk for SQL code blocks
          if (chunk.includes('```sql')) {
            isSqlSection = true;
            extractedSql = extractedSql || '';
            
            // Extract just the start of the SQL block
            const parts = chunk.split('```sql');
            if (parts.length > 1) {
              streamedContent += parts[0] + '```sql';
              extractedSql += parts[1];
            } else {
              streamedContent += chunk;
            }
          } 
          else if (chunk.includes('```') && isSqlSection) {
            isSqlSection = false;
            
            // Extract the end of the SQL block
            const parts = chunk.split('```');
            if (parts.length > 1) {
              extractedSql += parts[0];
              streamedContent += '```' + parts[1];
            } else {
              streamedContent += chunk;
            }
          }
          else if (isSqlSection) {
            extractedSql += chunk;
            streamedContent += chunk;
          }
          else {
            streamedContent += chunk;
          }
          
          // Update the message as we get chunks
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMsgId 
                ? { ...msg, content: streamedContent } 
                : msg
            )
          );
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate response");
      }
      
      // Replace streaming message with final message
      const assistantMessage: GeminiMessage = {
        role: 'assistant',
        content: streamedContent.trim(),
        ...(extractedSql ? { suggestion: { sql: extractedSql.trim() } } : {}),
        id: `assistant-${Date.now()}`,
        timestamp: Date.now()
      };
      
      setMessages(prev => {
        // Remove the streaming message
        const filtered = prev.filter(m => m.id !== streamingMsgId);
        return [...filtered, assistantMessage];
      });
      
      // If we used fallback mode, add a note
      if (result.usingFallback) {
        showToast({
          title: "Streaming Mode Disabled",
          description: "Using regular response mode due to connection issues",
          type: 'info',
          duration: 3000
        });
      }
    } catch (error: any) {
      // Clean up the streaming message
      setMessages(prev => prev.filter(m => m.id !== streamingMsgId));
      throw error;
    }
  };

  return {
    apiKey,
    isApiKeySet,
    isLoading,
    error,
    messages,
    saveApiKey,
    clearApiKey,
    sendMessage
  };
}
