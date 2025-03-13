import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SqlEditorSettings } from "../../types/types";
import { SettingsPopover } from "./SettingsPopover";

export interface UtilityButtonsProps {
  handleDownload: () => void;
  settings: SqlEditorSettings;
  handleToggleCaseSensitive: () => void;
  handleToggleInlineConstraints: () => void;
  dbType: string;
  enumTypes: any[];
  isEditing: boolean;
}

export function UtilityButtons({ 
  handleDownload, 
  settings, 
  handleToggleCaseSensitive, 
  handleToggleInlineConstraints, 
  dbType, 
  enumTypes,
  isEditing
}: UtilityButtonsProps) {
  return (
    <div className={`flex items-center ${isEditing ? 'justify-end' : ''} gap-2.5`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload} 
            className="h-9 px-3 text-sm font-medium"
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span className={`${isEditing ? 'hidden' : ''} sm:inline`}>Download</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">Download SQL file</p>
        </TooltipContent>
      </Tooltip>
      
      <SettingsPopover 
        settings={settings}
        handleToggleCaseSensitive={handleToggleCaseSensitive}
        handleToggleInlineConstraints={handleToggleInlineConstraints}
        dbType={dbType}
        enumTypes={enumTypes}
        isEditing={isEditing}
      />
    </div>
  );
}
