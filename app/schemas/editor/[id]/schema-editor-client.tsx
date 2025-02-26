"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ReactFlow,
  ReactFlowProvider,
  Background, 
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  Panel
} from "@xyflow/react";
// Add ReactFlow CSS import
import "@xyflow/react/dist/style.css";
import { useSchemaStore } from "@/lib/store";
import SchemaNode from "@/components/schema-node";
import { Sidebar } from "@/components/schema-sidebar";
import { Button } from "@/components/ui/button";
import { Save, Undo, Redo } from "lucide-react";
import { templates } from "@/lib/schema-templates";

const nodeTypes = {
  databaseSchema: SchemaNode,
};

type SchemaNode = Node<{
  name: string;
  fields: { name: string; type: string }[];
}>;

function SchemaEditorFlow() {
  const params = useParams();
  const router = useRouter();
  const { schemas, updateSchema } = useSchemaStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNode[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { project, undo, redo, canUndo, canRedo } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_, node: SchemaNode) => {
    setSelectedNode(node.id);
  }, []);

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
      // Add your error handling here (e.g., toast notification)
    }
  }, [params.id, nodes, edges, updateSchema, router]);

  const onNodeDelete = useCallback((nodesToDelete: Node[]) => {
    setNodes(nodes => nodes.filter(node => 
      !nodesToDelete.some(n => n.id === node.id)
    ));
  }, [setNodes]);

  // Add onDragOver handler
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Add onDrop handler
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Get the position where the element is dropped
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create a new node
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
      console.log('Node added:', newNode);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex">
      <Sidebar 
        selectedNode={selectedNode}
        onUpdateNode={(nodeData) => {
          setNodes(nodes.map(node => 
            node.id === selectedNode 
              ? { ...node, data: { ...node.data, ...nodeData } }
              : node
          ));
        }}
      />
      <div ref={reactFlowWrapper} className="flex-1 relative" style={{ height: '100%', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodesDelete={onNodeDelete}
          nodeTypes={nodeTypes}
          fitView
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="bg-muted/30"
          style={{ width: '100%', height: '100%' }}
        >
          <Background />
          <Controls />
          <Panel position="top-right" className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={onSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function SchemaEditorClient() {
  return (
    <ReactFlowProvider>
      <SchemaEditorFlow />
    </ReactFlowProvider>
  );
}