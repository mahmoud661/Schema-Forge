"use client";

import { useState, useEffect } from "react";
import { ReactFlow, Background, ReactFlowProvider } from "@xyflow/react";
import SchemaNode from "@/components/schema-node";
import { useSearchParams } from "next/navigation";
import { templates } from "@/lib/schema-templates";
import { Navigation } from "@/components/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";

const nodeTypes = {
  databaseSchema: SchemaNode,
};

function SchemaFlow() {
  const searchParams = useSearchParams();
  const template = searchParams.get("template") || "inventory";
  const { nodes, edges } = templates[template as keyof typeof templates];
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate a short loading period for React Flow to initialize properly
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background className="bg-muted" />
    </ReactFlow>
  );
}

export default function Schemas() {
  return (
    <>
      <Navigation />
      <main className="w-full h-[calc(100vh-4rem)] bg-background">
        <ReactFlowProvider>
          <SchemaFlow />
        </ReactFlowProvider>
      </main>
    </>
  );
}