import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RelationshipTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function RelationshipTypeSelector({ selectedType, onTypeChange }: RelationshipTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Relationship Type</Label>
      <Select
        value={selectedType}
        onValueChange={onTypeChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select relationship type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="oneToOne">One-to-One (1:1)</SelectItem>
          <SelectItem value="oneToMany">One-to-Many (1:N)</SelectItem>
          <SelectItem value="manyToOne">Many-to-One (N:1)</SelectItem>
          <SelectItem value="manyToMany">Many-to-Many (N:N)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
