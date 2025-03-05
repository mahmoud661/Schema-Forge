"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, KeyRound, Hash, Type, Plus, Trash2, AlertCircle, ChevronDown } from "lucide-react";
import { SchemaNode, SchemaNodeData } from "@/app/schemas/editor/[id]/types";
import { BaseSidebar } from "./ui/sidebar";
import { useSidebarStore, SidebarType } from "@/app/schemas/editor/[id]/store/sidebar-store";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarProps {
  selectedNode: SchemaNode | null;
  onUpdateNode: (data: Partial<SchemaNodeData>) => void;
  duplicateColumns?: Record<string, { isDuplicate: boolean; tables: string[] }>;
  nodes: SchemaNode[];
  onNodeSelect: (node: SchemaNode) => void;
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

// Function to generate a unique color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export function Sidebar({ selectedNode, onUpdateNode, duplicateColumns, nodes, onNodeSelect }: SidebarProps) {
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const { widths, updateWidth } = useSidebarStore();
  const [openTableId, setOpenTableId] = useState<string | null>(null);

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
    const columnId = Date.now().toString();
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
    
    if (field === 'title') {
      const existingTitles = selectedNode.data.schema
        .map(c => c.title)
        .filter((t, i) => i !== index);
      
      if (existingTitles.includes(value)) {
        toast.warning(`Column name "${value}" already exists in this table`);
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

  const handleTableClick = (node: SchemaNode) => {
    onNodeSelect(node);
    setOpenTableId(node.id === openTableId ? null : node.id);
  };

  return (
    <BaseSidebar 
      title="Schema Editor" 
      width={widths.schema}
      onWidthChange={(width) => updateWidth('schema', width)}
    >
      <div className="p-4 flex flex-col gap-4">
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

        {/* Tables List */}
        <div className="space-y-2">
          <h3 className="font-semibold">Tables</h3>
          <div className="space-y-2">
            {nodes.map((node) => (
              <Collapsible
                key={node.id}
                open={openTableId === node.id}
                onOpenChange={() => handleTableClick(node)}
              >
                <CollapsibleTrigger className="w-full">
                  <div 
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                    style={{
                      borderColor: stringToColor(node.data.label),
                      backgroundColor: `${stringToColor(node.data.label)}10`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stringToColor(node.data.label) }}
                      />
                      <span className="font-medium">{node.data.label}</span>
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform ${openTableId === node.id ? 'transform rotate-180' : ''}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {node.id === selectedNode?.id && (
                    <div className="mt-4 pl-4 border-l-2" style={{ borderColor: stringToColor(node.data.label) }}>
                      {/* Table Properties */}
                      <div className="space-y-4 mb-4">
                        <div className="space-y-2">
                          <Label>Table Name</Label>
                          <Input 
                            placeholder="Enter table name" 
                            value={selectedNode.data?.label || ''}
                            onChange={(e) => onUpdateNode({ label: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Columns */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Columns</h4>
                          <Button onClick={addColumn} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Column
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {selectedNode.data?.schema.map((column: any, index: number) => {
                            const columnKey = column.id || `column-${index}`;
                            const isDuplicate = duplicateColumns?.[column.title]?.isDuplicate;
                            
                            return (
                              <div key={columnKey} className="space-y-2 p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="Column name"
                                    value={column.title}
                                    onChange={(e) => updateColumn(index, 'title', e.target.value)}
                                    className={`flex-1 ${isDuplicate ? 'border-yellow-500' : ''}`}
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

                                {isDuplicate && (
                                  <Alert variant="warning" className="py-2 px-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">
                                      Column name duplicated in: {duplicateColumns[column.title].tables.join(', ')}
                                    </AlertDescription>
                                  </Alert>
                                )}

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
                  )}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </BaseSidebar>
  );
}