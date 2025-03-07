import { Node } from "@xyflow/react";

export interface ColumnSchema {
  title: string;
  type: string;
  constraints?: string[];
  id: string;
  default?: string | null;
  foreignKey?: {
    table: string;
    row: string;
    onDelete?: string;
    onUpdate?: string;
  };
}

export interface SchemaNodeData {
  label: string;
  id: string;
  schema: ColumnSchema[];
  color?: {
    light: string;
    dark: string;
    border: string;
  };
}

export interface EnumNodeData {
  name: string;
  values: string[];
}

export type SchemaNode = Node<SchemaNodeData>;
export type EnumTypeNode = Node<EnumNodeData>;