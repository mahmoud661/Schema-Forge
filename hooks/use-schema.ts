import { SchemaNode } from "@/app/schemas/editor/[id]/types/types";
import {
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import { create, StateCreator } from "zustand"; 
// middlewares
import { persist, PersistOptions } from "zustand/middleware";

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
    duplicateRows: Record<string, any>;
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
  setDuplicateRows: (duplicateRows: Record<string, any>) => void;
  updateSettings: (settings: Partial<SchemaState["schema"]["settings"]>) => void;
  addEnumType: (enumType: EnumType) => void;
  updateEnumType: (index: number, enumType: EnumType) => void;
  removeEnumType: (index: number) => void;
  resetSchema: () => void;
  onNodesChange: (changes: NodeChange<SchemaNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<Edge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: SchemaNode) => void;
  updateEdge: (oldEdge: Edge, newConnection: Connection) => void;
  deleteNode: (node: SchemaNode | any) => void;
}

const initialSchema = {
  id: "",
  title: "Untitled Schema",
  description: "",
  tags: [],
  sqlCode: "",
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  activeTab: "visual",
  duplicateRows: {},
  enumTypes: [],
  settings: {
    caseSensitiveIdentifiers: true,
    useInlineConstraints: false
  }
};

// Example debug middleware remains unchanged
const debugMiddleware = (config: any) => (set: any, get: any, api: any) => {
  const unsub = api.subscribe((state: any) => {
    console.log("Schema store updated:", {
      nodes: state.schema.nodes?.length || 0,
      edges: state.schema.edges?.length || 0,
    });
  });
  return config((...args: any) => set(...args), get, api);
};

// Type the store creator using StateCreator<SchemaState>
const storeImplementation: StateCreator<SchemaState> = (set, get, api) => ({
  schema: { ...initialSchema },
  updateSchema: (schemaData: Partial<SchemaState["schema"]>) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, ...schemaData },
    })),
  updateCode: (sqlCode: string) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, sqlCode },
    })),
  updateNodes: (nodes: SchemaNode[]) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, nodes },
    })),
  updateEdges: (edges: Edge[]) =>
    set((state: SchemaState) => {
      const uniqueEdges = [];
      const edgeIds = new Set<string>();
      for (const edge of edges) {
        if (!edgeIds.has(edge.id)) {
          edgeIds.add(edge.id);
          uniqueEdges.push(edge);
        } else {
          console.warn(`Duplicate edge ID detected: ${edge.id}`);
        }
      }
      return { schema: { ...state.schema, edges: uniqueEdges } };
    }),
  setSelectedNode: (selectedNode: SchemaNode | null) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, selectedNode } })),
  setSelectedEdge: (selectedEdge: Edge | null) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, selectedEdge } })),
  updateSelectedEdge: (data: Partial<Edge>) =>
    set((state: SchemaState) => {
      if (!state.schema.selectedEdge) return state;
      return {
        schema: {
          ...state.schema,
          selectedEdge: { ...state.schema.selectedEdge, ...data },
          edges: state.schema.edges.map((edge: Edge) =>
            edge.id === state.schema.selectedEdge!.id ? { ...edge, ...data } : edge
          ),
        },
      };
    }),
  updateNodeData: (nodeId: string, data: any) =>
    set((state: SchemaState) => {
      if (data.color !== undefined && Object.keys(data).length === 1) {
        const updatedNodes = state.schema.nodes.map((node: SchemaNode) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { 
                ...node.data, 
                color: data.color 
              },
              _colorUpdated: Date.now(),
            };
          }
          return node;
        });
        const updatedSelectedNode = state.schema.selectedNode?.id === nodeId
          ? { ...state.schema.selectedNode, data: { ...state.schema.selectedNode.data, color: data.color }, _colorUpdated: Date.now() }
          : state.schema.selectedNode;
        return {
          schema: {
            ...state.schema,
            nodes: updatedNodes,
            selectedNode: updatedSelectedNode,
            _lastColorUpdate: Date.now()
          },
        };
      }
      return {
        schema: {
          ...state.schema,
          nodes: state.schema.nodes.map((node: SchemaNode) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
          selectedNode: state.schema.selectedNode?.id === nodeId
            ? { ...state.schema.selectedNode, data: { ...state.schema.selectedNode.data, ...data } }
            : state.schema.selectedNode,
        },
      };
    }),
  updateActiveTab: (activeTab: string) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, activeTab } })),
  setDuplicateRows: (duplicateRows: Record<string, any>) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, duplicateRows } })),
  updateSettings: (settings: Partial<SchemaState["schema"]["settings"]>) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, settings: { ...state.schema.settings, ...settings } } })),
  addEnumType: (enumType: EnumType) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, enumTypes: [...(state.schema.enumTypes || []), enumType] },
    })),
  updateEnumType: (index: number, enumType: EnumType) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, enumTypes: state.schema.enumTypes.map((et: EnumType, i: number) => i === index ? enumType : et) },
    })),
  removeEnumType: (index: number) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, enumTypes: state.schema.enumTypes.filter((_: EnumType, i: number) => i !== index) },
    })),
  resetSchema: () =>
    set({ schema: { ...initialSchema, enumTypes: [] } }),
  onNodesChange: (changes: NodeChange<SchemaNode>[]) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, nodes: applyNodeChanges(changes, state.schema.nodes) } })),
  onEdgesChange: (changes: EdgeChange<Edge>[]) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, edges: applyEdgeChanges(changes, state.schema.edges) } })),
  onConnect: (connection: Connection) =>
    set((state: SchemaState) => {
      const uniqueId = `e${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newEdge = { ...connection, id: uniqueId, type: 'smoothstep', animated: true };
      const duplicateEdge = state.schema.edges.some((edge: Edge) =>
        edge.source === connection.source &&
        edge.target === connection.target &&
        edge.sourceHandle === connection.sourceHandle &&
        edge.targetHandle === connection.targetHandle
      );
      if (duplicateEdge) {
        console.warn("Duplicate connection prevented");
        return state;
      }
      return { schema: { ...state.schema, edges: [...state.schema.edges, newEdge] } };
    }),
  addNode: (node: SchemaNode) =>
    set((state: SchemaState) => ({ schema: { ...state.schema, nodes: [...state.schema.nodes, node] } })),
  updateEdge: (oldEdge: Edge, newConnection: Connection) =>
    set((state: SchemaState) => ({
      schema: { ...state.schema, edges: state.schema.edges.map((edge: Edge) => edge.id === oldEdge.id ? { ...oldEdge, ...newConnection } : edge) },
    })),
  deleteNode: (node: SchemaNode | any) =>
    set((state: SchemaState) => {
      if (!node) return state;
      let updatedEnumTypes = state.schema.enumTypes; // Always start with current enumTypes
      if (node.type === 'enumType') {
        const usedByRows: { table: string; column: string }[] = [];
        state.schema.nodes.forEach((tableNode: any) => {
          if ((tableNode.type === 'databaseSchema' || !tableNode.type) && tableNode.data?.schema) {
            tableNode.data.schema.forEach((column: any) => {
              if (column.type === `enum_${node.data.name}`) {
                usedByRows.push({ table: tableNode.data.label, column: column.title });
              }
            });
          }
        });
        if (usedByRows.length > 0) {
          console.error(`Cannot delete: This ENUM is used by ${usedByRows.length} column(s)`);
          return state;
        }
        const enumIndex = state.schema.enumTypes.findIndex((et: any) => et.name === node.data.name);
        if (enumIndex !== -1) {
          updatedEnumTypes = state.schema.enumTypes.filter((_: any, i: number) => i !== enumIndex);
        }
      }
      const updatedEdges = state.schema.edges.filter((edge: Edge) => edge.source !== node.id && edge.target !== node.id);
      const updatedNodes = state.schema.nodes.filter((n: SchemaNode) => n.id !== node.id);
      const updatedSelectedNode = state.schema.selectedNode?.id === node.id ? null : state.schema.selectedNode;
      return {
        schema: {
          ...state.schema,
          nodes: updatedNodes,
          edges: updatedEdges,
          selectedNode: updatedSelectedNode,
          enumTypes: updatedEnumTypes
        }
      };
    })
});

const persistConfig: PersistOptions<SchemaState> = { name: "schema-storage" };

export const useSchemaStore = create<SchemaState>()(
  persist(storeImplementation, persistConfig)
);
