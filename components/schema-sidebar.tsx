"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, KeyRound, Hash, Type, Plus, Trash2, GripVertical } from "lucide-react";
import { SchemaNode, SchemaNodeData } from "@/app/schemas/editor/[id]/types";

interface SidebarProps {
  selectedNode: SchemaNode | null;
  onUpdateNode: (data: Partial<SchemaNodeData>) => void;
}

const dataTypes = [
  { id: "uuid", label: "UUID", icon: KeyRound },
  { id: "varchar", label: "VARCHAR", icon: Type },
  { id: "text", label: "TEXT", icon: Type },
  { id: "int4", label: "INTEGER", icon: Hash },
  { id: "money", label: "MONEY", icon: Hash },
  { id: "timestamp", label: "TIMESTAMP", icon: Hash },
  { id: "boolean", label: "BOOLEAN", icon: Hash },
  { id: "jsonb", label: "JSONB", icon: Type },
  { id: "date", label: "DATE", icon: Hash },
  { id: "time", label: "TIME", icon: Hash },
];

const constraints = [
  { id: "primary", label: "Primary Key" },
  { id: "unique", label: "Unique" },
  { id: "notnull", label: "Not Null" },
  { id: "index", label: "Index" },
];

export function Sidebar({ selectedNode, onUpdateNode }: SidebarProps) {
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width (80 in rem)
  const [isDragging, setIsDragging] = useState(false);
  const minWidth = 240; // Minimum sidebar width
  const maxWidth = 600; // Maximum sidebar width
  
  // Handle mouse down on resize handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(nodeType);
  };

  const onDragEnd = () => {
    setDraggedType(null);
  };

  const addColumn = () => {
    if (!selectedNode) return;
    const columnId = Date.now().toString(); // Generate unique ID for new column
    onUpdateNode({
      schema: [
        ...(selectedNode.data?.schema || []),
        { title: "new_column", type: "varchar", constraints: [], id: columnId }
      ]
    });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    
    // For title updates, ensure we handle this specially
    if (field === 'title') {
      // Ensure title is unique or has a fallback
      const existingTitles = selectedNode.data.schema
        .map(c => c.title)
        .filter((t, i) => i !== index);
      
      if (existingTitles.includes(value)) {
        value = `${value}_${index}`;
      }
    }
    
    newSchema[index] = { ...newSchema[index], [field]: value };
    onUpdateNode({ schema: newSchema });
  };

  const removeColumn = (index: number) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    newSchema.splice(index, 1);
    onUpdateNode({ schema: newSchema });
  };

  const toggleConstraint = (index: number, constraint: string) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    const column = newSchema[index];
    const constraints = column.constraints || [];
    const hasConstraint = constraints.includes(constraint);
    
    newSchema[index] = {
      ...column,
      constraints: hasConstraint 
        ? constraints.filter(c => c !== constraint)
        : [...constraints, constraint]
    };
    
    onUpdateNode({ schema: newSchema });
  };

  return (
    <div className="flex relative" style={{ width: `${sidebarWidth}px` }}>
      <div className="flex-1 border-r bg-background p-4 flex flex-col gap-4 overflow-y-auto">
        <div>
          <h3 className="font-semibold mb-2">Add Table</h3>
          <div
            className="p-3 border rounded-lg cursor-move transition-colors hover:bg-muted"
            draggable
            onDragStart={(e) => onDragStart(e, 'databaseSchema')}
            onDragEnd={onDragEnd}
          >
            <div className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              <span>Database Table</span>
            </div>
          </div>
        </div>

        <Separator />

        {selectedNode ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Table Properties</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Input 
                    placeholder="Enter table name" 
                    value={selectedNode.data?.label || ''}
                    onChange={(e) => onUpdateNode({ label: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Columns</h3>
                <Button onClick={addColumn} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-4">
                {selectedNode.data?.schema.map((column: any, index: number) => {
                  // Generate a stable key that doesn't depend on the title
                  const columnKey = column.id || `column-${index}`;
                  
                  return (
                  <div key={columnKey} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Column name"
                        value={column.title}
                        onChange={(e) => updateColumn(index, 'title', e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={column.type}
                        onValueChange={(value) => updateColumn(index, 'type', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Data Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeColumn(index)}
                        className="text-destructive hover:text-destructive/90"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {constraints.map((constraint) => (
                        <div key={`${columnKey}-${constraint.id}`} className="flex items-center gap-2">
                          <Switch
                            checked={(column.constraints || []).includes(constraint.id)}
                            onCheckedChange={() => toggleConstraint(index, constraint.id)}
                            id={`${columnKey}-${constraint.id}`}
                          />
                          <Label htmlFor={`${columnKey}-${constraint.id}`} className="text-sm">
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
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            Select a table to edit its properties
          </div>
        )}
      </div>
      
      {/* Resize handle */}
      <div 
        className="w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-10 flex items-center justify-center opacity-0 hover:opacity-50">
          <GripVertical className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}