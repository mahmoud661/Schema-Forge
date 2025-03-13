"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreamErrorHandlerProps {
  onRetry: () => void;
  onFallback: () => void;
  errorMessage: string;
}

export function StreamErrorHandler({ onRetry, onFallback, errorMessage }: StreamErrorHandlerProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Auto-retry countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto retry when countdown reaches zero
      onFallback();
    }
  }, [countdown, onFallback]);

  const isStreamError = errorMessage.toLowerCase().includes('stream') || 
                        errorMessage.toLowerCase().includes('parse');
  
  return (
    <div className="p-4 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-sm">AI Streaming Connection Issue</h3>
          <p className="mt-1 text-xs">
            {isStreamError ? 
              "There was a problem with the streaming connection." : 
              "There was an issue generating your response."}
          </p>
          
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" className="text-xs h-7" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={onFallback}>
              Switch to standard mode {countdown > 0 && `(${countdown}s)`}
            </Button>
          </div>
          
          {showDetail && (
            <p className="mt-2 text-xs opacity-70 font-mono p-1">
              Error: {errorMessage}
            </p>
          )}
          
          <button 
            className="mt-1 text-xs opacity-70 underline hover:opacity-100"
            onClick={() => setShowDetail(!showDetail)}
          >
            {showDetail ? 'Hide error details' : 'Show error details'}
          </button>
        </div>
      </div>
    </div>
  );
}
