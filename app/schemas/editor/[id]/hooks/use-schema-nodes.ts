import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { SchemaNode, EnumTypeNode } from "../types";
import { useSchemaStore } from "@/hooks/use-schema";
import { toast } from "sonner";

// Color palette for table headers - moved here for central assignment
const TABLE_COLORS = [
  { light: '#e0f2fe', dark: '#0c4a6e', border: '#38bdf8' }, // blue
  { light: '#dcfce7', dark: '#14532d', border: '#34d399' }, // green
  { light: '#fef3c7', dark: '#78350f', border: '#fbbf24' }, // yellow
  { light: '#fce7f3', dark: '#831843', border: '#ec4899' }, // pink
  { light: '#f3e8ff', dark: '#581c87', border: '#c084fc' }, // purple
  { light: '#ffedd5', dark: '#7c2d12', border: '#fb923c' }, // orange
  { light: '#f1f5f9', dark: '#334155', border: '#94a3b8' }, // slate
];

function generateId() {
  return Date.now().toString();
}

// Assign a stable color based on index
function assignTableColor(index: number) {
  return TABLE_COLORS[index % TABLE_COLORS.length];
}

export function useSchemaNodes() {
  const { 
    schema, 
    setSelectedNode, 
    updateNodes, 
    updateNodeData: updateNodeDataInStore,
    addEnumType,
    removeEnumType,
    updateEdges
  } = useSchemaStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNode } = useReactFlow();
  
  // Keep track of how many tables we've created to assign consistent colors
  const tableCountRef = useRef<number>(schema.nodes.filter(n => n.type === 'databaseSchema' || !n.type).length);

  const onNodeClick = useCallback((event: React.MouseEvent, node: SchemaNode | EnumTypeNode) => {
    setSelectedNode(node as SchemaNode);
  }, [setSelectedNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (type === 'table') {
        const baseLabel = "New Table";
        const label = getUniqueLabel(baseLabel, schema.nodes);
        
        // Generate a unique ID
        const nodeId = `table-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Assign a color based on the table count
        const color = assignTableColor(tableCountRef.current);
        tableCountRef.current += 1;
  
        const newNode = {
          id: nodeId,
          type: 'databaseSchema',
          position,
          data: {
            label,
            id: nodeId,
            color, // Store color in node data
            schema: [
              { 
                title: "id", 
                type: "uuid",
                constraints: ["primary", "notnull"] 
              },
              { 
                title: "created_at", 
                type: "timestamp",
                constraints: ["notnull"]
              },
            ],
          },
        };
  
        updateNodes([...schema.nodes, newNode as SchemaNode]);
      } else if (type === 'enum') {
        const baseName = "new_enum_type";
        const name = getUniqueEnumName(baseName, schema.enumTypes || []);
        
        // Create enum values
        const enumValues = ['value1', 'value2', 'value3'];
        
        // First add the enum type to store
        try {
          addEnumType({ name, values: enumValues });
          
          // Then create the visual node
          const newEnumNode = {
            id: `enum-${generateId()}`,
            type: 'enumType',
            position,
            data: {
              name,
              values: enumValues
            },
          };
          
          // Update nodes in the flow
          updateNodes([...schema.nodes, newEnumNode as EnumTypeNode]);
        } catch (error) {
          console.error("Error adding enum type:", error);
        }
      }
    },
    [screenToFlowPosition, schema.nodes, schema.enumTypes, updateNodes, addEnumType]
  );

  const getUniqueLabel = (baseLabel: string, nodes: SchemaNode[]) => {
    let label = baseLabel;
    let count = 1;
    const existingLabels = nodes.map((node) => node.data.label);
    while (existingLabels.includes(label)) {
      label = `${baseLabel}_${count}`;
      count++;
    }
    return label;
  };

  const getUniqueEnumName = (baseName: string, enumTypes: any[]) => {
    let name = baseName;
    let count = 1;
    const existingNames = enumTypes.map(enumType => enumType.name);
    while (existingNames.includes(name)) {
      name = `${baseName}_${count}`;
      count++;
    }
    return name;
  };

  const updateNodeData = useCallback((node: SchemaNode, nodeData: Partial<any>) => {
    updateNodeDataInStore(node.id, nodeData);
    
    // Also ensure the ReactFlow internal state is in sync
    if (node.id) {
      // We use setTimeout to ensure this runs after React has processed our state updates
      setTimeout(() => {
        const updatedNode = getNode(node.id);
        if (updatedNode) {
          setSelectedNode(updatedNode as any);
        }
      }, 0);
    }
  }, [getNode, setSelectedNode, updateNodeDataInStore]);

  const deleteNode = useCallback((node: SchemaNode | EnumTypeNode) => {
    if (!node) return;
    
    // Handle enum type deletion
    if (node.type === 'enumType') {
      // First check if this enum is used by any tables
      const usedByColumns: { table: string; column: string }[] = [];
      
      schema.nodes.forEach(tableNode => {
        if ((tableNode.type === 'databaseSchema' || !tableNode.type) && tableNode.data.schema) {
          tableNode.data.schema.forEach((col: any) => {
            if (col.type === `enum_${node.data.name}`) {
              usedByColumns.push({
                table: tableNode.data.label,
                column: col.title
              });
            }
          });
        }
      });
      
      // If enum is in use, don't delete
      if (usedByColumns.length > 0) {
        toast.error(`Cannot delete: This ENUM is used by ${usedByColumns.length} column(s)`);
        return false;
      }
      
      // Remove from enum store
      const enumIndex = schema.enumTypes.findIndex(et => et.name === node.data.name);
      if (enumIndex !== -1) {
        removeEnumType(enumIndex);
      }
    }
    
    // Clean up any edges connected to this node
    const updatedEdges = schema.edges.filter(
      edge => edge.source !== node.id && edge.target !== node.id
    );
    
    if (updatedEdges.length !== schema.edges.length) {
      updateEdges(updatedEdges);
    }
    
    // Remove the node from the canvas
    const updatedNodes = schema.nodes.filter(n => n.id !== node.id);
    updateNodes(updatedNodes);
    
    // Clear selection
    setSelectedNode(null);
    
    toast.success(`Deleted ${node.type === 'enumType' ? 'ENUM type' : 'table'} successfully`);
    return true;
  }, [schema.nodes, schema.edges, schema.enumTypes, updateNodes, updateEdges, removeEnumType, setSelectedNode]);

  return {
    selectedNode: schema.selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData,
    deleteNode
  };
}

// Export the color palette for use in other components
export { TABLE_COLORS };