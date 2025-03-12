"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { SchemaFlow } from "./components/schemaFlow/schema-flow";

export default function SchemaEditorClient() {
  return (
    <ReactFlowProvider>
      <SchemaFlow />
    </ReactFlowProvider>
  );
}