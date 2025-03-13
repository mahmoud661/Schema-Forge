import React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface EditModeControlsProps {
  liveEditMode: boolean;
  setLiveEditMode: (value: boolean) => void;
  handleApplySqlChanges: () => void;
  cancelEdit: () => void;
}

export function EditModeControls({
  liveEditMode,
  setLiveEditMode,
  handleApplySqlChanges,
  cancelEdit
}: EditModeControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-4 justify-between w-full">
        <div className="flex items-center gap-2">
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <Switch
                  id="live-mode"
                  checked={liveEditMode}
                  onCheckedChange={setLiveEditMode}
                />
                <Label htmlFor="live-mode" className="text-xs cursor-pointer">Live Edit</Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Changes apply automatically when enabled</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {!liveEditMode && (
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleApplySqlChanges}
              variant="default"
              size="sm"
              className="h-8 gap-1"
            >
              <Check size={16} />
              <span className="hidden sm:inline">Apply</span>
            </Button>
            
            <Button 
              onClick={cancelEdit}
              variant="outline"
              size="sm"
              className="h-8 gap-1"
            >
              <X size={16} />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
