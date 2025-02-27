"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { SchemaFlow } from "./components/schema-flow";
import { useState } from "react";

export default function SchemaEditorClient() {
  return (
    <ReactFlowProvider>
      <SchemaFlow />
    </ReactFlowProvider>
  );
}