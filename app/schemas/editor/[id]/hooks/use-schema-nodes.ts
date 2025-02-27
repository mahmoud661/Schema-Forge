import { useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { SchemaNode, SchemaNodeData } from "../types";

export function useSchemaNodes() {
  const [selectedNode, setSelectedNode] = useState<SchemaNode | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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
    setNodes(nodes => nodes.map(n => 
      n.id === node.id 
        ? { ...n, data: { ...n.data, ...nodeData } }
        : n
    ));
  }, []);

  return {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  };
}