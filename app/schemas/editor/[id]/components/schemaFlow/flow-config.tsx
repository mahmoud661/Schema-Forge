import React, { useCallback, useMemo } from "react";
import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import SchemaNode from "@/components/schema-node";
import EnumNode from "@/components/enum-node";
import { FlowControls } from "./flow-controls";
import { useSchemaStore } from "@/hooks/use-schema";
import { CustomEdge } from "@/components/ui/custom-edge";

const nodeTypes = {
  databaseSchema: SchemaNode,
  enumType: EnumNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface FlowConfigProps {
  flowHooks: any;
  nodeHooks: any;
  refreshKey: number;
}

export function FlowConfig({ 
  flowHooks, 
  nodeHooks,
  refreshKey
}: FlowConfigProps) {
  // Access nodes and edges directly from the store
  const { schema } = useSchemaStore();
  const { nodes: storeNodes, edges: storeEdges } = schema;

  // Deduplicate nodes and edges to prevent React key errors
  const nodes = useMemo(() => {
    // Use a Map to ensure unique IDs
    const nodeMap = new Map();
    storeNodes.forEach(node => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      }
    });
    return Array.from(nodeMap.values());
  }, [storeNodes]);
  
  const edges = useMemo(() => {
    // Use a Map to ensure unique edge IDs
    const edgeMap = new Map();
    storeEdges.forEach(edge => {
      if (!edgeMap.has(edge.id)) {
        // Set the custom edge type for all edges
        edgeMap.set(edge.id, {
          ...edge,
          type: 'custom' // Use our custom edge type
        });
      }
    });
    return Array.from(edgeMap.values());
  }, [storeEdges]);

  // Performance enhancement: Optimize panning and viewport for large diagrams
  const onInit = useCallback((reactFlowInstance: any) => {
    reactFlowInstance.fitView({
      padding: 0.2,
      maxZoom: 1.5,
      minZoom: 0.5,
    });
  }, []);

  // Create an efficient memoization key that doesn't change for color-only updates
  const memoKey = useMemo(() => {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      selectedNodeId: nodeHooks.selectedNode?.id || 'none',
      lastStructuralUpdate: nodes.map(node => node._colorUpdated ? '' : node.id).join('|'),
      refreshKey
    };
  }, [nodes, edges, nodeHooks.selectedNode, refreshKey]);
  
  // Performance enhancement: Use a memoization for the ReactFlow content
  const MemoizedReactFlow = useMemo(() => {
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={flowHooks.onNodesChange}
        onEdgesChange={flowHooks.onEdgesChange}
        onConnect={flowHooks.onConnect}
        onNodeClick={nodeHooks.onNodeClick}
        onNodesDelete={flowHooks.onNodeDelete}
        onEdgeClick={flowHooks.onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        onDragOver={nodeHooks.onDragOver}
        onDrop={nodeHooks.onDrop}
        className="bg-muted/30"
        style={{ width: '100%', height: '100%' }}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'custom',
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        minZoom={0.1}
        maxZoom={2.5}
        nodeExtent={[
          [-2000, -2000],
          [4000, 4000]
        ]}
      >
        <FlowControls />
      </ReactFlow>
    );
  }, [memoKey]);
  
  return (
    <ReactFlowProvider>
      {MemoizedReactFlow}
    </ReactFlowProvider>
  );
}