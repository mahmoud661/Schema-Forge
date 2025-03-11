import { SchemaNode } from "@/app/schemas/editor/[id]/types/types";
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

  // Added actions to support React Flow
  onNodesChange: (changes: OnNodesChange) => void;
  onEdgesChange: (changes: OnEdgesChange) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: SchemaNode) => void;
  updateEdge: (oldEdge: Edge, newConnection: Connection) => void;

  // Add this new action to the interface
  deleteNode: (node: SchemaNode | any) => void;
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
  duplicateRows: {},
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
      (state: any) => {
        // Deduplicate edges by ID before storing
        const uniqueEdges = [];
        const edgeIds = new Set();
        
        for (const edge of edges) {
          if (!edgeIds.has(edge.id)) {
            edgeIds.add(edge.id);
            uniqueEdges.push(edge);
          } else {
            console.warn(`Duplicate edge ID detected: ${edge.id}`);
          }
        }
        
        return {
          schema: { ...state.schema, edges: uniqueEdges },
        };
      },
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
      (state: any) => {
        // Special case for color updates to minimize re-renders
        if (data.color !== undefined && Object.keys(data).length === 1) {
          // Use a more targeted update approach for colors
          const updatedNodes = state.schema.nodes.map((node: SchemaNode) => {
            if (node.id === nodeId) {
              // Only update the color property without triggering full node rebuild
              return {
                ...node,
                data: { 
                  ...node.data, 
                  color: data.color 
                },
                // Add an internal marker to track color updates
                _colorUpdated: Date.now(),
              };
            }
            return node;
          });
          
          // Similarly, targeted update for selectedNode if it's the one being colored
          const updatedSelectedNode = state.schema.selectedNode?.id === nodeId
            ? {
                ...state.schema.selectedNode,
                data: { ...state.schema.selectedNode.data, color: data.color },
                _colorUpdated: Date.now()
              }
            : state.schema.selectedNode;
          
          return {
            schema: {
              ...state.schema,
              nodes: updatedNodes,
              selectedNode: updatedSelectedNode,
              // Skip updating other properties to prevent cascading re-renders
              _lastColorUpdate: Date.now() // Add marker for subscribers
            },
          };
        }
        
        // Original implementation for other updates
        return {
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
        };
      },
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

  setDuplicateRows: (duplicateRows: Record<string, any>) =>
    set(
      (state: any) => ({
        schema: { ...state.schema, duplicateRows },
      }),
      false,
      "setDuplicateRows"
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
        // Create a more unique edge ID with timestamp and random component
        const uniqueId = `e${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        const newEdge = {
          ...connection,
          id: uniqueId,
          type: 'smoothstep',
          animated: true,
        };
        
        // Check for duplicate connections
        const duplicateEdge = state.schema.edges.some(
          (edge: Edge) => 
            edge.source === connection.source && 
            edge.target === connection.target &&
            edge.sourceHandle === connection.sourceHandle && 
            edge.targetHandle === connection.targetHandle
        );
        
        if (duplicateEdge) {
          console.warn("Duplicate connection prevented");
          return state; // Return unchanged state
        }
        
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

  // Add the deleteNode implementation
  deleteNode: (node: SchemaNode | any) =>
    set(
      (state: any) => {
        if (!node) return state;
        
        // Handle enum type deletion
        if (node.type === 'enumType') {
          // Check if this enum is used by any tables
          const usedByRows: { table: string; row: string }[] = [];
          
          state.schema.nodes.forEach((tableNode: any) => {
            if ((tableNode.type === 'databaseSchema' || !tableNode.type) && tableNode.data?.schema) {
              tableNode.data.schema.forEach((row: any) => {
                if (row.type === `enum_${node.data.name}`) {
                  usedByRows.push({
                    table: tableNode.data.label,
                    row: row.title
                  });
                }
              });
            }
          });
          
          // If enum is in use, don't delete it
          if (usedByRows.length > 0) {
            console.error(`Cannot delete: This ENUM is used by ${usedByRows.length} row(s)`);
            return state; // Return unchanged state
          }
          
          // Get the enum index for removal
          const enumIndex = state.schema.enumTypes?.findIndex((et: any) => 
            et.name === node.data.name
          );
          
          // We'll update enum types if needed
          let updatedEnumTypes = [...(state.schema.enumTypes || [])];
          if (enumIndex !== -1) {
            updatedEnumTypes = updatedEnumTypes.filter((_, i) => i !== enumIndex);
          }
        }
        
        // Remove all edges connected to this node
        const updatedEdges = state.schema.edges.filter(
          (edge: Edge) => edge.source !== node.id && edge.target !== node.id
        );
        
        // Remove the node itself
        const updatedNodes = state.schema.nodes.filter(
          (n: SchemaNode) => n.id !== node.id
        );
        
        // Clear selection if the deleted node was selected
        const updatedSelectedNode = 
          state.schema.selectedNode?.id === node.id
            ? null
            : state.schema.selectedNode;
        
        return {
          schema: {
            ...state.schema,
            nodes: updatedNodes,
            edges: updatedEdges,
            selectedNode: updatedSelectedNode,
            enumTypes: node.type === 'enumType' ? updatedEnumTypes : state.schema.enumTypes
          }
        };
      },
      false,
      "deleteNode"
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
