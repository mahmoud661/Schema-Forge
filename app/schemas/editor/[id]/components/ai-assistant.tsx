"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, Sparkles, Copy, Check, Code } from "lucide-react";
import { SchemaNode } from "../types";

interface AiAssistantProps {
  nodes: SchemaNode[];
  edges: any[];
  onApplySuggestion: (nodes: SchemaNode[], edges: any[]) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestion?: {
    nodes?: SchemaNode[];
    edges?: any[];
    sql?: string;
  };
}

export function AiAssistant({ nodes, edges, onApplySuggestion }: AiAssistantProps) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you design and modify your database schema. You can ask me to create tables, add relationships, or suggest improvements to your current schema.'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentSchema, setCurrentSchema] = useState({ nodes, edges });

  // Update current schema when props change
  useEffect(() => {
    setCurrentSchema({ nodes, edges });
  }, [nodes, edges]);

  const handleSendPrompt = () => {
    if (!prompt.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: prompt
    };
    
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setIsLoading(true);
    
    // Simulate AI response (in a real app, this would be an API call)
    setTimeout(() => {
      const aiResponse = generateAiResponse(prompt, currentSchema.nodes, currentSchema.edges);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAiResponse = (userPrompt: string, currentNodes: SchemaNode[], currentEdges: any[]): Message => {
    // This is a simplified mock of AI responses
    // In a real application, this would call an actual AI service
    
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Example responses based on keywords
    if (lowerPrompt.includes('add table') || lowerPrompt.includes('create table')) {
      const tableName = lowerPrompt.includes('users') ? 'Users' : 
                        lowerPrompt.includes('products') ? 'Products' : 
                        lowerPrompt.includes('orders') ? 'Orders' : 'NewTable';
      
      // Create a sample table based on the request
      const newNode: SchemaNode = {
        id: `ai-${Date.now()}`,
        type: 'databaseSchema',
        position: { x: 100, y: 100 },
        data: {
          label: tableName,
          schema: [
            { title: "id", type: "uuid", constraints: ["primary", "notnull"], id: `col-${Date.now()}-1` },
            { title: "created_at", type: "timestamp", constraints: ["notnull"], id: `col-${Date.now()}-2` },
            { title: "updated_at", type: "timestamp", constraints: ["notnull"], id: `col-${Date.now()}-3` },
          ]
        }
      };
      
      // Add specific fields based on table type
      if (tableName === 'Users') {
        newNode.data.schema.push(
          { title: "email", type: "varchar", constraints: ["unique", "notnull"], id: `col-${Date.now()}-4` },
          { title: "password_hash", type: "varchar", constraints: ["notnull"], id: `col-${Date.now()}-5` }
        );
      } else if (tableName === 'Products') {
        newNode.data.schema.push(
          { title: "name", type: "varchar", constraints: ["notnull"], id: `col-${Date.now()}-4` },
          { title: "price", type: "money", constraints: ["notnull"], id: `col-${Date.now()}-5` },
          { title: "description", type: "text", id: `col-${Date.now()}-6` }
        );
      } else if (tableName === 'Orders') {
        newNode.data.schema.push(
          { title: "user_id", type: "uuid", constraints: ["notnull"], id: `col-${Date.now()}-4` },
          { title: "total_amount", type: "money", constraints: ["notnull"], id: `col-${Date.now()}-5` },
          { title: "status", type: "varchar", constraints: ["notnull"], id: `col-${Date.now()}-6` }
        );
      }
      
      // Generate SQL for this table
      const sql = generateTableSql(newNode);
      
      return {
        role: 'assistant',
        content: `I've created a ${tableName} table with some common fields. You can apply this suggestion to add it to your schema.`,
        suggestion: {
          nodes: [...currentNodes, newNode],
          edges: currentEdges,
          sql
        }
      };
    } 
    else if (lowerPrompt.includes('relationship') || lowerPrompt.includes('connect')) {
      // If we have at least two tables, suggest a relationship
      if (currentNodes.length >= 2) {
        const sourceNode = currentNodes[0];
        const targetNode = currentNodes[1];
        
        const newEdge = {
          id: `ai-edge-${Date.now()}`,
          source: sourceNode.id,
          target: targetNode.id,
          sourceHandle: `source-${sourceNode.data.schema[0].title}`,
          targetHandle: `target-${targetNode.data.schema[0].title}`,
          type: 'smoothstep',
          animated: true,
          label: 'has many',
          data: {
            relationshipType: 'oneToMany'
          }
        };
        
        // Generate SQL for this relationship
        const sql = `-- Add foreign key relationship
ALTER TABLE ${sourceNode.data.label.toLowerCase()} 
ADD CONSTRAINT fk_${sourceNode.data.label.toLowerCase()}_${targetNode.data.label.toLowerCase()} 
FOREIGN KEY (${sourceNode.data.schema[0].title}) 
REFERENCES ${targetNode.data.label.toLowerCase()}(${targetNode.data.schema[0].title});`;
        
        return {
          role: 'assistant',
          content: `I've created a relationship between ${sourceNode.data.label} and ${targetNode.data.label}. You can apply this suggestion to add it to your schema.`,
          suggestion: {
            nodes: currentNodes,
            edges: [...currentEdges, newEdge],
            sql
          }
        };
      } else {
        return {
          role: 'assistant',
          content: 'You need at least two tables to create a relationship. Please add more tables first.'
        };
      }
    }
    else if (lowerPrompt.includes('optimize') || lowerPrompt.includes('improve')) {
      // Suggest adding indexes to tables
      const optimizedNodes = currentNodes.map(node => {
        // Find string columns that might benefit from indexes
        const updatedSchema = node.data.schema.map(column => {
          if ((column.type === 'varchar' || column.type === 'text') && 
              !column.constraints?.includes('index') && 
              !column.constraints?.includes('primary')) {
            return {
              ...column,
              constraints: [...(column.constraints || []), 'index']
            };
          }
          return column;
        });
        
        return {
          ...node,
          data: {
            ...node.data,
            schema: updatedSchema
          }
        };
      });
      
      // Generate SQL for the indexes
      let sql = "-- Add indexes for better performance\n";
      optimizedNodes.forEach(node => {
        node.data.schema.forEach(column => {
          if (column.constraints?.includes('index') && !column.constraints.includes('primary')) {
            sql += `CREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});\n`;
          }
        });
      });
      
      return {
        role: 'assistant',
        content: 'I\'ve analyzed your schema and added indexes to columns that might benefit from them for better query performance.',
        suggestion: {
          nodes: optimizedNodes,
          edges: currentEdges,
          sql
        }
      };
    }
    else if (lowerPrompt.includes('generate sql') || lowerPrompt.includes('show sql')) {
      // Generate SQL for the entire schema
      let sql = "-- Complete schema SQL\n\n";
      
      // Tables
      currentNodes.forEach(node => {
        sql += generateTableSql(node);
        sql += "\n\n";
      });
      
      // Relationships
      if (currentEdges.length > 0) {
        sql += "-- Foreign Key Constraints\n";
        currentEdges.forEach(edge => {
          const sourceNode = currentNodes.find(n => n.id === edge.source);
          const targetNode = currentNodes.find(n => n.id === edge.target);
          
          if (sourceNode && targetNode) {
            const sourceColumn = edge.sourceHandle?.split('-')[1] || 'id';
            const targetColumn = edge.targetHandle?.split('-')[1] || 'id';
            
            sql += `ALTER TABLE ${sourceNode.data.label.toLowerCase()} ADD CONSTRAINT fk_${sourceNode.data.label.toLowerCase()}_${targetNode.data.label.toLowerCase()} `;
            sql += `FOREIGN KEY (${sourceColumn}) REFERENCES ${targetNode.data.label.toLowerCase()}(${targetColumn});\n`;
          }
        });
      }
      
      return {
        role: 'assistant',
        content: 'Here\'s the SQL for your current schema:',
        suggestion: {
          sql
        }
      };
    }
    else {
      // Default response
      return {
        role: 'assistant',
        content: 'I can help you design your database schema. Try asking me to add tables, create relationships, or optimize your schema. You can also ask me to generate SQL for your current schema.'
      };
    }
  };

  const generateTableSql = (node: SchemaNode): string => {
    let sql = `CREATE TABLE IF NOT EXISTS ${node.data.label.toLowerCase()} (\n`;
    
    node.data.schema.forEach((column, index) => {
      sql += `  ${column.title} ${column.type}`;
      
      if (column.constraints) {
        if (column.constraints.includes('primary')) {
          sql += ' PRIMARY KEY';
        }
        if (column.constraints.includes('notnull')) {
          sql += ' NOT NULL';
        }
        if (column.constraints.includes('unique')) {
          sql += ' UNIQUE';
        }
      }
      
      if (index < node.data.schema.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });
    
    sql += ');';
    
    // Add indexes
    node.data.schema.forEach(column => {
      if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
        sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
      }
    });
    
    return sql;
  };

  const handleApplySuggestion = (suggestion: Message['suggestion']) => {
    if (suggestion?.nodes) {
      onApplySuggestion(suggestion.nodes, suggestion.edges || edges);
    }
  };

  const handleCopyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-80 border-r bg-background h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">AI Assistant</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
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
                    <span className="font-semibold text-sm">AI Assistant</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                
                {message.suggestion?.sql && (
                  <div className="mt-3 bg-background/80 p-2 rounded-md border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        <span className="font-medium text-xs">SQL</span>
                      </div>
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
                      onClick={() => handleApplySuggestion(message.suggestion)}
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
                  <div className="flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask for help with your schema..."
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
      </div>
    </div>
  );
}