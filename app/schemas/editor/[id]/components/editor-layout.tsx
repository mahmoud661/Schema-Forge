import React, { useRef } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { EditorHeader } from "./editor-header";
import { EdgeSidebar } from "./edge-sidebar";
import { SidebarContainer } from "./sidebar-container";
import { FlowConfig } from "./schemaFlow/flow-config";

interface EditorLayoutProps {
  children: React.ReactNode;
  flowHooks: any;
  nodeHooks: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshKey: number;
  hasUnsavedChanges: boolean;
}

export function EditorLayout({
  children,
  flowHooks,
  nodeHooks,
  activeTab,
  setActiveTab,
  refreshKey,
  hasUnsavedChanges
}: EditorLayoutProps) {
  const { schema } = useSchemaStore();
  const { selectedEdge } = schema;
  
  const { 
    onSave, 
    setSelectedEdge,
    updateEdgeData,
    allowExit
  } = flowHooks;

  const reactFlowInstanceRef = useRef(null);

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {children}
      
      <EditorHeader 
        onSave={onSave}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasUnsavedChanges={hasUnsavedChanges}
        allowExit={allowExit}
        reactFlowInstanceRef={reactFlowInstanceRef}
      />
      
      <div ref={nodeHooks.reactFlowWrapper} className="flex-1 flex overflow-hidden">
        <SidebarContainer activeTab={activeTab} />
        
        <div className="flex-1 h-full">
          <FlowConfig
            flowHooks={flowHooks}
            nodeHooks={nodeHooks}
            refreshKey={refreshKey}
            reactFlowInstanceRef={reactFlowInstanceRef}
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
