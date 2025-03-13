import React, { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSqlCompletion } from "@/lib/gemini-api";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseSqlToSchema } from "../../sqlParser";
import { useSchemaStore } from "@/hooks/use-schema";

interface SqlPreviewProps {
  sqlCode: string;
  dbType: string;
  onApplySuggestion: (sql: string) => void;
}

export function SqlPreview({ sqlCode, dbType, onApplySuggestion }: SqlPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'positive' | 'negative'>('none');
  const { schema, updateSchema } = useSchemaStore();
  
  // Generate an improved SQL suggestion
  const generateSuggestion = async () => {
    setIsGenerating(true);
    setError(null);
    setFeedback('none');
    
    try {
      const prompt = `
        Please optimize and improve this ${dbType} SQL schema:
        
        ${sqlCode}
        
        Consider adding indices, optimizing data types, improving constraints, and fixing any issues.
        Return only the improved SQL code with no additional explanations or comments.
      `;
      
      const result = await generateSqlCompletion(prompt);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate SQL suggestion");
      }
      
      setSuggestion(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle applying the suggestion
  const applySuggestion = () => {
    if (suggestion) {
      onApplySuggestion(suggestion);
      setSuggestion(null);
      setFeedback('none');
    }
  };
  
  // Reset the suggestion
  const resetSuggestion = () => {
    setSuggestion(null);
    setError(null);
    setFeedback('none');
  };
  
  // Handle feedback
  const handleFeedback = async (type: 'positive' | 'negative') => {
    setFeedback(type);
    
    // Optional: Send feedback to improve AI
    if (type === 'negative') {
      // Ask for a new suggestion
      setSuggestion(null);
      setTimeout(() => {
        generateSuggestion();
      }, 500);
    }
  };
  
  // Apply suggestion directly to schema (experimental feature)
  const applyDirectlyToSchema = async () => {
    if (!suggestion) return;
    
    try {
      const schemaData = parseSqlToSchema(suggestion);
      if (schemaData && schemaData.nodes.length > 0) {
        updateSchema({
          nodes: schemaData.nodes,
          edges: schemaData.edges || [],
          ...(schemaData.enumTypes ? { enumTypes: schemaData.enumTypes } : {}),
          sqlCode: suggestion
        });
        resetSuggestion();
      } else {
        setError("Could not parse SQL into a valid schema");
      }
    } catch (err: any) {
      setError(`Failed to apply to schema: ${err.message}`);
    }
  };
  
  if (!sqlCode.trim()) {
    return null;
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-1.5">
        {!suggestion && !isGenerating && !error && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline" 
                size="sm"
                className="h-8 flex gap-1 text-xs"
                onClick={generateSuggestion}
              >
                <Sparkles size={14} className="text-amber-500" />
                AI Optimize
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Get AI suggestions to improve your SQL
            </TooltipContent>
          </Tooltip>
        )}
        
        {isGenerating && (
          <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
            <span className="flex items-center gap-1">
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              Generating...
            </span>
          </Button>
        )}
        
        {error && (
          <Alert variant="destructive" className="p-2">
            <AlertDescription className="text-xs">
              <span>{error}</span>
              <Button variant="ghost" size="sm" className="h-6 px-1.5 ml-2" onClick={resetSuggestion}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {suggestion && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                className="h-8 text-xs"
                onClick={applySuggestion}
              >
                <MousePointer size={14} className="mr-1" />
                Apply Changes
              </Button>
              
              {feedback === 'none' && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleFeedback('positive')}
                      >
                        <ThumbsUp size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Good suggestion</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleFeedback('negative')}
                      >
                        <ThumbsDown size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Try again</TooltipContent>
                  </Tooltip>
                </div>
              )}
              
              {feedback === 'positive' && (
                <span className="text-xs text-green-600 dark:text-green-400">Thanks for your feedback!</span>
              )}
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 ml-auto"
                    onClick={resetSuggestion}
                  >
                    Cancel
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Discard suggestion</TooltipContent>
              </Tooltip>
            </div>
            
            {feedback === 'negative' && !isGenerating && (
              <div className="text-xs text-amber-600 dark:text-amber-400 animate-pulse">
                Generating new suggestion...
              </div>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
