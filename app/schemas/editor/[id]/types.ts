import { Node } from "@xyflow/react";

export interface ColumnSchema {
  title: string;
  type: string;
  constraints?: string[];
  id: string;
  default?: string | null;
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface SchemaNodeData {
  label: string;
  schema: ColumnSchema[];
}

export interface EnumNodeData {
  name: string;
  values: string[];
}

export type SchemaNode = Node<SchemaNodeData>;
export type EnumTypeNode = Node<EnumNodeData>;