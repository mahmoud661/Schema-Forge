"use client";

import React, { useCallback, useState, useEffect } from "react";
import { Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";

interface EdgeSidebarProps {
  selectedEdge: Edge | null;
  onUpdateEdge: (edgeId: string, data: any) => void;
  onClose: () => void;
}

export function EdgeSidebar({ selectedEdge, onUpdateEdge, onClose }: EdgeSidebarProps) {
  if (!selectedEdge) return null;
  
  const { widths, updateWidth } = useSidebarStore();
  
  // Local state for color to avoid excessive edge updates
  const [localColor, setLocalColor] = useState<string>(
    (selectedEdge.style?.stroke as string) || '#3b82f6'
  );
  
  // Update local color when selected edge changes
  useEffect(() => {
    setLocalColor((selectedEdge.style?.stroke as string) || '#3b82f6');
  }, [selectedEdge.id, selectedEdge.style?.stroke]);
  
  // Get current stroke width safely
  const currentStrokeWidth = selectedEdge.style?.strokeWidth as number || 2;

  // Memoize the handlers to prevent unnecessary re-renders
  const handleLabelChange = useCallback((value: string) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      label: value,
    });
  }, [selectedEdge, onUpdateEdge]);

  const handleTypeChange = useCallback((value: string) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      type: value,
    });
  }, [selectedEdge, onUpdateEdge]);

  const handleAnimatedChange = useCallback((value: boolean) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: value,
    });
  }, [selectedEdge, onUpdateEdge]);

  // Handle color change without updating the edge (just local state)
  const handleColorChange = useCallback((value: string) => {
    setLocalColor(value);
  }, []);
  
  // Only update the edge style when the interaction ends
  const handleColorComplete = useCallback(() => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      style: {
        ...currentStyle,
        stroke: localColor,
      },
    });
  }, [selectedEdge, onUpdateEdge, localColor]);
  
  // For other style properties
  const handleStyleChange = useCallback((property: string, value: string | number) => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      style: {
        ...currentStyle,
        [property]: value,
      },
    });
  }, [selectedEdge, onUpdateEdge]);
  
  // For typing in a color directly (not dragging)
  const handleManualColorInput = useCallback((value: string) => {
    setLocalColor(value);
    // Use a small timeout to reduce updates
    setTimeout(() => {
      const currentStyle = selectedEdge.style || {};
      onUpdateEdge(selectedEdge.id, {
        ...selectedEdge,
        style: {
          ...currentStyle,
          stroke: value,
        },
      });
    }, 300);
  }, [selectedEdge, onUpdateEdge]);

  return (
    <BaseSidebar 
      title="Edge Properties" 
      onClose={onClose}
      width={widths.edge}
      onWidthChange={(width) => updateWidth("edge", width)}
      showClose={true}
    >
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Relationship Label</Label>
          <Input 
            placeholder="e.g., has many, belongs to"
            value={typeof selectedEdge.label === "string" ? selectedEdge.label : ""}
            onChange={(e) => handleLabelChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Edge Type</Label>
          <Select
            value={selectedEdge.type || 'smoothstep'}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select edge type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="smoothstep">Smooth Step</SelectItem>
              <SelectItem value="step">Step</SelectItem>
              <SelectItem value="straight">Straight</SelectItem>
              <SelectItem value="bezier">Bezier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="animated"
            checked={selectedEdge.animated || false}
            onCheckedChange={handleAnimatedChange}
          />
          <Label htmlFor="animated">Animated</Label>
        </div>

        <div className="space-y-2">
          <Label>Stroke Color</Label>
          <div className="flex gap-2">
            <Input 
              type="color"
              value={localColor}
              onChange={(e) => handleColorChange(e.target.value)}
              onBlur={handleColorComplete}
              className="w-12 h-10 p-1"
            />
            <Input 
              value={localColor}
              onChange={(e) => handleManualColorInput(e.target.value)}
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
            value={currentStrokeWidth}
            onChange={(e) => handleStyleChange('strokeWidth', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Relationship Type</Label>
          <Select
            value={typeof selectedEdge.data?.relationshipType === "string" ? selectedEdge.data.relationshipType : 'oneToMany'}
            onValueChange={(value) => onUpdateEdge(selectedEdge.id, {
              ...selectedEdge,
              data: { ...selectedEdge.data, relationshipType: value }
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select relationship type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oneToOne">One-to-One</SelectItem>
              <SelectItem value="oneToMany">One-to-Many</SelectItem>
              <SelectItem value="manyToOne">Many-to-One</SelectItem>
              <SelectItem value="manyToMany">Many-to-Many</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </BaseSidebar>
  );
}