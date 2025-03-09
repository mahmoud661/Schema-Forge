import React from "react";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";

interface SidebarContainerProps {
  activeTab: string;
  nodes: any[];
  edges: any[];
  selectedNode: any;
  onNodeClick: (event: any, node: any) => void;
  updateNodeData: (node: any, data: any) => void;
  deleteNode: (node: any) => void;
  duplicateRows: any;
}

export function SidebarContainer({
  activeTab,
  nodes,
  edges,
  selectedNode,
  onNodeClick,
  updateNodeData,
  deleteNode,
  duplicateRows
}: SidebarContainerProps) {
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
          duplicateRows={selectedNode?.data?.label ? duplicateRows[selectedNode.data.label] : undefined}
          nodes={nodes}
          onNodeSelect={(node) => onNodeClick({} as React.MouseEvent, node)}
        />
      );
      
    case "sql":
      return <SqlEditor />;
      
    case "ai":
      return (
        <AiAssistant 
          nodes={nodes} 
          edges={edges} 
          onApplySuggestion={(suggestedNodes, suggestedEdges) => {
            console.log("Apply suggestion", suggestedNodes, suggestedEdges);
          }}
        />
      );
      
    default:
      return null;
  }
}
