import { useCallback, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
import { SchemaNode, EnumTypeNode } from "../types";
import { useSchemaStore } from "@/hooks/use-schema";

function generateId() {
  return Date.now().toString();
}

export function useSchemaNodes() {
  const { 
    schema, 
    setSelectedNode, 
    updateNodes, 
    updateNodeData: updateNodeDataInStore,
    addEnumType
  } = useSchemaStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNode } = useReactFlow();

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
  
        const newNode = {
          id: generateId(),
          type: 'databaseSchema',
          position,
          data: {
            label,
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

  return {
    selectedNode: schema.selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  };
}