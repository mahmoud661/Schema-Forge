import { Button } from "@/components/ui/button";
import { SchemaNode, EnumTypeNode } from "@/app/schemas/editor/[id]/types";
import { useState } from "react";
import { Table } from "lucide-react";
import { TableItem } from "./table-item";
import { EnumItem } from "./enum-item";
import { themeAwareStringToColor } from "@/lib/utils";

interface TablesListProps {
  nodes: (SchemaNode | EnumTypeNode)[];
  selectedNode: SchemaNode | EnumTypeNode | null;
  onNodeSelect: (node: SchemaNode | EnumTypeNode) => void;
  isDarkMode: boolean;
  tableContent?: (node: SchemaNode) => React.ReactNode;
}

export const TablesList: React.FC<TablesListProps> = ({
  nodes,
  selectedNode,
  onNodeSelect,
  isDarkMode,
  tableContent
}) => {
  const [openTableId, setOpenTableId] = useState<string | null>(null);

  const handleTableClick = (node: SchemaNode | EnumTypeNode) => {
    onNodeSelect(node);
    setOpenTableId(node.id === openTableId ? null : node.id);
  };

  const toggleAllTables = () => {
    setOpenTableId(openTableId ? null : nodes[0]?.id || null);
  };

  // Separate tables and enum types
  const tables = nodes.filter(node => node.type === 'databaseSchema' || !node.type);
  const enumTypes = nodes.filter(node => node.type === 'enumType');
  
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-lg bg-muted/20">
        <Table className="h-8 w-8 text-muted-foreground/60 mb-2" />
        <p className="text-sm text-muted-foreground text-center">No tables yet. Drag a table component to the canvas to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Tables ({tables.length})</h3>
        {nodes.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={toggleAllTables}>
            {openTableId ? "Collapse All" : "Expand All"}
          </Button>
        )}
      </div>

      {/* Tables section */}
      <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {tables.map((node) => (
          <TableItem
            key={node.id}
            node={node as SchemaNode}
            isSelected={selectedNode?.id === node.id}
            isOpen={openTableId === node.id}
            isDarkMode={isDarkMode}
            onToggle={() => handleTableClick(node)}
          >
            {tableContent && selectedNode?.id === node.id && tableContent(node as SchemaNode)}
          </TableItem>
        ))}

        {/* ENUM Types section */}
        {enumTypes.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2">
              ENUM Types ({enumTypes.length})
            </h3>
            
            {enumTypes.map((node) => (
              <EnumItem 
                key={node.id}
                node={node as EnumTypeNode}
                isSelected={selectedNode?.id === node.id}
                onClick={() => onNodeSelect(node)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
