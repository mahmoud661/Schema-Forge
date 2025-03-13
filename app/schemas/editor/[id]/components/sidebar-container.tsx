import React from "react";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";
import { useSchemaStore } from "@/hooks/use-schema";
import { AIErrorBoundary } from "@/components/ai/error-boundary";

interface SidebarContainerProps {
  activeTab: string;
}

export function SidebarContainer({ activeTab }: SidebarContainerProps) {
  // Get updateSchema function from the store
  const { updateSchema } = useSchemaStore();
  
  const handleApplySuggestion = (suggestedNodes: any[], suggestedEdges: any[]) => {
    updateSchema({
      nodes: suggestedNodes,
      edges: suggestedEdges
    });
  };
  
  return (
    <>
      <div style={{ display: activeTab === "visual" ? "block" : "none" }}>
        <Sidebar />
      </div>
      
      <div style={{ display: activeTab === "sql" ? "block" : "none" }}>
        <SqlEditor />
      </div>
      
      <div style={{ display: activeTab === "ai" ? "block" : "none" }}>
        <AIErrorBoundary>
          <AiAssistant onApplySuggestion={handleApplySuggestion} />
        </AIErrorBoundary>
      </div>
    </>
  );
}