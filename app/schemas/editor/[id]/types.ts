import { Node, Edge } from "@xyflow/react";

export type SchemaNodeData = {
  label: string;
  schema: { title: string; type: string }[];
};

export type SchemaNode = Node<SchemaNodeData>;

export type SchemaEdge = Edge;
