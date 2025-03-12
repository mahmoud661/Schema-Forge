import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SqlEditorSettings } from "../types/types";

interface SqlEditorHeaderProps {
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
  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={dbType} onValueChange={setDbType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Database Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="sqlite">SQLite</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="SQL Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">SQL Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="case-sensitive">Case-sensitive identifiers</Label>
                  <div className="text-xs text-muted-foreground">
                    Use quotes around table and row names
                  </div>
                </div>
                <Switch
                  id="case-sensitive"
                  checked={settings.caseSensitiveIdentifiers}
                  onCheckedChange={handleToggleCaseSensitive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inline-constraints">Use inline constraints</Label>
                  <div className="text-xs text-muted-foreground">
                    Add foreign key constraints inside CREATE TABLE instead of ALTER TABLE
                  </div>
                </div>
                <Switch
                  id="inline-constraints"
                  checked={settings.useInlineConstraints}
                  onCheckedChange={handleToggleInlineConstraints}
                />
              </div>
              
              {dbType === "postgresql" && (
                <div className="pt-2">
                  <h5 className="text-sm font-medium mb-2">ENUM Types ({enumTypes.length})</h5>
                  <div className="max-h-24 overflow-y-auto text-xs">
                    {enumTypes.length > 0 ? (
                      <ul className="space-y-1">
                        {enumTypes.map((enumType, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="font-mono">{enumType.name}</span>
                            <span className="text-muted-foreground">
                              ({enumType.values.length} values)
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground italic">No ENUM types defined</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add ENUM types using CREATE TYPE in the SQL editor
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex gap-2">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <>
            <div className="flex items-center mr-2">
              <input 
                type="checkbox" 
                id="liveEdit" 
                checked={liveEditMode} 
                onChange={(e) => setLiveEditMode(e.target.checked)} 
                className="mr-1"
              />
              <label htmlFor="liveEdit" className="text-xs">Live</label>
            </div>
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplySqlChanges}>
              Apply
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
