"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, KeyRound, Hash, Type, PaintBucket } from "lucide-react";
import { SchemaNode, SchemaNodeData, EnumTypeNode } from "@/app/schemas/editor/[id]/types/types";
import { BaseSidebar } from "../../../../../../components/ui/sidebar";
import { useSidebarStore } from "@/app/schemas/editor/[id]/store/sidebar-store";
import { useTheme } from "next-themes";
import { themeAwareStringToColor } from "@/lib/utils";
import { useSchemaStore } from "@/hooks/use-schema";
import { ColorPicker } from "@/components/ui/color-picker";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

// Import our new components
import { DraggableElements } from "./schema/draggable-elements";
import { TablesList } from "./schema/tables-list";
import { ColumnEditor } from "./row-editor";
import { EnumEditor } from "./schema/enum-editor";
import { useTableOperations } from "@/hooks/use-table-operations";
import { useEnumOperations } from "@/hooks/use-enum-operations";
import { toast } from "sonner";
import { useCallback } from "react";
import { generateColorVariants } from "@/lib/color-utils";

export function Sidebar() {
  const { widths, updateWidth } = useSidebarStore();
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Access schema store directly 
  const { 
    schema, 
    updateNodeData: updateNodeDataInStore, 
    setSelectedNode,
    deleteNode: deleteNodeInStore
  } = useSchemaStore(); 
  
  const { 
    nodes, 
    selectedNode, 
    duplicateRows,
    enumTypes = []
  } = schema;

  // Use appropriate selectedNode for operations
  const tableOperations = useTableOperations(
    selectedNode && (selectedNode.type === 'databaseSchema' || !selectedNode.type) ? selectedNode as SchemaNode : null,
    (data) => {
      if (selectedNode) {
        updateNodeDataInStore(selectedNode.id, data);
      }
    }
  );
  
  const enumOperations = useEnumOperations(
    selectedNode?.type === 'enumType' ? (selectedNode as unknown as EnumTypeNode) : null,
    (data) => {
      if (selectedNode) {
        updateNodeDataInStore(selectedNode.id, data);
      }
    },
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
    updateNodeDataInStore(nodeId, data);
  };
  
  const handleAddEnumValue = (nodeId: string, value: string) => {
    const enumNode = nodes.find(node => node.id === nodeId && node.type === 'enumType') as EnumTypeNode;
    if (enumNode) {
      // Check for duplicates
      if (enumNode.data.values.includes(value)) {
        toast.warning(`Value "${value}" already exists in this ENUM`);
        return;
      }
      
      updateNodeDataInStore(nodeId, {
        values: [...enumNode.data.values, value]
      });
      
      toast.success(`Added value to ENUM`);
    }
  };
  
  const handleRemoveEnumValue = (nodeId: string, value: string) => {
    const enumNode = nodes.find(node => node.id === nodeId && node.type === 'enumType') as EnumTypeNode;
    if (enumNode) {
      updateNodeDataInStore(nodeId, {
        values: enumNode.data.values.filter(v => v !== value)
      });
    }
  };

  const handleColorChange = useCallback((nodeId: string, tableColor: any, colorType: 'light' | 'dark' | 'border', color: string) => {
    // Update only via the store
    updateNodeDataInStore(nodeId, {
      color: {
        ...tableColor,
        [colorType]: color
      }
    });
  }, [updateNodeDataInStore]);

  const handleResetColors = useCallback((nodeId: string) => {
    updateNodeDataInStore(nodeId, { color: null });
    toast.success("Reset to default table colors");
  }, [updateNodeDataInStore]);

  // Fast Color Update function
  const handleFastColorChange = useCallback((nodeId: string, color: string) => {
    // Generate light/dark variants from the selected color
    const colorVariants = generateColorVariants(color);
    
    // Use the super-fast direct DOM updater if available
    if (typeof window !== 'undefined' && window.__schemaColorUpdater) {
      // @ts-ignore - Using our global handler for performance
      window.__schemaColorUpdater(nodeId, colorVariants);
    } else {
      // Fall back to standard update
      updateNodeDataInStore(nodeId, { color: colorVariants });
    }
  }, [updateNodeDataInStore]);

  // Update the border color handler to only send the border color
  const handleBorderColorChange = useCallback((nodeId: string, color: string) => {
    // We only need to update the border color now
    const colorData = {
      border: color,
      // Maintain compatibility with the existing code
      light: 'transparent',
      dark: 'transparent'
    };
    
    // Use the super-fast direct DOM updater if available
    if (typeof window !== 'undefined' && window.__schemaColorUpdater) {
      // @ts-ignore - Using our global handler for performance
      window.__schemaColorUpdater(nodeId, colorData);
    } else {
      // Fall back to standard update
      updateNodeDataInStore(nodeId, { color: colorData });
    }
  }, [updateNodeDataInStore]);
  
  const onNodeSelect = (node: SchemaNode | EnumTypeNode) => {
    setSelectedNode(node);
  };

  // Render table content only when a table is selected
  const renderTableContent = (node: SchemaNode) => {
    if (!selectedNode || node.id !== selectedNode.id || selectedNode.type === 'enumType') return null;
    
    // Get current color values or defaults
    const defaultColor = {
      light: '#e0f2fe',
      dark: '#0c4a6e',
      border: '#38bdf8'
    };
    
    const tableColor = node.data?.color || defaultColor;
    const isTableColorCustomized = !!node.data?.color;

    return (
      <div className="px-3 py-3 space-y-3">
        {/* Table Properties */}
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Table Name</Label>
            <Input 
              placeholder="Enter table name" 
              value={node.data?.label || ''}
              onChange={(e) => {
                updateNodeDataInStore(node.id, { label: e.target.value });
              }}
              className="h-8 text-sm"
            />
          </div>
          
          {/* Table Appearance Settings Accordion */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="appearance" className="border-none">
              <AccordionTrigger className="py-1.5 px-0 text-xs font-medium text-muted-foreground hover:text-foreground hover:no-underline">
                <div className="flex items-center gap-1.5">
                  <PaintBucket className="h-3.5 w-3.5" />
                  Table Style
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-2">
                <div className="space-y-3">
                  <ColorPicker
                    label="Border:"
                    color={node.data?.color?.border || '#38bdf8'}
                    onChange={(color) => handleBorderColorChange(node.id, color)}
                  />
                  
                  {isTableColorCustomized && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-6 text-xs w-full"
                      onClick={() => handleResetColors(node.id)}
                    >
                      Reset to Default
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Row Editor */}
          {selectedNode && selectedNode.data?.schema && (
            <ColumnEditor 
              rows={selectedNode.data.schema}
              onAddColumn={tableOperations.addColumn}
              onUpdateColumn={tableOperations.updateColumn}
              onRemoveColumn={tableOperations.removeColumn}
              onToggleConstraint={tableOperations.toggleConstraint}
              duplicateRows={duplicateRows && selectedNode.data?.label ? duplicateRows[selectedNode.data.label] : undefined}
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
              onClick={() => selectedNode && deleteNodeInStore(selectedNode)}
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
        
        {/* Scrollable Node List - Always render all nodes with key for better updates */}
        <div key={`sidebar-nodes-${nodes.length}`} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <TablesList 
            nodes={nodes}
            selectedNode={selectedNode}
            onNodeSelect={onNodeSelect}
            isDarkMode={isDarkMode}
            tableContent={renderTableContent}
            onUpdateEnum={handleUpdateEnum}
            onDeleteNode={deleteNodeInStore}
            onAddEnumValue={handleAddEnumValue}
            onRemoveEnumValue={handleRemoveEnumValue}
            enumTypes={enumTypes}
          />
        </div>
      </div>
    </BaseSidebar>
  );
}

// The dataTypes and constraints arrays definitions remain unchanged
const dataTypes = [
  { id: "uuid", label: "UUID", icon: KeyRound },
  { id: "varchar", label: "VARCHAR", icon: Type },
  { id: "char", label: "CHAR", icon: Type },
  { id: "text", label: "TEXT", icon: Type },
  { id: "int", label: "INT", icon: Hash },
  { id: "int4", label: "INTEGER", icon: Hash },
  { id: "serial", label: "SERIAL", icon: Hash },
  { id: "decimal", label: "DECIMAL", icon: Hash },
  { id: "numeric", label: "NUMERIC", icon: Hash },
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