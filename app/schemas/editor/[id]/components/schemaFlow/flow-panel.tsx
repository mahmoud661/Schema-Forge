import React from "react";
import { Panel } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Save, Undo, Redo } from "lucide-react";
import { useRouter } from "next/navigation";

interface FlowPanelProps {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function FlowPanel({ onSave, onUndo, onRedo, canUndo, canRedo }: FlowPanelProps) {
  const router = useRouter();

  return (
    <Panel position="top-right" className="flex gap-2">
      <Button 
        variant="secondary" 
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={onRedo}
        disabled={!canRedo}
      >
        <Redo className="h-4 w-4" />
      </Button>
      <Button 
        variant="secondary" 
        size="sm"
        onClick={() => router.back()}
      >
        Cancel
      </Button>
      <Button 
        size="sm"
        onClick={onSave}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save Changeslknlk
      </Button>
    </Panel>
  );
}
