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
  
  // Determine if selected node is an enum node
  const isEnumNode = selectedNode?.type === 'enumType';
  const isTableNode = selectedNode && (selectedNode.type === 'databaseSchema' || !selectedNode.type);
  
  // Get enum usages if an enum node is selected
  const enumUsages = isEnumNode ? enumOperations.findColumnsUsingEnum() : [];

  // Render table content only when a table is selected
  const renderTableContent = (node: SchemaNode) => {
    if (node.id !== selectedNode?.id) return null;

    return (
      <div className="mt-2 pl-4 border-l-2 space-y-4" style={{ 
        borderColor: themeAwareStringToColor(node.data?.label || 'Table', { darkMode: isDarkMode }) 
      }}>
        {/* Table Properties */}
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Table Name</Label>
            <Input 
              placeholder="Enter table name" 
              value={node.data?.label || ''}
              onChange={(e) => onUpdateNode({ label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex justify-end">
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
      </div>
    );
  };

  return (
    <BaseSidebar 
      title="Schema Editor" 
      width={widths.schema}
      onWidthChange={(width) => updateWidth('schema', width)}
    >
      <div className="p-4 flex flex-col gap-4">
        {/* Draggable Schema Elements */}
        <DraggableElements />

        <Separator />

        {/* Tables List with tables and enum types */}
        <TablesList 
          nodes={nodes}
          selectedNode={selectedNode}
          onNodeSelect={onNodeSelect}
          isDarkMode={isDarkMode}
          tableContent={renderTableContent}
        />
        
        {/* ENUM Editor - Show when an ENUM node is selected */}
        {isEnumNode && (
          <EnumEditor
            name={selectedNode.data?.name || ''}
            values={selectedNode.data?.values || []}
            usages={enumUsages}
            onRename={enumOperations.renameEnumType}
            onAddValue={(value) => {
              enumOperations.setNewEnumValue(value);
              enumOperations.addEnumValue();
            }}
            onRemoveValue={enumOperations.removeEnumValue}
            onDelete={() => {
              if (selectedNode) {
                onDeleteNode(selectedNode);
              }
            }}
          />
        )}
      </div>
    </BaseSidebar>
  );
}