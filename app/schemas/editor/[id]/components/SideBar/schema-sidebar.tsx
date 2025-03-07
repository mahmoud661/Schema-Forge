"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, KeyRound, Hash, Type } from "lucide-react";
import { SchemaNode, SchemaNodeData, EnumTypeNode } from "@/app/schemas/editor/[id]/types";
import { BaseSidebar } from "../../../../../../components/ui/sidebar";
import { useSidebarStore } from "@/app/schemas/editor/[id]/store/sidebar-store";
import { useTheme } from "next-themes";
import { themeAwareStringToColor } from "@/lib/utils";
import { useSchemaStore } from "@/hooks/use-schema";

// Import our new components
import { DraggableElements } from "./schema/draggable-elements";
import { TablesList } from "./schema/tables-list";
import { ColumnEditor } from "./row-editor";
import { EnumEditor } from "./schema/enum-editor";
import { useTableOperations } from "@/hooks/use-table-operations";
import { useEnumOperations } from "@/hooks/use-enum-operations";
import { toast } from "sonner";

interface SidebarProps {
  selectedNode: SchemaNode | EnumTypeNode | null;
  onUpdateNode: (data: Partial<SchemaNodeData | any>) => void;
  onDeleteNode: (node: SchemaNode | EnumTypeNode) => void;
  duplicateColumns?: Record<string, { isDuplicate: boolean; tables: string[] }>;
  nodes: (SchemaNode | EnumTypeNode)[];
  onNodeSelect: (node: SchemaNode | EnumTypeNode) => void;
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

export function Sidebar({ 
  selectedNode, 
  onUpdateNode, 
  onDeleteNode,
  duplicateColumns, 
  nodes, 
  onNodeSelect 
}: SidebarProps) {
  const { widths, updateWidth } = useSidebarStore();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const { schema } = useSchemaStore();
  const enumTypes = schema.enumTypes || [];
  
  const tableOperations = useTableOperations(
    selectedNode && (selectedNode.type === 'databaseSchema' || !selectedNode.type) ? selectedNode as SchemaNode : null,
    onUpdateNode
  );
  
  const enumOperations = useEnumOperations(
    selectedNode?.type === 'enumType' ? selectedNode as EnumTypeNode : null,
    onUpdateNode,
    nodes
  );
  
  // Handle enum disconnection
  const handleEnumDisconnect = (index: number) => {
    if (tableOperations.disconnectFromEnum) {
      tableOperations.disconnectFromEnum(index);
    }
  };
  
  // Handle enum operations directly from TablesList
  const handleUpdateEnum = (nodeId: string, data: Partial<any>) => {
    const enumNode = nodes.find(node => node.id === nodeId && node.type === 'enumType') as EnumTypeNode;
    if (enumNode) {
      // For renaming the enum type
      if (data.name && data.name !== enumNode.data.name) {
        const oldName = enumNode.data.name;
        onUpdateNode({...data});

        // This is handled by useEnumOperations
      } else {
        // For other updates like modifying values
        onUpdateNode({...data});
      }
    }
  };
  
  const handleAddEnumValue = (nodeId: string, value: string) => {
    const enumNode = nodes.find(node => node.id === nodeId && node.type === 'enumType') as EnumTypeNode;
    if (enumNode) {
      // Check for duplicates
      if (enumNode.data.values.includes(value)) {
        toast.warning(`Value "${value}" already exists in this ENUM`);
        return;
      }
      
      onUpdateNode({
        values: [...enumNode.data.values, value]
      });
      
      toast.success(`Added value to ENUM`);
    }
  };
  
  const handleRemoveEnumValue = (nodeId: string, value: string) => {
    const enumNode = nodes.find(node => node.id === nodeId && node.type === 'enumType') as EnumTypeNode;
    if (enumNode) {
      onUpdateNode({
        values: enumNode.data.values.filter(v => v !== value)
      });
    }
  };

  // Render table content only when a table is selected
  const renderTableContent = (node: SchemaNode) => {
    if (node.id !== selectedNode?.id || selectedNode.type === 'enumType') return null;

    return (
      <div className="px-3 py-3 space-y-3">
        {/* Table Properties */}
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Table Name</Label>
            <Input 
              placeholder="Enter table name" 
              value={node.data?.label || ''}
              onChange={(e) => onUpdateNode({ label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          {/* Row Editor */}
          {selectedNode && selectedNode.data?.schema && (
            <ColumnEditor 
              columns={selectedNode.data.schema}
              onAddColumn={tableOperations.addColumn}
              onUpdateColumn={tableOperations.updateColumn}
              onRemoveColumn={tableOperations.removeColumn}
              onToggleConstraint={tableOperations.toggleConstraint}
              duplicateColumns={duplicateColumns}
              dataTypes={dataTypes}
              constraints={constraints}
              enumTypes={enumTypes}
              onEnumDisconnect={handleEnumDisconnect}
            />
          )}
          
          {/* Delete Button */}
          <div className="flex justify-end pt-2">
            <Button 
              variant="destructive" 
              size="sm"
              className="h-7 text-xs" 
              onClick={() => selectedNode && onDeleteNode(selectedNode)}
            >
              Delete Table
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseSidebar 
      title="Schema Editor" 
      width={widths.schema}
      onWidthChange={(width) => updateWidth('schema', width)}
      collapsible={true}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Draggable Elements */}
        <div className="p-3 border-b">
          <DraggableElements />
        </div>
        
        {/* Scrollable Node List with integrated ENUM editing */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <TablesList 
            nodes={nodes}
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
            isDarkMode={isDarkMode}
            tableContent={renderTableContent}
            onUpdateEnum={handleUpdateEnum}
            onDeleteNode={onDeleteNode}
            onAddEnumValue={handleAddEnumValue}
            onRemoveEnumValue={handleRemoveEnumValue}
            enumTypes={enumTypes}
          />
        </div>
      </div>
    </BaseSidebar>
  );
}