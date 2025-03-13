"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, Bot, Sparkles, Copy, Check, Code, KeyRound, Lock, RefreshCw, XCircle } from "lucide-react";
import { SchemaNode } from "../types/types";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { useSchemaStore } from "@/hooks/use-schema";
import { useGeminiAssistant } from "../hooks/use-gemini-assistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSqlEditor } from "./SQL-Editor/hooks/use-sql-editor";
import { showToast } from "@/components/ui/toast-notification";

interface AiAssistantProps {
  onApplySuggestion: (nodes: any[], edges: any[]) => void;
}

export function AiAssistant({ onApplySuggestion }: AiAssistantProps) {
  // Access schema store directly
  const { schema } = useSchemaStore();
  const { nodes, edges } = schema;

  // Use SQL editor hook to apply SQL suggestions directly
  const sqlEditor = useSqlEditor();

  // Use Gemini assistant hook
  const {
    apiKey,
    isApiKeySet,
    isLoading,
    error,
    messages,
    saveApiKey,
    clearApiKey,
    sendMessage
  } = useGeminiAssistant();

  // Local state
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { widths, updateWidth } = useSidebarStore();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    sendMessage(prompt);
    setPrompt("");
  };

  const handleSaveApiKey = () => {
    if (newApiKey.trim()) {
      const success = saveApiKey(newApiKey.trim());
      if (success) {
        setNewApiKey("");
        setShowKeyDialog(false);
      }
    }
  };

  const handleApplySqlSuggestion = (sql: string) => {
    // Switch to SQL tab immediately to show the process
    const { updateActiveTab } = useSchemaStore.getState();
    updateActiveTab("sql");
    
    // Show toast notification that AI is working
    const dismissToast = showToast({
      title: "AI Schema Application",
      description: "Applying AI-generated SQL changes to your schema...",
      type: 'ai',
    });
    
    // Short delay to ensure UI updates are visible
    setTimeout(() => {
      // Apply SQL changes
      sqlEditor.handleApplySqlSuggestion(sql);
      
      // Dismiss the working toast
      dismissToast();
      
      // Show success toast
      showToast({
        title: "Schema Updated",
        description: "AI changes were successfully applied to your schema",
        type: 'success',
      });
    }, 800);
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderApiKeySetupView = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <KeyRound className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">Gemini API Connection Required</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        To use the AI assistant, you'll need to provide your Google Gemini API key.
      </p>
      
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogTrigger asChild>
          <Button className="mb-4" variant="default">
            <KeyRound className="mr-2 h-4 w-4" />
            Set API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter your Google Gemini API Key</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="apiKey" className="mb-2 block">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="flex-1"
              />
              <Button onClick={handleSaveApiKey} disabled={!newApiKey.trim()}>
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-sm text-muted-foreground">
        <a 
          href="https://ai.google.dev/tutorials/setup" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center justify-center"
        >
          Get a Gemini API key
          <svg className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );

  return (
    <BaseSidebar 
      title="AI Assistant" 
      width={widths.ai}
      onWidthChange={(width) => updateWidth('ai', width)}
      position="left"
      headerActions={
        isApiKeySet && (
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowKeyDialog(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Change API Key</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={clearApiKey}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear API Key</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )
      }
    >
      {!isApiKeySet ? renderApiKeySetupView() : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[95%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4" />
                        <span className="font-semibold text-sm">Gemini AI</span>
                        {message.isStreaming && (
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    )}
                    
                    {/* Render markdown content */}
                    <div className="whitespace-pre-wrap text-sm prose prose-sm dark:prose-invert max-w-none">
                      {message.content.split("```").map((part, i) => {
                        // If this is an even-indexed part, it's regular text
                        if (i % 2 === 0) {
                          return <p key={i}>{part}</p>;
                        }
                        // If it's odd-indexed, it's a code block
                        const codeLines = part.split("\n");
                        const language = codeLines[0];
                        const code = codeLines.slice(1).join("\n");
                        return (
                          <pre key={i} className="bg-background/80 p-2 rounded-md border text-xs overflow-x-auto">
                            <code>{code}</code>
                          </pre>
                        );
                      })}
                    </div>
                    
                    {message.suggestion?.sql && (
                      <div className="mt-3 bg-background/80 p-2 rounded-md border text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            <span className="font-medium text-xs">SQL</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-xs"
                              onClick={() => handleApplySqlSuggestion(message.suggestion?.sql || '')}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Apply
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 text-xs"
                              onClick={() => handleCopyToClipboard(message.suggestion?.sql || '', -index)}
                            >
                              {copiedIndex === -index ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              {copiedIndex === -index ? 'Copied' : 'Copy'}
                            </Button>
                          </div>
                        </div>
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                          {message.suggestion.sql}
                        </pre>
                      </div>
                    )}
                    
                    {message.suggestion?.nodes && (
                      <div className="mt-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => onApplySuggestion(
                            message.suggestion?.nodes || [], 
                            message.suggestion?.edges || []
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                          Apply Suggestion
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[95%] rounded-lg p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-foreground/70 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-foreground/70 rounded-full animate-bounce delay-150"></div>
                        <div className="w-1 h-1 bg-foreground/70 rounded-full animate-bounce delay-300"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {error && (
            <div className="mx-3 mb-2 p-2 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded">
              {error}
            </div>
          )}
          
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask for schema design help..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="resize-none text-sm h-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
              />
              <Button 
                onClick={handleSendPrompt} 
                disabled={isLoading || !prompt.trim()}
                size="sm"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-center mt-2">
              <Tabs defaultValue="sql" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="sql">SQL Help</TabsTrigger>
                  <TabsTrigger value="improve">Improve</TabsTrigger>
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                </TabsList>
                <TabsContent value="sql" className="mt-1">
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Fix SQL syntax errors in my schema")}
                    >
                      Fix errors
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Explain how to optimize my schema")}
                    >
                      Optimize schema
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="improve" className="mt-1">
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Add proper indexes to my tables")}
                    >
                      Add indexes
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Normalize my database design")}
                    >
                      Normalize
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="generate" className="mt-1">
                  <div className="grid grid-cols-2 gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Generate a user authentication system schema")}
                    >
                      Auth system
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7" 
                      onClick={() => setPrompt("Create an e-commerce database schema")}
                    >
                      E-commerce
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </BaseSidebar>
  );
}