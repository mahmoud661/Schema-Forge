import { Node, Edge } from "@xyflow/react";

export type ColumnSchema = {
  title: string;
  type: string;
  constraints?: string[];
};

export type SchemaNodeData = {
  label: string;
  schema: ColumnSchema[];
};

export type SchemaNode = Node<SchemaNodeData>;

export type SchemaEdge = Edge;