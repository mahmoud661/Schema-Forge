"use client";

import React, { useState, useEffect, useRef } from "react";
import { GripVertical, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  collapsible?: boolean;
  position?: "left" | "right"; // New prop to specify position
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
  collapsible = true,
  position = "right", // Default to right position
}: BaseSidebarProps) {
  // Use external width if provided, otherwise use internal state
  const [internalWidth, setInternalWidth] = useState(defaultWidth);
  const sidebarWidth = width !== undefined ? width : internalWidth;
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Use refs for better performance during dragging
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null); // Add ref for the toggle button
  const dragStartX = useRef<number>(0);
  const startWidth = useRef<number>(sidebarWidth);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    startWidth.current = sidebarWidth;
    
    // Add classes to improve UX during dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    
    // Remove transition from button during dragging for instant updates
    if (buttonRef.current) {
      buttonRef.current.style.transition = 'none';
    }
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Calculate new width based on position
      let newWidth;
      if (position === "left") {
        // For left sidebar, width increases when dragging right
        const deltaX = e.clientX - dragStartX.current;
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + deltaX));
      } else {
        // For right sidebar - FIX: when dragging left (clientX decreases), width should increase
        const deltaX = dragStartX.current - e.clientX;
        newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + deltaX));
      }
      
      // Apply width directly to the DOM for immediate feedback
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`;
      }
      
      // Also update button position immediately
      if (buttonRef.current && !isCollapsed) {
        if (position === "left") {
          buttonRef.current.style.left = `${newWidth - 12}px`;
        } else {
          buttonRef.current.style.right = `${newWidth - 12}px`;
        }
      }
      
      // We'll still update state but less frequently
      // This is a simple way to throttle
      requestAnimationFrame(() => {
        setInternalWidth(newWidth);
        if (onWidthChange) {
          onWidthChange(newWidth);
        }
      });
    };
    
    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      // Clean up styles
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Restore transition on button
      if (buttonRef.current) {
        buttonRef.current.style.transition = '';
      }
      
      // Final width update
      const finalWidth = parseInt(sidebarRef.current?.style.width || `${sidebarWidth}`, 10);
      if (onWidthChange) {
        onWidthChange(finalWidth);
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, onWidthChange, sidebarWidth, isCollapsed, position]);
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-full relative">
      <AnimatePresence initial={false}>
        {!isCollapsed ? (
          <div 
            ref={sidebarRef}
            className={cn(
              "h-full flex flex-col relative transition-opacity",
              isDragging ? "transition-none" : "" // Remove transitions during drag for better performance
            )}
            style={{ 
              width: `${sidebarWidth}px`,
              opacity: 1 
            }}
          >
            <div className={cn(
              "flex-1 bg-background flex flex-col h-full overflow-hidden",
              position === "left" ? "border-r" : "border-l",
              bordered && (position === "left" ? "border-r" : "border-l"),
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
            
            {/* Resize handle - positioned based on sidebar position */}
            <div 
              className={cn(
                "w-2 hover:bg-primary/30 active:bg-primary/50 transition-colors absolute top-0 bottom-0 cursor-col-resize",
                isDragging && "bg-primary/50",
                position === "left" ? "right-0" : "left-0"
              )}
              onMouseDown={handleMouseDown}
            >
              <div className={cn(
                "absolute top-1/2 transform -translate-y-1/2 w-6 h-10 flex items-center justify-center opacity-0 hover:opacity-70",
                position === "left" ? "-right-3" : "-left-3"
              )}>
                <GripVertical className="h-5 w-5" />
              </div>
            </div>
          </div>
        ) : (
          // When collapsed, render nothing but keep the space for the button
          <div className="w-0" />
        )}
      </AnimatePresence>
      
      {/* Collapse/Expand Button - positioned based on sidebar position */}
      <div 
        ref={buttonRef}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 transform z-10",
          !isDragging && "transition-all duration-200" // Only apply transition when not dragging
        )}
        style={{
          [position === "left" ? "left" : "right"]: isCollapsed ? '2px' : `${sidebarWidth - 12}px`
        }}
      >
        <Button 
          variant="secondary"
          size="icon"
          className="h-6 w-6 rounded-full shadow-md"
          onClick={toggleCollapse}
        >
          {isCollapsed ? 
            (position === "left" ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />) : 
            (position === "left" ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
          }
        </Button>
      </div>
    </div>
  );
}
