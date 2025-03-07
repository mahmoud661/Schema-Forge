import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Type, X, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface EnumEditorProps {
  name: string;
  values: string[];
  usages: Array<{ table: string; row: string }>;
  onRename: (newName: string) => void;
  onAddValue: (value: string) => void;
  onRemoveValue: (value: string) => void;
  onDelete: () => void;
}

export const EnumEditor: React.FC<EnumEditorProps> = ({
  name,
  values,
  usages,
  onRename,
  onAddValue,
  onRemoveValue,
  onDelete,
}) => {
  const [newValue, setNewValue] = useState("");
  const [editingName, setEditingName] = useState(name);

  // Sync editingName when prop 'name' changes
  useEffect(() => {
    setEditingName(name);
  }, [name]);

  // Handle name change with proper state management to avoid UI flicker
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };
  
  // Only update the actual name when focus is lost
  const handleNameBlur = () => {
    if (editingName.trim() !== '' && editingName !== name) {
      onRename(editingName);
    } else if (editingName.trim() === '') {
      // Reset to original if empty
      setEditingName(name);
    }
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    onAddValue(newValue);
    setNewValue("");
  };

  const handleDeleteEnumClick = () => {
    // Check if enum is in use
    if (usages && usages.length > 0) {
      // Let the parent handle the error toast
      onDelete();
      return;
    }
    
    // Otherwise, delete it
    onDelete();
  };

  return (
    <div className="p-4 border rounded-lg bg-purple-50/20 dark:bg-purple-900/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <Type className="h-4 w-4" />
          Edit ENUM Type
        </h3>
        <Button 
          variant="destructive" 
          size="sm" 
          className="h-7 text-xs"
          onClick={handleDeleteEnumClick}
        >
          Delete ENUM
        </Button>
      </div>
      
      {/* ENUM Name */}
      <div className="space-y-2 mb-4">
        <Label className="text-xs font-medium">ENUM Type Name</Label>
        <Input 
          placeholder="Enter ENUM name" 
          value={editingName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          className="h-8 text-sm"
        />
      </div>
      
      {/* ENUM Values */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Values</Label>
        
        <div className="flex items-center gap-2 mb-3">
          <Input 
            placeholder="New value"
            value={newValue} 
            onChange={(e) => setNewValue(e.target.value)}
            className="h-8 text-sm"
          />
          <Button 
            size="sm" 
            className="h-8" 
            onClick={handleAddValue}
          >
            Add
          </Button>
        </div>
        
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {values?.length > 0 ? (
            values.map((value, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">→</span>
                  <span className="font-mono text-sm">{value}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveValue(value)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic p-2">No values defined</p>
          )}
        </div>
      </div>
      
      {/* ENUM Usages */}
      {usages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-900/50">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Used in:
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {usages.map((usage, i) => (
              <div key={i} className="flex items-center py-1 px-2 text-xs">
                <Badge variant="outline" className="mr-2 px-1 bg-purple-50/50 dark:bg-purple-900/20">
                  {usage.table}
                </Badge>
                <span className="text-muted-foreground">
                  .{usage.row}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
