import { SchemaNode } from "@/app/schemas/editor/[id]/types";
import {
  Edge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { create } from "zustand";
// middlewares
import { persist, PersistOptions } from "zustand/middleware";
import { devtools } from "zustand/middleware";

interface EnumType {
  name: string;
  values: string[];
}

interface SchemaState {
  schema: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    sqlCode: string;
    nodes: SchemaNode[];
    edges: Edge[];
    selectedNode: SchemaNode | null;
    selectedEdge: Edge | null;
    activeTab: string;
    duplicateColumns: Record<string, any>;
    enumTypes: EnumType[];
    settings: {
      caseSensitiveIdentifiers: boolean;
      useInlineConstraints: boolean;
    };
  };

  // Actions
  updateSchema: (schema: Partial<SchemaState["schema"]>) => void;
  updateCode: (sqlCode: string) => void;
  updateNodes: (nodes: SchemaNode[]) => void;
  updateEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: SchemaNode | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  updateSelectedEdge: (data: Partial<Edge>) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  updateActiveTab: (activeTab: string) => void;
  setDuplicateColumns: (duplicateColumns: Record<string, any>) => void;
  updateSettings: (settings: Partial<SchemaState["schema"]["settings"]>) => void;
  addEnumType: (enumType: EnumType) => void;
  updateEnumType: (index: number, enumType: EnumType) => void;
  removeEnumType: (index: number) => void;
  resetSchema: () => void;

  // Added actions to support React Flow
  onNodesChange: (changes: OnNodesChange) => void;
  onEdgesChange: (changes: OnEdgesChange) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: SchemaNode) => void;
  updateEdge: (oldEdge: Edge, newConnection: Connection) => void;
}

const initialSchema = {
  id: "",
  title: "Untitled Schema",
  description: "",
  tags: [],
  sqlCode: "",
  nodes: [], // Ensure this is initialized as an empty array
  edges: [], // Ensure this is initialized as an empty array
  selectedNode: null,
  selectedEdge: null,
  activeTab: "visual",
  duplicateColumns: {},
  enumTypes: [],
  settings: {
    caseSensitiveIdentifiers: false,
    useInlineConstraints: true
  }
};

// Add this new debug middleware right after the logger middleware
const debugMiddleware = (config: any) => (set: any, get: any, api: any) => {

    const unsub = api.subscribe((state: any) => {
    console.log("Schema store updated:", {
      nodes: state.schema.nodes?.length || 0,
      edges: state.schema.edges?.length || 0,
    });
  });

  // Return the original config
  return config((...args: any) => set(...args), get, api);
};

// Store implementation separated for middleware flexibility
const storeImplementation = (set: any) => ({
  schema: { ...initialSchema },

  updateSchema: (schemaData: Partial<SchemaState["schema"]>) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, ...schemaData },
      }),
      false,
      "updateSchema"
    ),

  updateCode: (sqlCode: string) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, sqlCode },
      }),
      false,
      "updateCode"
    ),

  updateNodes: (nodes: SchemaNode[]) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, nodes },
      }),
      false,
      "updateNodes"
    ),

  updateEdges: (edges: Edge[]) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, edges },
      }),
      false,
      "updateEdges"
    ),

  setSelectedNode: (selectedNode: SchemaNode | null) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, selectedNode },
      }),
      false,
      "setSelectedNode"
    ),

  setSelectedEdge: (selectedEdge: Edge | null) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, selectedEdge },
      }),
      false,
      "setSelectedEdge"
    ),

  updateSelectedEdge: (data: Partial<Edge>) =>
    set(
      (state: any) => {
        if (!state.schema.selectedEdge) return state;
        return {
          schema: {
            ...state.schema,
            selectedEdge: { ...state.schema.selectedEdge, ...data },
            edges: state.schema.edges.map((edge: Edge) =>
              edge.id === state.schema.selectedEdge?.id
                ? { ...edge, ...data }
                : edge
            ),
          },
        };
      },
      false,
      "updateSelectedEdge"
    ),

  updateNodeData: (nodeId: string, data: any) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          nodes: state.schema.nodes.map((node: SchemaNode) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          selectedNode:
            state.schema.selectedNode?.id === nodeId
              ? {
                  ...state.schema.selectedNode,
                  data: { ...state.schema.selectedNode.data, ...data },
                }
              : state.schema.selectedNode,
        },
      }),
      false,
      "updateNodeData"
    ),

  updateActiveTab: (activeTab: string) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, activeTab },
      }),
      false,
      "updateActiveTab"
    ),

  setDuplicateColumns: (duplicateColumns: Record<string, any>) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, duplicateColumns },
      }),
      false,
      "setDuplicateColumns"
    ),

  updateSettings: (settings: Partial<SchemaState["schema"]["settings"]>) =>
    set(
      (state: any) => ({
        schema: { 
          ...state.schema, 
          settings: { ...state.schema.settings, ...settings }
        },
      }),
      false,
      "updateSettings"
    ),

  addEnumType: (enumType: EnumType) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          enumTypes: [...(state.schema.enumTypes || []), enumType]
        },
      }),
      false,
      "addEnumType"
    ),

  updateEnumType: (index: number, enumType: EnumType) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          enumTypes: (state.schema.enumTypes || []).map((et: EnumType, i: number) =>
            i === index ? enumType : et
          )
        },
      }),
      false,
      "updateEnumType"
    ),

  removeEnumType: (index: number) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          enumTypes: (state.schema.enumTypes || []).filter((_: EnumType, i: number) => i !== index)
        },
      }),
      false,
      "removeEnumType"
    ),

  resetSchema: () =>
    set(
      { 
        schema: { 
          ...initialSchema,
          enumTypes: [] // Explicitly reset enum types
        } 
      }, 
      false, 
      "resetSchema"
    ),

  onNodesChange: (changes: OnNodesChange) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          nodes: applyNodeChanges(changes, state.schema.nodes),
        },
      }),
      false,
      "onNodesChange"
    ),

  onEdgesChange: (changes: OnEdgesChange) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          edges: applyEdgeChanges(changes, state.schema.edges),
        },
      }),
      false,
      "onEdgesChange"
    ),

  onConnect: (connection: Connection) =>
    set(
      (state: any) => {
        const newEdge = {
          ...connection,
          id: `e${connection.source}-${connection.target}`,
          type: "smoothstep",
          animated: true,
        };
        return {
          schema: {
            ...state.schema,
            edges: [...state.schema.edges, newEdge],
          },
        };
      },
      false,
      "onConnect"
    ),

  addNode: (node: SchemaNode) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          nodes: [...state.schema.nodes, node],
        },
      }),
      false,
      "addNode"
    ),

  updateEdge: (oldEdge: Edge, newConnection: Connection) =>
    set(
      (state: any) => ({
        schema: {
          ...state.schema,
          edges: state.schema.edges.map((edge: Edge) =>
            edge.id === oldEdge.id ? { ...oldEdge, ...newConnection } : edge
          ),
        },
      }),
      false,
      "updateEdge"
    ),
});

// Persistence configuration
const persistConfig: PersistOptions<SchemaState> = {
  name: "schema-storage",
};

// Create store with configurable middleware pipeline
export const useSchemaStore = create<SchemaState>()(
persist(storeImplementation, persistConfig)
);
