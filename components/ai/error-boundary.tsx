"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("AI component error:", error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Check for common Gemini API errors
      const isStreamError = this.state.error?.message.includes('stream');
      const isRateLimitError = this.state.error?.message.includes('rate');
      const isQuotaError = this.state.error?.message.includes('quota');
      
      let errorMessage = "An error occurred with the AI service.";
      let actionMessage = "Please try again later.";
      
      if (isStreamError) {
        errorMessage = "Connection issue with AI streaming service.";
        actionMessage = "Try again or use a smaller request.";
      } else if (isRateLimitError || isQuotaError) {
        errorMessage = "API usage limit reached.";
        actionMessage = "Please try again after some time or check your API quota.";
      }
      
      return this.props.fallback || (
        <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">{errorMessage}</h3>
              <p className="text-sm opacity-90 mb-3">{actionMessage}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={this.resetError} variant="secondary">
                  Try Again
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
