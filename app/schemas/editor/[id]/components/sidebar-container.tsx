import React from "react";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";
import { useSchemaStore } from "@/hooks/use-schema";

interface SidebarContainerProps {
  activeTab: string;
}

export function SidebarContainer({ activeTab }: SidebarContainerProps) {
  // Access schema store directly instead of through props
  const { schema } = useSchemaStore();
  
  switch (activeTab) {
    case "visual":
      return <Sidebar />;
      
    case "sql":
      return <SqlEditor />;
      
    case "ai":
      return (
        <AiAssistant 
          onApplySuggestion={(suggestedNodes, suggestedEdges) => {
            console.log("Apply suggestion", suggestedNodes, suggestedEdges);
          }}
        />
      );
      
    default:
      return null;
  }
}
