"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  Sparkles,
  Copy,
  Check,
  Code,
  KeyRound,
  Lock,
  RefreshCw,
  XCircle,
  ChevronRight,
  Smile,
} from "lucide-react";
import { SchemaNode } from "../types/types";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { useSchemaStore } from "@/hooks/use-schema";
import { useGeminiAssistant } from "../hooks/use-gemini-assistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSqlEditor } from "./SQL-Editor/hooks/use-sql-editor";
import { showToast } from "@/components/ui/toast-notification";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    sendMessage,
  } = useGeminiAssistant();

  // Local state
  const [prompt, setPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { widths, updateWidth } = useSidebarStore();

  // New state for character count and suggested prompts
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Quick suggestions for the chips above the input - enhanced with more options
  const quickSuggestions = [
    { text: "Optimize schema", icon: <Sparkles className="h-3 w-3" /> },

    { text: "Normalize database", icon: <Bot className="h-3 w-3" /> },
    {
      text: "Create e-commerce schema",
      icon: <Sparkles className="h-3 w-3" />,
    },
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPrompt(value);
    setCharCount(value.length);
  };

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    sendMessage(prompt);
    setPrompt("");
    setCharCount(0);
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
      type: "ai",
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
        type: "success",
      });
    }, 800);
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Format timestamp to readable time with AM/PM
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderApiKeySetupView = () => (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <KeyRound className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">
        Gemini API Connection Required
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        To use the AI assistant, you'll need to provide your Google Gemini API
        key.
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
            <Label htmlFor="apiKey" className="mb-2 block">
              API Key
            </Label>
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
          <svg
            className="h-3 w-3 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );

  return (
    <BaseSidebar
      title="AI Assistant"
      width={widths.ai}
      onWidthChange={(width) => updateWidth("ai", width)}
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
      {!isApiKeySet ? (
        renderApiKeySetupView()
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={cn(
                        "max-w-[95%] rounded-lg p-4 shadow",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-card border border-border/50 mr-8"
                      )}
                      style={{
                        boxShadow:
                          message.role === "user"
                            ? "0 2px 10px rgba(0, 0, 0, 0.1)"
                            : "0 2px 8px rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/40">
                          <div className="flex items-center gap-2">
                            <div className="bg-primary/10 p-1.5 rounded-md">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm">
                              Gemini AI
                            </span>
                            {message.isStreaming && (
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 rounded-md"
                          >
                            {formatTime(message.timestamp)}
                          </Badge>
                        </div>
                      )}

                      {message.role === "user" && (
                        <div className="flex justify-between items-center mb-1 pb-1 border-b border-primary-foreground/20">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 rounded-md border-primary-foreground/30 text-primary-foreground/80"
                          >
                            {formatTime(message.timestamp)}
                          </Badge>
                          <span className="font-medium text-xs">You</span>
                        </div>
                      )}

                      {/* Enhanced markdown rendering */}
                      <div
                        className={`prose dark:prose-invert max-w-none ${
                          message.role === "user"
                            ? "prose-invert text-primary-foreground/90"
                            : "text-foreground/90"
                        }`}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({
                              node,
                              inline,
                              className,
                              children,
                              ...props
                            }) {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  {...props}
                                  style={atomDark}
                                  language={match[1]}
                                  PreTag="div"
                                  className="text-xs rounded-md !mt-2 !mb-2"
                                >
                                  {String(children).replace(/\n$/, "")}
                                </SyntaxHighlighter>
                              ) : (
                                <code
                                  {...props}
                                  className={cn(
                                    "px-1 py-0.5 bg-muted rounded-sm text-sm",
                                    className
                                  )}
                                >
                                  {children}
                                </code>
                              );
                            },
                            p({ children }) {
                              return (
                                <p className="mb-2 last:mb-0 text-sm">
                                  {children}
                                </p>
                              );
                            },
                            ul({ children }) {
                              return (
                                <ul className="list-disc pl-5 my-2 text-sm">
                                  {children}
                                </ul>
                              );
                            },
                            ol({ children }) {
                              return (
                                <ol className="list-decimal pl-5 my-2 text-sm">
                                  {children}
                                </ol>
                              );
                            },
                            h1({ children }) {
                              return (
                                <h1 className="text-lg font-bold mt-3 mb-1">
                                  {children}
                                </h1>
                              );
                            },
                            h2({ children }) {
                              return (
                                <h2 className="text-md font-bold mt-2 mb-1">
                                  {children}
                                </h2>
                              );
                            },
                            h3({ children }) {
                              return (
                                <h3 className="text-md font-semibold mt-2 mb-1">
                                  {children}
                                </h3>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {message.suggestion?.sql && (
                        <div className="mt-3 bg-background/80 p-2.5 rounded-md border text-xs backdrop-blur">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              <span className="font-medium text-xs">SQL</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-6 text-xs bg-primary/10 hover:bg-primary/20"
                                onClick={() =>
                                  handleApplySqlSuggestion(
                                    message.suggestion?.sql || ""
                                  )
                                }
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Apply
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={() =>
                                  handleCopyToClipboard(
                                    message.suggestion?.sql || "",
                                    -index
                                  )
                                }
                              >
                                {copiedIndex === -index ? (
                                  <Check className="h-3 w-3 mr-1" />
                                ) : (
                                  <Copy className="h-3 w-3 mr-1" />
                                )}
                                {copiedIndex === -index ? "Copied" : "Copy"}
                              </Button>
                            </div>
                          </div>
                          <SyntaxHighlighter
                            style={atomDark}
                            language="sql"
                            className="text-xs rounded-md overflow-auto max-h-[300px]"
                          >
                            {message.suggestion.sql}
                          </SyntaxHighlighter>
                        </div>
                      )}

                      {message.suggestion?.nodes && (
                        <div className="mt-3 bg-background/80 p-2 rounded-md border text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">
                              Schema Changes
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1 text-xs h-6 bg-primary/10 hover:bg-primary/20"
                              onClick={() =>
                                onApplySuggestion(
                                  message.suggestion?.nodes || [],
                                  message.suggestion?.edges || []
                                )
                              }
                            >
                              <Sparkles className="h-3 w-3" />
                              Apply Changes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[95%] rounded-lg p-4 bg-card border border-border/40 shadow-sm mr-8">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-md">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">Gemini AI</span>
                      <div className="flex items-center gap-1 ml-1">
                        <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-foreground/70 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {error && (
            <div className="mx-3 mb-2 p-2.5 bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded">
              {error}
            </div>
          )}

          <div className="p-3 border-t">
            {/* Enhanced quick suggestion chips - replacing tabs */}
            <div className="flex flex-wrap gap-2 mb-3">
              <h4 className="w-full text-xs font-medium text-muted-foreground mb-1.5">
                Quick suggestions:
              </h4>
              {quickSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  onClick={() => setPrompt(suggestion.text)}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-xs cursor-pointer transition-colors border border-border/30"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mr-1.5 bg-primary/20 p-1 rounded-full">
                    {suggestion.icon}
                  </div>
                  <span>{suggestion.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="relative">
              <Textarea
                ref={inputRef}
                placeholder="Ask me about schema design, SQL help, or database optimization..."
                value={prompt}
                onChange={handlePromptChange}
                className="resize-none text-sm pr-12 min-h-[80px] transition-all duration-200 focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
              />

              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <Button
                  onClick={handleSendPrompt}
                  disabled={isLoading || !prompt.trim()}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseSidebar>
  );
}
