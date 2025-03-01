import React from "react";
import { ReactFlow, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/lib/schema-flow-styles.css";
import { Toaster } from "sonner";

import SchemaNode from "@/components/schema-node";
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
    selectedEdge,
    setSelectedEdge,
    updateEdgeData,
    activeTab,
    setActiveTab,
  } = useSchemaFlow();

  const {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData
  } = useSchemaNodes();

  const handleUpdateSchema = (newNodes: Node[], newEdges: Edge[]): void => {
    // Use any to bypass type checking since we're crossing incompatible type systems
    setNodes([newNodes as any]);
    setEdges(newEdges as any);
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
                updateNodeData(selectedNode, nodeData, setNodes as any);
              }
            }}
            nodes={nodes as any}
          />
        );
      case "sql":
        return (
          <SqlEditor 
            nodes={nodes as any} 
            edges={edges} 
            onUpdateSchema={handleUpdateSchema}
          />
        );
      case "ai":
        return (
          <AiAssistant 
            nodes={nodes as any} 
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
        {/* Sidebar content changes based on active tab */}
        {renderSidebar()}
        
        {/* Flow diagram is always visible */}
        <div className="flex-1 relative" style={{ height: '100%', width: '100%' }}>
          <ReactFlow
            nodes={nodes as any}
            edges={edges}
            onNodesChange={onNodesChange as any}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodesDelete={onNodeDelete}
            onEdgeClick={onEdgeClick}
            // Removed onEdgeUpdate prop as it's not supported
            nodeTypes={nodeTypes}
            fitView
            onDragOver={onDragOver}
            onDrop={(event) => onDrop(event, setNodes as any, nodes as any)}
            className="bg-muted/30"
            style={{ width: '100%', height: '100%' }}
            connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
            snapToGrid={true}
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
          >
            <FlowControls />
          </ReactFlow>
        </div>
        
        {/* Edge sidebar only shows when an edge is selected and in visual mode */}
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