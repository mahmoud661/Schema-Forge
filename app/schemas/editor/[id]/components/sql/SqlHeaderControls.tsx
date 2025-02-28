import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SqlHeaderControlsProps {
  dbType: string;
  onDbTypeChange: (type: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onApply: () => void;
  onCancel: () => void;
  onDownload: () => void;
  liveEditMode: boolean;
  onLiveEditModeChange: (isLive: boolean) => void;
}

export function SqlHeaderControls({
  dbType,
  onDbTypeChange,
  isEditing,
  onEdit,
  onApply,
  onCancel,
  onDownload,
  liveEditMode,
  onLiveEditModeChange
}: SqlHeaderControlsProps) {
  return (
    <>
      <Select value={dbType} onValueChange={onDbTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Database Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="postgresql">PostgreSQL</SelectItem>
          <SelectItem value="mysql">MySQL</SelectItem>
          <SelectItem value="sqlite">SQLite</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        ) : (
          <>
            <div className="flex items-center mr-2">
              <input 
                type="checkbox" 
                id="liveEdit" 
                checked={liveEditMode} 
                onChange={(e) => onLiveEditModeChange(e.target.checked)} 
                className="mr-1"
              />
              <label htmlFor="liveEdit" className="text-xs">Live</label>
            </div>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={onApply}>
              Apply
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
