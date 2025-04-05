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
  id: string;
  schema: ColumnSchema[];
  color?: {
    light: string;
    dark: string;
    border: string;
  };
  [key: string]: any; 
}

export interface EnumNodeData {
  name: string;
  values: string[];
  [key: string]: any; 
}

export type SchemaNode = Node<SchemaNodeData>;
export type EnumTypeNode = Node<EnumNodeData>;