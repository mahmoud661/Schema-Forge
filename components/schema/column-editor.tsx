import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Hash, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ColumnData {
  id: string;
  title: string;
  type: string;
  constraints: string[];
}

interface ColumnEditorProps {
  columns: ColumnData[];
  onAddColumn: () => void;
  onUpdateColumn: (index: number, field: string, value: any) => void;
  onRemoveColumn: (index: number) => void;
  onToggleConstraint: (index: number, constraint: string) => void;
  duplicateColumns?: Record<string, { isDuplicate: boolean; tables: string[] }>;
  dataTypes: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
  constraints: {
    id: string;
    label: string;
  }[];
}

export const ColumnEditor: React.FC<ColumnEditorProps> = ({
  columns,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onToggleConstraint,
  duplicateColumns,
  dataTypes,
  constraints,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5" />
          Columns
        </h4>
        <Button onClick={onAddColumn} size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Column
        </Button>
      </div>

      <div className="space-y-3">
        {columns.map((column, index) => {
          const columnKey = column.id || `column-${index}`;
          const isDuplicate = duplicateColumns?.[column.title]?.isDuplicate;
          
          return (
            <div 
              key={columnKey} 
              className={cn(
                "space-y-2 p-3 border rounded-lg transition-all",
                isDuplicate 
                  ? "border-yellow-500/50 dark:border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-900/10" 
                  : "hover:border-muted-foreground/20"
              )}
            >
              {/* Column Header with Warning */}
              {isDuplicate && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-100/50 dark:bg-yellow-900/20 mb-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-400 shrink-0" />
                  <span className="text-yellow-800 dark:text-yellow-300">
                    Duplicate column name in:{' '}
                    <strong>
                      {duplicateColumns[column.title].tables.join(', ')}
                    </strong>
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Column name"
                  value={column.title}
                  onChange={(e) => onUpdateColumn(index, 'title', e.target.value)}
                  className={cn(
                    "flex-1 h-8 text-sm",
                    isDuplicate && "border-yellow-500 focus-visible:ring-yellow-500 dark:border-yellow-600 dark:focus-visible:ring-yellow-400" 
                  )}
                />
                <Select
                  value={column.type}
                  onValueChange={(value) => onUpdateColumn(index, 'type', value)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Data Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-1 gap-1 p-1">
                      {dataTypes.map((type) => (
                        <SelectItem 
                          key={type.id} 
                          value={type.id}
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <type.icon className="h-3 w-3" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveColumn(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {constraints.map((constraint) => (
                  <div 
                    key={`${columnKey}-${constraint.id}`} 
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
                      (column.constraints || []).includes(constraint.id) 
                        ? "bg-primary/10 border-primary/30 text-primary-foreground dark:bg-primary/20" 
                        : "bg-muted/50 border-transparent text-muted-foreground"
                    )}
                    onClick={() => onToggleConstraint(index, constraint.id)}
                    role="button"
                  >
                    {(column.constraints || []).includes(constraint.id) ? (
                      <Check className="h-3 w-3" />
                    ) : null}
                    <Label 
                      htmlFor={`${columnKey}-${constraint.id}`} 
                      className="text-xs cursor-pointer"
                    >
                      {constraint.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
