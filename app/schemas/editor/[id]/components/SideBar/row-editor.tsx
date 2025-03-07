import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Fingerprint, AlertCircle, ListFilter, Trash2, Plus, AlertTriangle , Hash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  // Constraint icon and tooltip mapping
  const constraintConfig = {
    primary: { 
      icon: Key, 
      description: "Uniquely identifies each record in the table",
      activeClass: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300"
    },
    unique: { 
      icon: Fingerprint, 
      description: "Ensures all values in the column are different",
      activeClass: "bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300"
    },
    notnull: { 
      icon: AlertCircle, 
      description: "Ensures the column cannot contain NULL values",
      activeClass: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
    },
    index: { 
      icon: ListFilter, 
      description: "Creates an index on the column for faster queries",
      activeClass: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
    },
  };

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

              {/* Enhanced Constraint Toggles */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {constraints.map((constraint) => {
                  const isActive = (row.constraints || []).includes(constraint.id);
                  const config = constraintConfig[constraint.id as keyof typeof constraintConfig];
                  const ConstraintIcon = config?.icon || AlertCircle;
                  
                  // Skip rendering for enum types that can't be primary keys
                  if (constraint.id === 'primary' && row.type.startsWith('enum_')) {
                    return null;
                  }
                  
                  return (
                    <TooltipProvider key={`${rowKey}-${constraint.id}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "flex items-center gap-1 py-1 px-2 text-xs border rounded-md transition-all",
                              isActive 
                                ? config?.activeClass || "bg-primary/10 border-primary/30 text-primary"
                                : "bg-background hover:bg-muted/50 border-muted/50 text-muted-foreground hover:text-foreground",
                              "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            )}
                            onClick={() => onToggleConstraint(index, constraint.id)}
                            type="button"
                          >
                            <ConstraintIcon className="h-3 w-3" />
                            <span className="font-medium">{constraint.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-medium">{constraint.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {config?.description || `Adds a ${constraint.label} constraint to this column`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
