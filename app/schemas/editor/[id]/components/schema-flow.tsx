import React from "react";
import { ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/lib/schema-flow-styles.css";
import { Toaster } from "sonner";

import SchemaNode from "@/components/schema-node";
import EnumNode from "@/components/enum-node";
import { Sidebar } from "@/components/schema-sidebar";
import { EdgeSidebar } from "./edge-sidebar";
import { FlowControls } from "./flow-controls";
import { EditorHeader } from "./editor-header";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";
import { useSchemaFlow } from "../hooks/use-schema-flow";
import { useSchemaNodes } from "../hooks/use-schema-nodes";

const nodeTypes = {
  databaseSchema: SchemaNode,
  enumType: EnumNode,
};

export function SchemaFlow() {
  const {
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
    duplicateColumns,
  } = useSchemaFlow();

  const {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  } = useSchemaNodes();

  const handleUpdateSchema = (newNodes, newEdges) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  // Render the appropriate sidebar content based on the active tab
  const renderSidebar = () => {
    switch (activeTab) {
      case "visual":
        return (
          <Sidebar 
            selectedNode={selectedNode}
            onUpdateNode={(nodeData) => {
              if (selectedNode) {
                updateNodeData(selectedNode, nodeData, setNodes);
              }
            }}
            duplicateColumns={duplicateColumns[selectedNode?.data?.label]}
            nodes={nodes}
            onNodeSelect={(node) => onNodeClick({} as React.MouseEvent, node)}
          />
        );
      case "sql":
        return (
          <SqlEditor 
            nodes={nodes} 
            edges={edges} 
            onUpdateSchema={handleUpdateSchema}
          />
        );
      case "ai":
        return (
          <AiAssistant 
            nodes={nodes} 
            edges={edges} 
            onApplySuggestion={handleUpdateSchema} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <Toaster position="top-right" />
      
      <EditorHeader 
        onSave={onSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <div ref={reactFlowWrapper} className="flex-1 flex">
        {renderSidebar()}
        
        <div className="flex-1 relative" style={{ height: '100%', width: '100%' }}>
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
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
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