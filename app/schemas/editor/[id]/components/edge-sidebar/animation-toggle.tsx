import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AnimationToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function AnimationToggle({ checked, onChange }: AnimationToggleProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="animated"
        checked={checked}
        onCheckedChange={onChange}
      />
      <Label htmlFor="animated">Animated</Label>
    </div>
  );
}
