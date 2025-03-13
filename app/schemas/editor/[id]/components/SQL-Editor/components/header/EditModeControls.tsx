import React from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface EditModeControlsProps {
  liveEditMode: boolean;
  setLiveEditMode: (live: boolean) => void;
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
    <div className="flex flex-wrap items-center gap-3">
      <LiveEditToggle 
        liveEditMode={liveEditMode} 
        setLiveEditMode={setLiveEditMode} 
      />
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={cancelEdit}
          className="h-9 px-3 text-sm font-medium"
        >
          <X size={14} className="mr-1.5" />
          Cancel
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleApplySqlChanges}
          className="h-9 px-4 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          <Play size={14} className="mr-2" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
}

interface LiveEditToggleProps {
  liveEditMode: boolean;
  setLiveEditMode: (live: boolean) => void;
}

function LiveEditToggle({ liveEditMode, setLiveEditMode }: LiveEditToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="bg-muted/50 hover:bg-muted/70 transition-colors rounded-md border border-border/50 px-3 py-1.5 flex items-center">
          <Switch
            id="liveEdit"
            checked={liveEditMode}
            onCheckedChange={setLiveEditMode}
            className="mr-2 scale-80"
          />
          <Label htmlFor="liveEdit" className="text-xs font-medium cursor-pointer">
            Live Edit
          </Label>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">Updates diagram as you type SQL</p>
      </TooltipContent>
    </Tooltip>
  );
}
