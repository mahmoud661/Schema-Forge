import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EdgeStyleControlsProps {
  color: string;
  strokeWidth: number;
  onColorChange: (value: string) => void;
  onColorComplete: () => void;
  onManualColorInput: (value: string) => void;
  onStrokeWidthChange: (property: string, value: string | number) => void;
}

export function EdgeStyleControls({ 
  color, 
  strokeWidth, 
  onColorChange, 
  onColorComplete, 
  onManualColorInput,
  onStrokeWidthChange
}: EdgeStyleControlsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Stroke Color</Label>
        <div className="flex gap-2">
          <Input 
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            onBlur={onColorComplete}
            className="w-12 h-10 p-1"
          />
          <Input 
            value={color}
            onChange={(e) => onManualColorInput(e.target.value)}
            placeholder="#3b82f6"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Stroke Width</Label>
        <Input 
          type="number"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => onStrokeWidthChange('strokeWidth', e.target.value)}
        />
      </div>
    </>
  );
}
