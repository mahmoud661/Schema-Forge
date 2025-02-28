"use client";

import React, { useState, useEffect } from "react";
import { GripVertical, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface BaseSidebarProps {
  title: string;
  defaultWidth?: number;
  width?: number;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showClose?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  bordered?: boolean;
}

export function BaseSidebar({
  title,
  defaultWidth = 320,
  width,
  onWidthChange,
  minWidth = 240,
  maxWidth = 600,
  className,
  headerClassName,
  contentClassName,
  showClose = false,
  onClose,
  children,
  headerActions,
  bordered = true,
}: BaseSidebarProps) {
  // Use external width if provided, otherwise use internal state
  const [internalWidth, setInternalWidth] = useState(defaultWidth);
  const sidebarWidth = width !== undefined ? width : internalWidth;
  const [isDragging, setIsDragging] = useState(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        // Update internal state
        setInternalWidth(newWidth);
        
        // Notify parent if callback provided
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, onWidthChange]);

  return (
    <div className="flex relative" style={{ width: `${sidebarWidth}px` }}>
      <div className={cn(
        "flex-1 bg-background flex flex-col h-full overflow-hidden",
        bordered && "border-r",
        className
      )}>
        {title && (
          <div className={cn(
            "p-4 border-b flex justify-between items-center",
            headerClassName
          )}>
            <h3 className="font-semibold">{title}</h3>
            <div className="flex items-center gap-2">
              {headerActions}
              {showClose && onClose && (
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div className={cn(
          "flex-1 overflow-auto",
          contentClassName
        )}>
          {children}
        </div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-10 flex items-center justify-center opacity-0 hover:opacity-50">
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
