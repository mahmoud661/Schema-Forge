import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, Edge, useNodesState, useEdgesState, addEdge, Node, useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/lib/store";
import { templates } from "@/lib/schema-templates";
import { SchemaNode } from "../types";

export function useSchemaFlow() {
  const params = useParams();
  const router = useRouter();
  const { schemas, updateSchema } = useSchemaStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [activeTab, setActiveTab] = useState<string>("visual");
  const { project, undo, redo, canUndo, canRedo } = useReactFlow();

  useEffect(() => {
    const schemaId = params.id as string;
    if (schemaId === "new") {
      // Initialize with empty canvas
      setNodes([]);
      setEdges([]);
      return;
    }

    const schema = schemas.find(s => s.id === schemaId);
    if (schema?.template) {
      const template = templates[schema.template as keyof typeof templates];
      if (template) {
        setNodes(template.nodes);
        setEdges(template.edges);
      }
    }
  }, [params.id, schemas, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: true,
      }, eds));
    },
    [setEdges]
  );

  const onSave = useCallback(async () => {
    try {
      const schemaId = params.id as string;
      if (schemaId === "new") {
        // Handle new schema creation
        return;
      }

      await updateSchema(schemaId, {
        nodes: nodes,
        edges: edges,
        updatedAt: new Date().toISOString(),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to save schema:', error);
    }
  }, [params.id, nodes, edges, updateSchema, router]);

  const onNodeDelete = useCallback((nodesToDelete: Node[]) => {
    setNodes(nodes => nodes.filter(node => 
      !nodesToDelete.some(n => n.id === node.id)
    ));
  }, [setNodes]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  // This function is kept for compatibility but won't be passed to ReactFlow
  const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges(edges => edges.map(e => e.id === oldEdge.id ? { ...oldEdge, ...newConnection } : e));
  }, [setEdges]);

  const updateEdgeData = useCallback((edgeId: string, data: any) => {
    setEdges(edges => edges.map(edge => 
      edge.id === edgeId ? { ...edge, ...data } : edge
    ));
    
    // Update the selected edge reference
    setSelectedEdge(prev => {
      if (prev && prev.id === edgeId) {
        return { ...prev, ...data };
      }
      return prev;
    });
  }, [setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSave,
    onNodeDelete,
    onEdgeClick,
    onEdgeUpdate,
    selectedEdge,
    setSelectedEdge,
    updateEdgeData,
    activeTab,
    setActiveTab,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}