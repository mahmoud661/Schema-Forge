"use client";

import { ReactFlow, Background, ReactFlowProvider } from "@xyflow/react";
import SchemaNode from "@/components/schema-node";
import { useSearchParams } from "next/navigation";
import { templates } from "@/lib/schema-templates";

const nodeTypes = {
  databaseSchema: SchemaNode,
};

function SchemaFlow() {
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "inventory";
  const { nodes, edges } = templates[template as keyof typeof templates];

  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={nodeTypes}
      fitView
      className="dark"
    >
      <Background className="bg-muted" />
    </ReactFlow>
  );
}

export default function Schemas() {
  return (
    <main className="w-full h-[calc(100vh-4rem)] bg-background">
      <ReactFlowProvider>
        <SchemaFlow />
      </ReactFlowProvider>
    </main>
  );
}