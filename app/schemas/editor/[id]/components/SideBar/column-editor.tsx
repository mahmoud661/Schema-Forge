import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Fingerprint, AlertCircle, ListFilter, Trash2, Plus, AlertTriangle, Hash, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useEffect, useRef } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColumnData {
  id: string;
  title: string;
  type: string;
  typeParams?: string;
  constraints: string[];
}

interface ColumnEditorProps {
  columns: ColumnData[];
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

// Types that support length parameters
const typesWithLength = ['varchar', 'char', 'text'];
const typesWithPrecision = ['decimal', 'numeric', 'money'];
const typesWithScale = ['decimal', 'numeric'];

export const ColumnEditor: React.FC<ColumnEditorProps> = ({
  columns,
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
  // Track open popover state for each column
  const [openPopover, setOpenPopover] = useState<Record<string, boolean>>({});
  
  // Create a centralized state for type parameters - fixes the hooks issue
  const [typeParams, setTypeParams] = useState<Record<string, {
    length: string;
    precision: string;
    scale: string;
  }>>({});

  // Track which columns we've already processed to avoid reinitializing unnecessarily
  const processedRows = useRef(new Set<string>());

  // Helper to check if a type is an enum type
  const isEnumType = (type: string) => type.startsWith('enum_');
  
  // Helper to extract enum name from type
  const getEnumNameFromType = (type: string) => isEnumType(type) ? type.replace('enum_', '') : null;

  // Helper to extract type parameters from type string (e.g., "varchar(255)" -> "255")
  const parseTypeParams = (fullType: string) => {
    const match = fullType.match(/^([a-zA-Z]+)(?:\(([^)]+)\))?$/);
    if (!match) return { baseType: fullType, params: '' };
    
    return {
      baseType: match[1].toLowerCase(),
      params: match[2] || ''
    };
  };
  
  // Helper to determine if a type supports length parameters
  const supportsLength = (type: string) => typesWithLength.includes(type.toLowerCase());
  
  // Helper to determine if a type supports precision
  const supportsPrecision = (type: string) => typesWithPrecision.includes(type.toLowerCase());
  
  // Helper to determine if a type supports scale
  const supportsScale = (type: string) => typesWithScale.includes(type.toLowerCase());

  // Initialize type parameters on component mount or when columns change
  useEffect(() => {
    const newTypeParams: Record<string, any> = {...typeParams};
    let hasNewParams = false;
    
    columns.forEach((column) => {
      const rowKey = column.id || `column-${column.title}`;
      
      // Skip columns we've already processed
      if (processedRows.current.has(rowKey)) return;
      processedRows.current.add(rowKey);
      
      const { baseType, params } = parseTypeParams(column.type);
      
      // Create or update params object
      if (!newTypeParams[rowKey]) {
        newTypeParams[rowKey] = {
          length: '',
          precision: '',
          scale: ''
        };
      }
      
      // For types with length, set length parameter
      if (supportsLength(baseType) && params) {
        newTypeParams[rowKey].length = params;
        hasNewParams = true;
      }
      
      // For types with precision, set precision and scale parameters
      if (supportsPrecision(baseType)) {
        if (params && params.includes(',')) {
          const [precision, scale] = params.split(',');
          newTypeParams[rowKey].precision = precision;
          newTypeParams[rowKey].scale = scale;
          hasNewParams = true;
        } else if (params) {
          newTypeParams[rowKey].precision = params;
          hasNewParams = true;
        }
      }
    });
    
    // Only update state if there are new parameters to add
    if (hasNewParams) {
      setTypeParams(newTypeParams);
    }
  }, [columns]);

  // Update a type parameter for a specific column
  const updateTypeParam = (rowKey: string, paramType: 'length' | 'precision' | 'scale', value: string) => {
    setTypeParams(prev => ({
      ...prev,
      [rowKey]: {
        ...(prev[rowKey] || { length: '', precision: '', scale: '' }),
        [paramType]: value
      }
    }));
  };

  // Apply type parameters to create the full type string
  const applyTypeParams = (rowIndex: number, baseType: string, rowKey: string) => {
    const params = typeParams[rowKey] || { length: '', precision: '', scale: '' };
    
    let newParams = '';
    if (supportsLength(baseType) && params.length) {
      newParams = params.length;
    } else if (supportsPrecision(baseType)) {
      if (params.precision && params.scale) {
        newParams = `${params.precision},${params.scale}`;
      } else if (params.precision) {
        newParams = params.precision;
      }
    }
    
    const newType = newParams ? `${baseType}(${newParams})` : baseType;
    onUpdateColumn(rowIndex, 'type', newType);
    
    // Close the popover
    setOpenPopover(prev => ({ ...prev, [rowKey]: false }));
  };

  // Clear type parameters for a column
  const clearTypeParams = (rowIndex: number, baseType: string, rowKey: string) => {
    setTypeParams(prev => ({
      ...prev,
      [rowKey]: { length: '', precision: '', scale: '' }
    }));
    
    onUpdateColumn(rowIndex, 'type', baseType);
    setOpenPopover(prev => ({ ...prev, [rowKey]: false }));
  };

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
          Columns
        </h4>
        <Button onClick={onAddColumn} size="sm" variant="outline" className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Column
        </Button>
      </div>

      <div className="space-y-3">
        {columns.map((column, index) => {
          const rowKey = column.id || `column-${index}`;
          const isDuplicate = duplicateRows?.[column.title]?.isDuplicate;
          const enumName = getEnumNameFromType(column.type);
          
          // Parse the type to get base type and parameters
          const { baseType, params } = parseTypeParams(column.type);
          
          // Check if this type supports parameters
          const hasLengthSupport = supportsLength(baseType);
          const hasPrecisionSupport = supportsPrecision(baseType);
          
          // Get parameters from centralized state
          const rowParams = typeParams[rowKey] || { length: '', precision: '', scale: '' };
          
          return (
            <div 
              key={rowKey} 
              className={cn(
                "space-y-2.5 p-3 border rounded-lg transition-all",
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
                      {duplicateRows[column.title].tables.join(', ')}
                    </strong>
                  </span>
                </div>
              )}
              
              {/* IMPROVED LAYOUT: 2-column grid layout for easy readability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ROW 1: Column 1 - Column Name */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Column Name</Label>
                  <Input
                    placeholder="Column name"
                    value={column.title}
                    onChange={(e) => onUpdateColumn(index, 'title', e.target.value)}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value && value !== column.title) {
                        onUpdateColumn(index, 'title', value);
                      }
                    }}
                    className={cn(
                      "flex-1 h-8 text-sm w-full",
                      isDuplicate && "border-yellow-500 focus-visible:ring-yellow-500 dark:border-yellow-600 dark:focus-visible:ring-yellow-400" 
                    )}
                  />
                </div>

                {/* ROW 1: Column 2 - Data Type */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Data Type</Label>
                  <div className="flex items-center gap-1.5 w-full">
                    {enumName ? (
                      <Select
                        value={baseType}
                        onValueChange={(value) => {
                          // If changing from enum to another type, handle disconnection
                          if (value !== baseType && onEnumDisconnect) {
                            onEnumDisconnect(index);
                          }
                          onUpdateColumn(index, 'type', value);
                        }}
                      >
                        <SelectTrigger className="flex-1 h-8 text-xs bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
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
                              key={column.type} 
                              value={column.type}
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
                            {enumTypes.filter(e => `enum_${e.name}` !== column.type).length > 0 && (
                              <>
                                <div className="h-px bg-muted my-1"></div>
                                <div className="px-2 py-1 text-xs text-muted-foreground">Other ENUM Types</div>
                                {enumTypes
                                  .filter(e => `enum_${e.name}` !== column.type)
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
                    ) : (
                      <>
                        <Select
                          value={baseType}
                          onValueChange={(value) => {
                            // Reset parameters when changing types
                            onUpdateColumn(index, 'type', value);
                            // Reset type parameters in our state
                            setTypeParams(prev => ({
                              ...prev,
                              [rowKey]: { length: '', precision: '', scale: '' }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1 h-8 text-xs">
                            <SelectValue>
                              {/* Display the base type and parameters in the trigger */}
                              {params ? `${baseType.toUpperCase()}(${params})` : baseType.toUpperCase()}
                            </SelectValue>
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

                        {/* Length/Precision Parameter Button */}
                        {(hasLengthSupport || hasPrecisionSupport) && (
                          <Popover
                            open={openPopover[rowKey]}
                            onOpenChange={(open) => {
                              setOpenPopover(prev => ({...prev, [rowKey]: open}));
                              
                              // Pre-populate params when opening the popover
                              if (open && params) {
                                const newParams = {...typeParams};
                                if (!newParams[rowKey]) {
                                  newParams[rowKey] = {
                                    length: '',
                                    precision: '',
                                    scale: ''
                                  };
                                }
                                
                                if (hasLengthSupport) {
                                  newParams[rowKey].length = params;
                                } else if (hasPrecisionSupport) {
                                  if (params.includes(',')) {
                                    const [precision, scale] = params.split(',');
                                    newParams[rowKey].precision = precision;
                                    newParams[rowKey].scale = scale;
                                  } else {
                                    newParams[rowKey].precision = params;
                                  }
                                }
                                
                                setTypeParams(newParams);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-2 text-xs shrink-0"
                                title="Set type parameters"
                              >
                                {params ? (
                                  <span>{params}</span>
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-4" align="center">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">{baseType.toUpperCase()} Parameters</h4>
                                
                                {hasLengthSupport && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Length</Label>
                                    <Input 
                                      type="number"
                                      value={rowParams.length}
                                      onChange={(e) => updateTypeParam(rowKey, 'length', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="e.g. 255"
                                    />
                                  </div>
                                )}
                                
                                {hasPrecisionSupport && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Precision</Label>
                                    <Input 
                                      type="number"
                                      value={rowParams.precision}
                                      onChange={(e) => updateTypeParam(rowKey, 'precision', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="e.g. 10"
                                    />
                                  </div>
                                )}
                                
                                {supportsScale(baseType) && (
                                  <div className="space-y-1">
                                    <Label className="text-xs">Scale</Label>
                                    <Input 
                                      type="number"
                                      value={rowParams.scale}
                                      onChange={(e) => updateTypeParam(rowKey, 'scale', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="e.g. 2"
                                    />
                                  </div>
                                )}
                                
                                <div className="flex justify-between pt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 text-xs"
                                    onClick={() => clearTypeParams(index, baseType, rowKey)}
                                  >
                                    Clear
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-xs"
                                    onClick={() => applyTypeParams(index, baseType, rowKey)}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 2: Constraints - Full Width */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Constraints</Label>
                <div className="flex flex-wrap gap-1.5">
                  {constraints.map((constraint) => {
                    const isActive = (column.constraints || []).includes(constraint.id);
                    const config = constraintConfig[constraint.id as keyof typeof constraintConfig];
                    const ConstraintIcon = config?.icon || AlertCircle;
                    
                    // Skip rendering for enum types that can't be primary keys
                    if (constraint.id === 'primary' && column.type.startsWith('enum_')) {
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
              
              {/* ROW 3: Action Buttons - Bottom Right */}
              <div className="flex justify-end pt-1.5 mt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveColumn(index)}
                  className="h-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  title="Delete column"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
