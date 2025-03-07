import { SchemaNode, EnumTypeNode } from "@/app/schemas/editor/[id]/types";
import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight, Database, Type, Trash2, X, Plus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TablesListProps {
  nodes: Array<SchemaNode | EnumTypeNode>;
  selectedNode: SchemaNode | EnumTypeNode | null;
  onNodeSelect: (node: SchemaNode | EnumTypeNode) => void;
  isDarkMode: boolean;
  tableContent: (node: SchemaNode) => React.ReactNode | null;
  onUpdateEnum?: (nodeId: string, data: Partial<any>) => void;
  onDeleteNode?: (node: SchemaNode | EnumTypeNode) => void;
  onAddEnumValue?: (nodeId: string, value: string) => void;
  onRemoveEnumValue?: (nodeId: string, value: string) => void;
  enumTypes?: any[];
}

export const TablesList: React.FC<TablesListProps> = ({
  nodes,
  selectedNode,
  onNodeSelect,
  isDarkMode,
  tableContent,
  onUpdateEnum,
  onDeleteNode,
  onAddEnumValue,
  onRemoveEnumValue,
  enumTypes = []
}) => {
  // Track expanded state for tables and enums
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [newEnumValue, setNewEnumValue] = useState<Record<string, string>>({});
  const [editingName, setEditingName] = useState<Record<string, string>>({});
  const [editingEnumValue, setEditingEnumValue] = useState<Record<string, Record<number, string>>>({});
  const { resolvedTheme } = useTheme();
  
  // Add a tracking ref for mounted state to handle async operations
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Separate tables and enums
  const tables = useMemo(() => 
    nodes.filter(n => n.type === 'databaseSchema' || !n.type) as SchemaNode[],
    [nodes]
  );
  
  const enums = useMemo(() => 
    nodes.filter(n => n.type === 'enumType') as EnumTypeNode[],
    [nodes]
  );

  // Auto-expand selected node - critical for UX
  useEffect(() => {
    if (selectedNode) {
      setExpandedItems(prev => ({
        ...prev,
        [selectedNode.id]: true
      }));
    }
  }, [selectedNode?.id]);
  
  // Ensure editingName state stays in sync with enums
  useEffect(() => {
    if (enums.length > 0) {
      const newEditingState = { ...editingName };
      
      enums.forEach(node => {
        if (editingName[node.id] === undefined) {
          newEditingState[node.id] = node.data.name;
        }
      });
      
      if (Object.keys(newEditingState).length > Object.keys(editingName).length) {
        setEditingName(newEditingState);
      }
    }
  }, [enums, editingName]);

  // Fixed: This toggle function will now BOTH toggle expansion AND select the node
  const toggleItem = (node: SchemaNode | EnumTypeNode, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop propagation to prevent double-triggering
    
    // First select the node
    onNodeSelect(node);
    
    // Then toggle the expansion state
    setExpandedItems(prev => ({
      ...prev,
      [node.id]: !prev[node.id]
    }));
  };

  // Section headers component for better structure
  const SectionHeader = ({ title, count, icon }: { title: string; count: number; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-3 px-1 border-b pb-2">
      <div className="flex items-center">
        {icon}
        <h3 className="text-sm font-medium ml-2">{title}</h3>
      </div>
      <Badge variant="outline" className="bg-muted/50">
        {count}
      </Badge>
    </div>
  );

  // Handle adding a new enum value
  const handleAddValue = (nodeId: string) => {
    if (!newEnumValue[nodeId]?.trim()) return;
    
    if (onAddEnumValue) {
      onAddEnumValue(nodeId, newEnumValue[nodeId]);
      setNewEnumValue(prev => ({...prev, [nodeId]: ''}));
    }
  };

  // Handle rename for enum
  const handleEnumRename = (nodeId: string) => {
    if (!editingName[nodeId]?.trim()) return;
    
    if (onUpdateEnum) {
      onUpdateEnum(nodeId, { name: editingName[nodeId] });
    }
  };

  // Handle edit for enum values
  const handleEditEnumValue = (nodeId: string, index: number, newValue: string) => {
    if (!newValue.trim()) return;
    
    const node = nodes.find(n => n.id === nodeId && n.type === 'enumType') as EnumTypeNode;
    if (!node) return;
    
    // Create a new array with the updated value
    const updatedValues = [...node.data.values];
    updatedValues[index] = newValue;
    
    if (onUpdateEnum) {
      onUpdateEnum(nodeId, { values: updatedValues });
      
      // Clear editing state
      setEditingEnumValue(prev => {
        const newState = {...prev};
        if (newState[nodeId]) {
          delete newState[nodeId][index];
        }
        return newState;
      });
    }
  };

  // Fixed: This is the key fix - separate table selection from dropdown expansion
  const handleItemClick = (node: SchemaNode | EnumTypeNode) => {
    onNodeSelect(node);
  };

  return (
    <div className="space-y-6">
      {/* TABLES SECTION */}
      <div>
        <SectionHeader 
          title="Tables" 
          count={tables.length}
          icon={<Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />

        <div className="space-y-2">
          {tables.length > 0 ? (
            tables.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isExpanded = expandedItems[node.id];
              
              // Get node color
              const getColor = () => {
                if (node.data.color) {
                  return isDarkMode ? node.data.color.dark : node.data.color.light;
                }
                // Fallback color logic
                const colorIndex = Math.abs(
                  (node.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0) % 7
                );
                const colors = ['#e0f2fe', '#dcfce7', '#fef3c7', '#fce7f3', '#f3e8ff', '#ffedd5', '#f1f5f9'];
                const darkColors = ['#0c4a6e', '#14532d', '#78350f', '#831843', '#581c87', '#7c2d12', '#334155'];
                return isDarkMode ? darkColors[colorIndex] : colors[colorIndex];
              };

              return (
                <div key={node.id} className="rounded-md shadow-sm border overflow-hidden">
                  <div 
                    className={cn(
                      "flex items-center justify-between p-3 transition-colors cursor-pointer",
                      isSelected 
                        ? "bg-primary/10 border-b border-primary/30" 
                        : "hover:bg-muted/40 border-b border-muted",
                      isExpanded ? "border-b" : ""
                    )}
                    onClick={() => handleItemClick(node)} // Use our fixed handler
                    style={{ 
                      backgroundColor: isSelected 
                        ? isDarkMode ? 'rgba(29, 78, 216, 0.15)' : 'rgba(59, 130, 246, 0.1)'
                        : (getColor() + '20')
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {/* Fixed: Explicitly prevent event bubbling and give more padding for better clickability */}
                      <button 
                        className="p-2 rounded-md hover:bg-muted/70 dark:hover:bg-muted/30"
                        onClick={(e) => toggleItem(node, e)}
                        type="button"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm" 
                        style={{ backgroundColor: node.data.color?.border || '#38bdf8' }}
                      />
                      
                      <span className="font-medium text-sm truncate flex-1">
                        {node.data.label}
                      </span>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {node.data.schema.length} row
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div className="bg-background/60 p-0.5">
                      {tableContent && tableContent(node)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-muted-foreground italic px-3 py-6 text-center border rounded-md bg-muted/10">
              No tables yet. Drag a table from above to create one.
            </div>
          )}
        </div>
      </div>
      
      {/* ENUMS SECTION - Now with inline editing like tables */}
      {useMemo(() => (
        enums.length > 0 && (
          <div>
            <SectionHeader 
              title="ENUM Types" 
              count={enums.length}
              icon={<Type className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
            />
            
            <div className="space-y-2">
              {enums.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isExpanded = expandedItems[node.id];
                
                // Initialize state for this enum if needed
                if (editingName[node.id] === undefined) {
                  setEditingName(prev => ({...prev, [node.id]: node.data.name}));
                }

                return (
                  <div key={node.id} className="rounded-md shadow-sm border border-purple-100/50 dark:border-purple-900/30 overflow-hidden">
                    <div 
                      className={cn(
                        "flex items-center justify-between p-3 transition-colors cursor-pointer",
                        isSelected 
                          ? "bg-purple-100/50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800/50" 
                          : "hover:bg-purple-50/30 dark:hover:bg-purple-900/20 border-b border-purple-100/50 dark:border-purple-900/30",
                        isExpanded ? "border-b" : ""
                      )}
                      onClick={() => handleItemClick(node)} // Use our fixed handler
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {/* Fixed: Improved padding and click target size */}
                        <button 
                          className="p-2 rounded-md hover:bg-muted/70 dark:hover:bg-muted/30"
                          onClick={(e) => toggleItem(node, e)}
                          type="button"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-purple-500" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-purple-500" />
                          )}
                        </button>
                        
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        
                        <span className="font-medium text-sm text-purple-700 dark:text-purple-300 truncate flex-1">
                          {node.data.name}
                        </span>
                        
                        <Badge variant="outline" className="text-[10px] bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-300">
                          {node.data.values.length}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Expandable enum content - now with editable values */}
                    {isExpanded && (
                      <div className="bg-purple-50/20 dark:bg-purple-900/10">
                        <div className="p-3 space-y-3">
                          {/* ENUM Name editor */}
                          <div className="flex items-center space-x-2">
                            <Input 
                              value={editingName[node.id] || node.data.name} 
                              onChange={(e) => setEditingName(prev => ({...prev, [node.id]: e.target.value}))}
                              onBlur={() => handleEnumRename(node.id)}
                              placeholder="ENUM name"
                              className="h-7 text-sm"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleEnumRename(node.id)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          
                          {/* ENUM Values list - now with editable values */}
                          <div className="rounded-md border border-purple-100/50 dark:border-purple-800/30 divide-y divide-purple-100/50 dark:divide-purple-900/30 max-h-[150px] overflow-y-auto">
                            {node.data.values.length > 0 ? (
                              node.data.values.map((value, index) => {
                                const isEditing = editingEnumValue[node.id]?.[index] !== undefined;
                                
                                return (
                                  <div 
                                    key={`${node.id}-value-${index}`}
                                    className="flex items-center justify-between py-1.5 px-2.5 text-xs hover:bg-purple-50/50 dark:hover:bg-purple-900/20"
                                  >
                                    {isEditing ? (
                                      <Input
                                        className="h-6 text-xs py-0 px-1 mr-1"
                                        value={editingEnumValue[node.id]?.[index] || value}
                                        onChange={(e) => {
                                          setEditingEnumValue(prev => ({
                                            ...prev,
                                            [node.id]: {
                                              ...(prev[node.id] || {}),
                                              [index]: e.target.value
                                            }
                                          }));
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleEditEnumValue(
                                              node.id, 
                                              index, 
                                              editingEnumValue[node.id]?.[index] || value
                                            );
                                          } else if (e.key === 'Escape') {
                                            setEditingEnumValue(prev => {
                                              const newState = {...prev};
                                              if (newState[node.id]) {
                                                delete newState[node.id][index];
                                              }
                                              return newState;
                                            });
                                          }
                                        }}
                                        onBlur={() => {
                                          handleEditEnumValue(
                                            node.id, 
                                            index, 
                                            editingEnumValue[node.id]?.[index] || value
                                          );
                                        }}
                                        autoFocus
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 flex-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                        <span 
                                          className="font-mono text-purple-800 dark:text-purple-300 cursor-pointer hover:underline" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEnumValue(prev => ({
                                              ...prev,
                                              [node.id]: {
                                                ...(prev[node.id] || {}),
                                                [index]: value
                                              }
                                            }));
                                          }}
                                          title="Click to edit"
                                        >
                                          '{value}'
                                        </span>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center gap-1">
                                      {!isEditing && (
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-5 w-5 opacity-60 hover:opacity-100"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEnumValue(prev => ({
                                              ...prev,
                                              [node.id]: {
                                                ...(prev[node.id] || {}),
                                                [index]: value
                                              }
                                            }));
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-5 w-5 text-destructive/70 hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onRemoveEnumValue) onRemoveEnumValue(node.id, value);
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="py-2 px-3 text-xs italic text-muted-foreground text-center">
                                No values defined
                              </div>
                            )}
                          </div>
                          
                          {/* Add new value */}
                          <div className="flex items-center space-x-1">
                            <Input 
                              value={newEnumValue[node.id] || ''}
                              onChange={(e) => setNewEnumValue(prev => ({...prev, [node.id]: e.target.value}))}
                              placeholder="New value"
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddValue(node.id);
                                }
                              }}
                            />
                            <Button 
                              size="sm"
                              className="h-7"
                              onClick={() => handleAddValue(node.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Add
                            </Button>
                          </div>
                          
                          {/* Delete button */}
                          <div className="flex justify-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onDeleteNode) onDeleteNode(node);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete ENUM
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )
      ), [enums, selectedNode?.id, expandedItems, editingName, newEnumValue, editingEnumValue])}
    </div>
  );
};
