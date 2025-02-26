import React from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/lib/schema-flow-styles.css";

import SchemaNode from "@/components/schema-node";
import { Sidebar } from "@/components/schema-sidebar";
import { FlowPanel } from "./flow-panel";
import { FlowControls } from "./flow-controls";
import { useSchemaFlow } from "../hooks/use-schema-flow";
import { useSchemaNodes } from "../hooks/use-schema-nodes";

const nodeTypes = {
  databaseSchema: SchemaNode,
};

export function SchemaFlow() {
  const {
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
    canRedo
  } = useSchemaFlow();

  const {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  } = useSchemaNodes();

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex">
      <Sidebar 
        selectedNode={selectedNode}
        onUpdateNode={(nodeData) => {
          if (selectedNode) {
            updateNodeData(selectedNode, nodeData, setNodes);
          }
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
          onDrop={(event) => onDrop(event, setNodes)}
          className="bg-muted/30"
          style={{ width: '100%', height: '100%' }}
          connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
          connectionLineType="smoothstep"
          snapToGrid={true}
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
        >
          <FlowControls />
          <FlowPanel 
            onSave={onSave}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
