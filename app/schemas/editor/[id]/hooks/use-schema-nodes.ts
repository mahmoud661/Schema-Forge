import { useCallback, useRef, useState, useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { SchemaNode, SchemaNodeData } from "../types";

export function useSchemaNodes() {
  const [selectedNode, setSelectedNode] = useState<SchemaNode | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNode } = useReactFlow();

  const onNodeClick = useCallback((_, node: SchemaNode) => {
    setSelectedNode(node);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent, setNodes: React.Dispatch<React.SetStateAction<SchemaNode[]>>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'databaseSchema',
        position,
        data: {
          label: 'New Table',
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

      setNodes((nds) => nds.concat(newNode as SchemaNode));
    },
    [screenToFlowPosition]
  );

  const updateNodeData = useCallback((node: SchemaNode, nodeData: Partial<SchemaNodeData>, setNodes: React.Dispatch<React.SetStateAction<SchemaNode[]>>) => {
    // Create an updated node with the new data
    const updatedNodeData = { 
      ...node.data, 
      ...nodeData 
    };
    
    // Update the nodes state
    setNodes(nodes => nodes.map(n => 
      n.id === node.id 
        ? { ...n, data: updatedNodeData }
        : n
    ));
    
    // Update the selected node reference immediately with the new data
    setSelectedNode(prev => {
      if (prev && prev.id === node.id) {
        return { ...prev, data: updatedNodeData };
      }
      return prev;
    });
    
    // Also ensure the ReactFlow internal state is in sync
    if (node.id) {
      // We use setTimeout to ensure this runs after React has processed our state updates
      setTimeout(() => {
        const updatedNode = getNode(node.id);
        if (updatedNode) {
          setSelectedNode(updatedNode as SchemaNode);
        }
      }, 0);
    }
  }, [getNode]);

  return {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  };
}