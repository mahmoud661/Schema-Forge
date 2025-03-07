import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Hash, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ColumnData {
  id: string;
  title: string;
  type: string;
  constraints: string[];
}

interface ColumnEditorProps {
  rows: ColumnData[];
  onAddColumn: () => void;
  onUpdateColumn: (index: number, field: string, value: any) => void;
  onRemoveColumn: (index: number) => void;
  onToggleConstraint: (index: number, constraint: string) => void;
  duplicateRows?: Record<string, { isDuplicate: boolean; tables: string[] }>;
  dataTypes: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
  constraints: {
    id: string;
    label: string;
  }[];
  enumTypes?: { name: string; values: string[] }[];
  onEnumDisconnect?: (index: number) => void;
}

export const ColumnEditor: React.FC<ColumnEditorProps> = ({
  rows,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onToggleConstraint,
  duplicateRows,
  dataTypes,
  constraints,
  enumTypes = [],
  onEnumDisconnect,
}) => {
  // Helper to check if a type is an enum type
  const isEnumType = (type: string) => type.startsWith('enum_');
  
  // Helper to extract enum name from type
  const getEnumNameFromType = (type: string) => isEnumType(type) ? type.replace('enum_', '') : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5" />
          Rows
        </h4>
        <Button onClick={onAddColumn} size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Row
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const rowKey = row.id || `row-${index}`;
          const isDuplicate = duplicateRows?.[row.title]?.isDuplicate;
          const enumName = getEnumNameFromType(row.type);
          
          return (
            <div 
              key={rowKey} 
              className={cn(
                "space-y-2 p-3 border rounded-lg transition-all",
                isDuplicate 
                  ? "border-yellow-500/50 dark:border-yellow-400/50 bg-yellow-50/30 dark:bg-yellow-900/10" 
                  : "hover:border-muted-foreground/20"
              )}
            >
              {/* Row Header with Warning */}
              {isDuplicate && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-100/50 dark:bg-yellow-900/20 mb-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-400 shrink-0" />
                  <span className="text-yellow-800 dark:text-yellow-300">
                    Duplicate row name in:{' '}
                    <strong>
                      {duplicateRows[row.title].tables.join(', ')}
                    </strong>
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Row name"
                  value={row.title}
                  onChange={(e) => onUpdateColumn(index, 'title', e.target.value)}
                  className={cn(
                    "flex-1 h-8 text-sm",
                    isDuplicate && "border-yellow-500 focus-visible:ring-yellow-500 dark:border-yellow-600 dark:focus-visible:ring-yellow-400" 
                  )}
                />
                
                {/* Data Type Selector */}
                <div className="w-[120px]">
                  {enumName ? (
                    <div className="relative">
                      <div className="flex items-center">
                        <Select
                          value={row.type}
                          onValueChange={(value) => {
                            // If changing from enum to another type, handle disconnection
                            if (value !== row.type && onEnumDisconnect) {
                              onEnumDisconnect(index);
                            }
                            onUpdateColumn(index, 'type', value);
                          }}
                        >
                          <SelectTrigger className="w-full h-8 text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                            <SelectValue>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                                  ENUM
                                </Badge>
                                <span className="truncate">{enumName}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <div className="grid grid-cols-1 gap-1 p-1">
                              {/* Option for keeping current enum type */}
                              <SelectItem 
                                key={row.type} 
                                value={row.type}
                                className="text-xs cursor-pointer bg-purple-50 dark:bg-purple-900/20"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 bg-purple-500/10">ENUM</Badge>
                                  {enumName}
                                </div>
                              </SelectItem>
                              <div className="h-px bg-muted my-1"></div>
                              {/* Standard data types */}
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
                              {/* Other enum types */}
                              {enumTypes.filter(e => `enum_${e.name}` !== row.type).length > 0 && (
                                <>
                                  <div className="h-px bg-muted my-1"></div>
                                  <div className="px-2 py-1 text-xs text-muted-foreground">Other ENUM Types</div>
                                  {enumTypes
                                    .filter(e => `enum_${e.name}` !== row.type)
                                    .map(e => (
                                      <SelectItem
                                        key={`enum_${e.name}`}
                                        value={`enum_${e.name}`}
                                        className="text-xs cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 bg-purple-500/10">ENUM</Badge>
                                          {e.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                </>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={row.type}
                      onValueChange={(value) => onUpdateColumn(index, 'type', value)}
                    >
                      <SelectTrigger className="w-full h-8 text-xs">
                        <SelectValue placeholder="Data Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="grid grid-cols-1 gap-1 p-1">
                          {/* Standard data types */}
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
                          {/* Enum types */}
                          {enumTypes.length > 0 && (
                            <>
                              <div className="h-px bg-muted my-1"></div>
                              <div className="px-2 py-1 text-xs text-muted-foreground">ENUM Types</div>
                              {enumTypes.map(e => (
                                <SelectItem
                                  key={`enum_${e.name}`}
                                  value={`enum_${e.name}`}
                                  className="text-xs cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 bg-purple-500/10">ENUM</Badge>
                                    {e.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
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
                    key={`${rowKey}-${constraint.id}`} 
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border",
                      (row.constraints || []).includes(constraint.id) 
                        ? "bg-primary/10 border-primary/30 text-primary-foreground dark:bg-primary/20" 
                        : "bg-muted/50 border-transparent text-muted-foreground"
                    )}
                    onClick={() => onToggleConstraint(index, constraint.id)}
                    role="button"
                  >
                    {(row.constraints || []).includes(constraint.id) ? (
                      <Check className="h-3 w-3" />
                    ) : null}
                    <Label 
                      htmlFor={`${rowKey}-${constraint.id}`} 
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
