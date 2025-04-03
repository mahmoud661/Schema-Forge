"use client";

import React, { memo, useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  triggerClassName?: string;
}

export const ColorPicker = memo(function ColorPicker({
  color,
  onChange,
  label,
  triggerClassName
}: ColorPickerProps) {
  const [currentColor, setCurrentColor] = useState(color);
  const [isOpen, setIsOpen] = useState(false);

  // Sync with external color changes
  useEffect(() => {
    setCurrentColor(color);
  }, [color]);

  // Optimized color change handler
  const handleColorChange = useCallback((newColor: string) => {
    setCurrentColor(newColor);
    onChange(newColor);
    setIsOpen(false);
  }, [onChange]);

  // Curated border colors - well-organized and visually distinct
  const borderColors = [
    // Column 1: Blues
    '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1',
    // Column 2: Purples & Pinks
    '#a855f7', '#9333ea', '#ec4899', '#db2777',
    // Column 3: Greens & Teals
    '#34d399', '#10b981', '#14b8a6', '#0d9488',
    // Column 4: Reds & Oranges
    '#ef4444', '#dc2626', '#f97316', '#ea580c',
    // Column 5: Yellows & Ambers
    '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    // Column 6: Neutrals
    '#94a3b8', '#64748b', '#475569', '#334155',
  ];

  return (
    <div className="flex items-center gap-2">
      {label && <Label className="text-xs font-medium whitespace-nowrap">{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-7 px-2 w-12 border-2 flex-grow max-w-[120px]",
              triggerClassName
            )}
            style={{ borderColor: currentColor }}
          >
            <div className="w-full h-1" style={{ backgroundColor: currentColor }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="center" sideOffset={5}>
          <div className="grid grid-cols-4 gap-1.5 p-1">
            {borderColors.map((colorOption) => (
              <button
                key={colorOption}
                className={cn(
                  "h-7 w-7 rounded-md hover:scale-110 transition-all",
                  colorOption === currentColor ? "ring-2 ring-primary ring-offset-1" : "border"
                )}
                style={{ backgroundColor: colorOption }}
                onClick={() => handleColorChange(colorOption)}
                title={colorOption}
                type="button"
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}, (prev, next) => prev.color === next.color && prev.label === next.label);
