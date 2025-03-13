import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EdgeTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function EdgeTypeSelector({ selectedType, onTypeChange }: EdgeTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Edge Type</Label>
      
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant={selectedType === 'smoothstep' ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onTypeChange('smoothstep')}
        >
          Smooth Step
        </Button>
        <Button
          variant={selectedType === 'step' ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onTypeChange('step')}
        >
          Step
        </Button>
        <Button
          variant={selectedType === 'straight' ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onTypeChange('straight')}
        >
          Straight
        </Button>
        <Button
          variant={selectedType === 'bezier' ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => onTypeChange('bezier')}
        >
          Bezier
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
        <span>
          Current edge display: <strong>{selectedType}</strong>
        </span>
        <span className="text-green-600">✓</span>
      </div>
    </div>
  );
}
