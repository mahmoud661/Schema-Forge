import React from "react";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";

interface SidebarContainerProps {
  activeTab: string;
}

export function SidebarContainer({ activeTab }: SidebarContainerProps) {

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
