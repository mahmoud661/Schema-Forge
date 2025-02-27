"use client";

import React from "react";
import { Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";

interface EdgeSidebarProps {
  selectedEdge: Edge | null;
  onUpdateEdge: (edgeId: string, data: any) => void;
  onClose: () => void;
}

export function EdgeSidebar({ selectedEdge, onUpdateEdge, onClose }: EdgeSidebarProps) {
  if (!selectedEdge) return null;

  const handleLabelChange = (value: string) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      label: value,
    });
  };

  const handleTypeChange = (value: string) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      type: value,
    });
  };

  const handleAnimatedChange = (value: boolean) => {
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: value,
    });
  };

  const handleStyleChange = (property: string, value: string) => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      style: {
        ...currentStyle,
        [property]: value,
      },
    });
  };

  return (
    <div className="w-80 border-l bg-background p-4 flex flex-col gap-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Edge Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Relationship Label</Label>
          <Input 
            placeholder="e.g., has many, belongs to" 
            value={selectedEdge.label || ''}
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
              value={(selectedEdge.style?.stroke as string) || '#3b82f6'}
              onChange={(e) => handleStyleChange('stroke', e.target.value)}
              className="w-12 h-10 p-1"
            />
            <Input 
              value={(selectedEdge.style?.stroke as string) || '#3b82f6'}
              onChange={(e) => handleStyleChange('stroke', e.target.value)}
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
            value={(selectedEdge.style?.strokeWidth as number) || 2}
            onChange={(e) => handleStyleChange('strokeWidth', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Relationship Type</Label>
          <Select
            value={selectedEdge.data?.relationshipType || 'oneToMany'}
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
    </div>
  );
}