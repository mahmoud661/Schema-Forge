import { useCallback, useEffect } from "react";
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

  return {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSave,
    onNodeDelete,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
