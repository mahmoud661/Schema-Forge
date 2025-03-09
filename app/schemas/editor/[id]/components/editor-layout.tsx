import React from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { EditorHeader } from "./editor-header";
import { EdgeSidebar } from "./edge-sidebar";
import { SidebarContainer } from "./sidebar-container";
import { FlowConfig } from "./flow-config";

interface EditorLayoutProps {
  children: React.ReactNode;
  flowHooks: any;
  nodeHooks: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshKey: number;
}

export function EditorLayout({
  children,
  flowHooks,
  nodeHooks,
  activeTab,
  setActiveTab,
  refreshKey
}: EditorLayoutProps) {
  const { schema } = useSchemaStore();
  const { nodes, edges } = schema;
  
  const { 
    onSave, 
    selectedEdge, 
    setSelectedEdge,
    updateEdgeData 
  } = flowHooks;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {children}
      
      <EditorHeader 
        onSave={onSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      
      <div ref={nodeHooks.reactFlowWrapper} className="flex-1 flex overflow-hidden">
        <SidebarContainer 
          activeTab={activeTab}
          nodes={nodes}
          edges={edges}
          selectedNode={nodeHooks.selectedNode}
          onNodeClick={nodeHooks.onNodeClick}
          updateNodeData={nodeHooks.updateNodeData}
          deleteNode={nodeHooks.deleteNode}
          duplicateRows={flowHooks.duplicateRows}
        />
        
        <div className="flex-1 h-full">
          <FlowConfig
            nodes={nodes}
            edges={edges}
            flowHooks={flowHooks}
            nodeHooks={nodeHooks}
            refreshKey={refreshKey}
          />
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
