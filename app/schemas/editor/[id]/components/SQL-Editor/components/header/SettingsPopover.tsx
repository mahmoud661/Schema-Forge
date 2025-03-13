import React from "react";
import { Settings, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SqlEditorSettings } from "../../types/types";

export interface SettingsPopoverProps {
  settings: SqlEditorSettings;
  handleToggleCaseSensitive: () => void;
  handleToggleInlineConstraints: () => void;
  dbType: string;
  enumTypes: any[];
  isEditing: boolean;
}

export function SettingsPopover({ 
  settings, 
  handleToggleCaseSensitive, 
  handleToggleInlineConstraints, 
  dbType, 
  enumTypes,
  isEditing
}: SettingsPopoverProps) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-3 text-sm font-medium"
            >
              <Settings className="h-4 w-4 mr-1.5" />
              <span className={`${isEditing ? 'hidden' : ''} sm:inline`}>Settings</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">SQL generation settings</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" side="bottom" align="end">
        <SettingsContent 
          settings={settings}
          handleToggleCaseSensitive={handleToggleCaseSensitive}
          handleToggleInlineConstraints={handleToggleInlineConstraints}
          dbType={dbType}
          enumTypes={enumTypes}
        />
      </PopoverContent>
    </Popover>
  );
}

interface SettingsContentProps {
  settings: SqlEditorSettings;
  handleToggleCaseSensitive: () => void;
  handleToggleInlineConstraints: () => void;
  dbType: string;
  enumTypes: any[];
}

function SettingsContent({
  settings,
  handleToggleCaseSensitive,
  handleToggleInlineConstraints,
  dbType,
  enumTypes
}: SettingsContentProps) {
  return (
    <div className="space-y-4 text-sm">
      <h4 className="font-medium border-b pb-2 -mt-1 text-base">SQL Generation Options</h4>
      
      <CaseSensitiveOption
        checked={settings.caseSensitiveIdentifiers}
        onChange={handleToggleCaseSensitive}
      />
      
      <div className="flex flex-col gap-3 pt-2 border-t mt-1">
        <InlineConstraintOption
          checked={settings.useInlineConstraints}
          onChange={handleToggleInlineConstraints}
        />
        
        {settings.useInlineConstraints && <ConstraintWarning />}
      </div>
      
      {dbType === "postgresql" && (
        <PostgresEnumSection enumTypes={enumTypes} />
      )}
    </div>
  );
}

interface ToggleOptionProps {
  checked: boolean;
  onChange: () => void;
}

function CaseSensitiveOption({ checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="case-sensitive" className="text-sm font-medium">Case-sensitive identifiers</Label>
        <div className="text-xs text-muted-foreground mt-0.5">
          Use quotes around table and column names
        </div>
      </div>
      <Switch
        id="case-sensitive"
        checked={checked}
        onCheckedChange={onChange}
        className="scale-90"
      />
    </div>
  );
}

function InlineConstraintOption({ checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="inline-constraints" className="text-sm font-medium">Use inline constraints</Label>
              <Info size={12} className="text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Add foreign key constraints inside CREATE TABLE
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[250px]">
          <p className="text-xs">
            When enabled, foreign keys are defined within CREATE TABLE statements.
            When disabled, they're added with ALTER TABLE after all tables are created.
          </p>
        </TooltipContent>
      </Tooltip>
      <Switch
        id="inline-constraints"
        checked={checked}
        onCheckedChange={onChange}
        className="scale-90"
      />
    </div>
  );
}

function ConstraintWarning() {
  return (
    <div className="flex gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-md text-xs text-yellow-700 dark:text-yellow-400">
      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">Important: Table ordering matters</p>
        <p className="mt-0.5">Referenced tables must be created before tables that reference them</p>
      </div>
    </div>
  );
}

interface PostgresEnumSectionProps {
  enumTypes: any[];
}

function PostgresEnumSection({ enumTypes }: PostgresEnumSectionProps) {
  return (
    <div className="pt-2 mt-1 border-t">
      <h5 className="text-sm font-medium mb-2 flex items-center justify-between">
        <span>PostgreSQL ENUM Types</span>
        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs">
          {enumTypes.length} defined
        </span>
      </h5>
      <div className="max-h-32 overflow-y-auto text-xs rounded-md bg-muted/40 p-2.5 border">
        {enumTypes.length > 0 ? (
          <EnumTypesList enumTypes={enumTypes} />
        ) : (
          <p className="text-muted-foreground italic">No ENUM types defined</p>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Add ENUM types using CREATE TYPE in the SQL editor
      </p>
    </div>
  );
}

function EnumTypesList({ enumTypes }: PostgresEnumSectionProps) {
  return (
    <ul className="space-y-2">
      {enumTypes.map((enumType, index) => (
        <li key={index}>
          <div className="flex justify-between items-center">
            <span className="font-mono font-medium">{enumType.name}</span>
            <span className="text-muted-foreground text-[10px] px-1.5 py-0.5 bg-muted/60 rounded">
              {enumType.values.length} values
            </span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground font-mono overflow-hidden text-ellipsis whitespace-nowrap">
            {enumType.values.join(", ")}
          </div>
        </li>
      ))}
    </ul>
  );
}
