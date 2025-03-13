"use client";

import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastOptions {
  title?: string;
  description: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'ai';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

// Create a function to show toast notifications
export function showToast(options: ToastOptions) {
  const position = options.position || 'top-right';
  
  // Create container if it doesn't exist
  let toastContainer = document.getElementById(`toast-container-${position}`);
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = `toast-container-${position}`;
    
    // Position based on requested location
    let positionStyles = '';
    switch (position) {
      case 'top-right':
        positionStyles = 'top: 1rem; right: 1rem; align-items: flex-end;';
        break;
      case 'top-center':
        positionStyles = 'top: 1rem; left: 50%; transform: translateX(-50%); align-items: center;';
        break;
      case 'bottom-right':
        positionStyles = 'bottom: 1rem; right: 1rem; align-items: flex-end;';
        break;
      case 'bottom-center':
        positionStyles = 'bottom: 1rem; left: 50%; transform: translateX(-50%); align-items: center;';
        break;
    }
    
    toastContainer.style.cssText = `position: fixed; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; max-width: 420px; width: auto; ${positionStyles}`;
    document.body.appendChild(toastContainer);
  }
  
  // Create the toast element
  const toast = document.createElement('div');
  toast.className = 'toast-notification translate-x-full opacity-0 transition-all duration-300';
  toast.style.cssText = 'transform: translateX(100%); opacity: 0; min-width: 300px;';
  toastContainer.appendChild(toast);
  
  // Mount react component in toast
  const root = createRoot(toast);
  
  // Get icon and colors based on type
  const getIconAndColors = () => {
    switch(options.type) {
      case 'success':
        return { 
          icon: <CheckCircle className="h-5 w-5" />,
          bg: 'bg-green-50 dark:bg-green-950/30',
          border: 'border-green-200 dark:border-green-800/50',
          text: 'text-green-800 dark:text-green-400',
          shadow: 'shadow-lg shadow-green-500/10'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800/50',
          text: 'text-red-800 dark:text-red-400',
          shadow: 'shadow-lg shadow-red-500/10'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800/50',
          text: 'text-amber-800 dark:text-amber-400',
          shadow: 'shadow-lg shadow-amber-500/10'
        };
      case 'ai':
        return {
          icon: <span className="flex h-5 w-5 items-center justify-center bg-violet-600 text-white rounded-full text-xs font-bold">AI</span>,
          bg: 'bg-violet-50 dark:bg-violet-950/30',
          border: 'border-violet-200 dark:border-violet-800/50',
          text: 'text-violet-800 dark:text-violet-400',
          shadow: 'shadow-lg shadow-violet-500/10'
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800/50',
          text: 'text-blue-800 dark:text-blue-400',
          shadow: 'shadow-lg shadow-blue-500/10'
        };
    }
  };
  
  const { icon, bg, border, text, shadow } = getIconAndColors();
  
  root.render(
    <div className={`rounded-lg ${shadow} border ${bg} ${border} p-4 w-full flex gap-3 items-start`}>
      <div className={`${text} flex-shrink-0 mt-0.5`}>{icon}</div>
      <div className="flex-1 min-w-0">
        {options.title && <h4 className="font-medium text-sm mb-0.5">{options.title}</h4>}
        <p className="text-sm text-muted-foreground">{options.description}</p>
        
        {options.action && (
          <button 
            onClick={options.action.onClick}
            className="mt-2 text-xs font-medium bg-background/50 hover:bg-background/80 px-2 py-1 rounded"
          >
            {options.action.label}
          </button>
        )}
      </div>
      <button 
        onClick={() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(100%)';
          
          setTimeout(() => {
            if (toastContainer?.contains(toast)) {
              toastContainer.removeChild(toast);
            }
          }, 300);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  
  // Remove toast after duration
  const timeoutId = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    
    setTimeout(() => {
      if (toastContainer && toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
      
      // Remove container if empty
      if (toastContainer?.childNodes.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  }, options.duration || 5000);
  
  // Return function to dismiss manually
  return () => {
    clearTimeout(timeoutId);
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toastContainer?.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  };
}
