import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RelationshipLabelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function RelationshipLabelInput({ value, onChange }: RelationshipLabelInputProps) {
  return (
    <div className="space-y-2">
      <Label>Relationship Label</Label>
      <Input 
        placeholder="e.g., has many, belongs to"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
