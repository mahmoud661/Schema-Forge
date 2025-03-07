import React, { useCallback } from "react";
import { ReactFlow, ReactFlowProvider, useReactFlow, ViewportHelperFunctions } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/lib/schema-flow-styles.css";
import { Toaster } from "sonner";

import SchemaNode from "@/components/schema-node";
import EnumNode from "@/components/enum-node";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { EdgeSidebar } from "./edge-sidebar";
import { FlowControls } from "./flow-controls";
import { EditorHeader } from "./editor-header";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";
import { useSchemaFlow } from "../hooks/use-schema-flow";
import { useSchemaNodes } from "../hooks/use-schema-nodes";
import { useSchemaStore } from "@/hooks/use-schema";

const nodeTypes = {
  databaseSchema: SchemaNode,
  enumType: EnumNode,
};

export function SchemaFlow() {
  // Use the centralized schema store
  const { schema, updateActiveTab } = useSchemaStore();
  const { nodes, edges, activeTab } = schema;
  
  const {
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
    duplicateColumns,
  } = useSchemaFlow();

  const {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData,
    deleteNode
  } = useSchemaNodes();

  // Performance enhancement: Optimize panning and viewport for large diagrams
  const onInit = useCallback((reactFlowInstance: ViewportHelperFunctions) => {
    reactFlowInstance.fitView({
      padding: 0.2,
      maxZoom: 1.5,
      minZoom: 0.5,
    });
  }, []);

  // Render the appropriate sidebar content based on the active tab
  const renderSidebar = () => {
    switch (activeTab) {
      case "visual":
        return (
          <Sidebar 
            selectedNode={selectedNode}
            onUpdateNode={(nodeData) => {
              if (selectedNode) {
                updateNodeData(selectedNode, nodeData);
              }
            }}
            onDeleteNode={(node) => {
              deleteNode(node);
            }}
            duplicateColumns={duplicateColumns[selectedNode?.data?.label]}
            nodes={selectedNode ? nodes : []} // Performance: Only pass all nodes when needed
            onNodeSelect={(node) => onNodeClick({} as React.MouseEvent, node)}
          />
        );
      case "sql":
        return <SqlEditor />;
      case "ai":
        return <AiAssistant />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Toaster position="top-right" />
      
      <EditorHeader 
        onSave={onSave}
        activeTab={activeTab}
        setActiveTab={updateActiveTab}
      />
      
      <div ref={reactFlowWrapper} className="flex-1 flex overflow-hidden">
        {renderSidebar()}
        
        <div className="flex-1 h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodesDelete={onNodeDelete}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            onInit={onInit}
            fitView
            onDragOver={onDragOver}
            onDrop={onDrop}
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
            // Performance settings
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
        </div>
        
        {activeTab === "visual" && selectedEdge && (
          <EdgeSidebar 
            selectedEdge={selectedEdge}
            onUpdateEdge={updateEdgeData}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>
    </div>
  );
}