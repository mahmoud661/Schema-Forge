import React from "react";
import { FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SqlEditorSettings } from "../types/types";

// Import refactored components
import { DatabaseSelector, EditModeControls, UtilityButtons } from "./header";

export interface SqlEditorHeaderProps {
  dbType: string;
  setDbType: (type: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  liveEditMode: boolean;
  setLiveEditMode: (live: boolean) => void;
  handleDownload: () => void;
  handleApplySqlChanges: () => void;
  cancelEdit: () => void;
  settings: SqlEditorSettings;
  handleToggleCaseSensitive: () => void;
  handleToggleInlineConstraints: () => void;
  enumTypes: any[];
}

export function SqlEditorHeader({
  dbType,
  setDbType,
  isEditing,
  setIsEditing,
  liveEditMode,
  setLiveEditMode,
  handleDownload,
  handleApplySqlChanges,
  cancelEdit,
  settings,
  handleToggleCaseSensitive,
  handleToggleInlineConstraints,
  enumTypes
}: SqlEditorHeaderProps) {
  const databaseOptions = [
    { value: "postgresql", label: "PostgreSQL", recommended: true },
    { value: "mysql", label: "MySQL", recommended: false },
    { value: "sqlite", label: "SQLite", recommended: false },
  ];
  
  return (
    <TooltipProvider>
      <div className="w-full border-b border-border/60 pb-4 mb-4">
        {/* Add more vertical space when in edit mode to prevent SQL code from being visible */}
        <div className={`flex flex-col gap-4 ${isEditing ? 'md:flex-col pb-2' : 'md:flex-row md:items-center md:justify-between'}`}>
          {/* Database selector - always visible but adjusted layout in edit mode */}
          <div className={`${isEditing ? 'w-full mb-1' : 'md:w-auto'}`}>
            <DatabaseSelector 
              dbType={dbType} 
              setDbType={setDbType} 
              databaseOptions={databaseOptions}
            />
          </div>
          
          {/* Action buttons - ensure edit mode has proper spacing */}
          <div className={`flex items-center ${isEditing ? 'w-full justify-between flex-wrap gap-y-4' : 'gap-3'}`}>
            {isEditing ? (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="order-2 sm:order-1 mt-1">
                  <EditModeControls 
                    liveEditMode={liveEditMode}
                    setLiveEditMode={setLiveEditMode}
                    handleApplySqlChanges={handleApplySqlChanges}
                    cancelEdit={cancelEdit}
                  />
                </div>
                
                <div className="order-1 sm:order-2 mt-1">
                  <UtilityButtons 
                    handleDownload={handleDownload}
                    settings={settings}
                    handleToggleCaseSensitive={handleToggleCaseSensitive}
                    handleToggleInlineConstraints={handleToggleInlineConstraints}
                    dbType={dbType}
                    enumTypes={enumTypes}
                    isEditing={isEditing}
                  />
                </div>
              </div>
            ) : (
              <>
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="default"
                  size="sm"
                  className="px-3.5 py-2 h-9 font-medium"
                >
                  <FileCode2 size={15} className="mr-2" />
                  Edit SQL
                </Button>
                
                <div className="h-7 border-l border-border/70 mx-1"></div>
                
                <UtilityButtons 
                  handleDownload={handleDownload}
                  settings={settings}
                  handleToggleCaseSensitive={handleToggleCaseSensitive}
                  handleToggleInlineConstraints={handleToggleInlineConstraints}
                  dbType={dbType}
                  enumTypes={enumTypes}
                  isEditing={isEditing}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
