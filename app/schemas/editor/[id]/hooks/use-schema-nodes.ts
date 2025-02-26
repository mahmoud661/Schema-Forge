import { useCallback, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { SchemaNode, SchemaNodeData } from "../types";

export function useSchemaNodes() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onNodeClick = useCallback((_, node: SchemaNode) => {
    setSelectedNode(node.id);
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
            { title: "id", type: "uuid" },
            { title: "name", type: "varchar" },
          ],
        },
      };

      setNodes((nds) => nds.concat(newNode as any));
    },
    [screenToFlowPosition]
  );

  const updateNodeData = useCallback((nodeId: string, nodeData: Partial<SchemaNodeData>, setNodes: React.Dispatch<React.SetStateAction<SchemaNode[]>>) => {
    setNodes(nodes => nodes.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...nodeData } }
        : node
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
