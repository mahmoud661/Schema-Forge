"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  triggerClassName?: string;
  immediateUpdate?: boolean;
}

export function ColorPicker({
  color,
  onChange,
  label,
  triggerClassName,
  immediateUpdate = true
}: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);

  // Sync with external color changes
  useEffect(() => {
    setCurrentColor(color);
  }, [color]);

  // Optimized color change handler with synchronous update
  const handleColorChange = useCallback((newColor: string) => {
    // Synchronously update both local state and propagate the change
    setCurrentColor(newColor);
    
    // Set a timeout of 0ms to push the onChange to the next event loop tick
    // This helps ensure React has time to process state updates
    setTimeout(() => {
      onChange(newColor);
    }, 0);
    
    // Only close if we're not doing immediate updates
    if (!immediateUpdate) {
      setIsOpen(false);
    }
  }, [onChange, immediateUpdate]);

  // Predefined colors - organized by color family
  const colorOptions = [
    // Blues
    '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9',
    // Greens
    '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e',
    // Purples
    '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7',
    // Pinks
    '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899',
    // Oranges/Yellows
    '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316',
    '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b'
  ];

  // Dark mode colors
  const darkOptions = [
    // Blues
    '#0c4a6e', '#075985', '#0369a1', '#0284c7', '#0ea5e9',
    // Greens
    '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e',
    // Purples
    '#581c87', '#6b21a8', '#7e22ce', '#9333ea', '#a855f7',
    // Pinks
    '#831843', '#9d174d', '#be185d', '#db2777', '#ec4899',
    // Oranges/Yellows
    '#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316',
    '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b'
  ];

  // Display the appropriate color palette based on if we're picking a dark mode color
  const colorSet = color.startsWith('#0') || color.startsWith('#1') || 
                 color.startsWith('#5') || color.startsWith('#7') || 
                 color.startsWith('#8') || color.startsWith('#9') ? darkOptions : colorOptions;

  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={triggerClassName || "h-8 p-1 flex items-center gap-2 w-full"}
          >
            <div
              className="h-5 w-5 rounded-sm border transition-colors duration-100"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs text-muted-foreground flex-1 text-left truncate">
              {currentColor}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-3 w-64">
          <div className="grid grid-cols-5 gap-2">
            {colorSet.map((colorOption) => (
              <button
                key={colorOption}
                className="h-6 w-6 rounded-md border hover:scale-110 transition-all"
                style={{ backgroundColor: colorOption }}
                onClick={() => handleColorChange(colorOption)}
                title={colorOption}
                type="button" // Explicit type to avoid form submission
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
