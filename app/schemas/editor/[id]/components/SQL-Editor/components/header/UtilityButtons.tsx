import React, { useState } from "react";
import { 
  DownloadIcon, 
  Settings2, 
  Check, 
  Quote, 
  FastForward, 
  Lightbulb, 
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SqlPreview } from "./SqlPreview";
import { SqlEditorSettings } from "../../hooks/use-sql-editor";
import { useSqlEditor } from "../../hooks/use-sql-editor";
import { SettingsPopover } from "./SettingsPopover";
import { useSchemaStore } from "@/hooks/use-schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface UtilityButtonsProps {
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
  const { sqlCode, handleApplySqlSuggestion } = useSqlEditor();
  
  // Get display text for enum types count
  const getEnumCountDisplay = () => {
    const count = enumTypes?.length || 0;
    if (count === 0) return "No ENUMs defined";
    return `${count} ENUM type${count === 1 ? '' : 's'} defined`;
  };
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {!isEditing && (
          <SqlPreview 
            sqlCode={sqlCode} 
            dbType={dbType} 
            onApplySuggestion={handleApplySqlSuggestion} 
          />
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <DownloadIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Download SQL</TooltipContent>
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
    </TooltipProvider>
  );
}
