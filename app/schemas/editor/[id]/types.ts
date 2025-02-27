import { Node } from "@xyflow/react";

export interface ColumnSchema {
  title: string;
  type: string;
  constraints?: string[];
  id?: string; // Add optional ID for stable rendering
}

export interface SchemaNodeData {
  label: string;
  schema: ColumnSchema[];
}

export interface SchemaNode extends Node {
  type: 'databaseSchema';
  data: SchemaNodeData;
}