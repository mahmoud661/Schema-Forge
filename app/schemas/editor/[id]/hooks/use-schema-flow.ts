import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, Edge, useNodesState, useEdgesState, addEdge, Node, useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/lib/store";
import { templates } from "@/lib/schema-templates";
import { SchemaNode } from "../types";
import { toast } from "sonner";

interface DuplicateColumnInfo {
  [columnName: string]: {
    isDuplicate: boolean;
    tables: string[];
  };
}

export function useSchemaFlow() {
  const params = useParams();
  const router = useRouter();
  const { schemas, updateSchema } = useSchemaStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<SchemaNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [activeTab, setActiveTab] = useState<string>("visual");
  const [duplicateColumns, setDuplicateColumns] = useState<Record<string, DuplicateColumnInfo>>({});
  
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const schemaId = params.id as string;
    if (schemaId === "new") {
      setNodes([]);
      setEdges([]);
      return;
    }

    const schema = schemas.find(s => s.id === schemaId);
    if (schema?.template) {
      const template = templates[schema.template as keyof typeof templates];
      if (template) {
        setNodes(template.nodes as any);
        setEdges(template.edges);
      }
    }
  }, [params.id, schemas, setNodes, setEdges]);

  // Check for duplicate column names across all tables
  useEffect(() => {
    const columnMap: Record<string, string[]> = {};
    const newDuplicateColumns: Record<string, DuplicateColumnInfo> = {};

    // Build a map of column names to table names
    nodes.forEach((node) => {
      node.data.schema.forEach((column) => {
        if (!columnMap[column.title]) {
          columnMap[column.title] = [];
        }
        columnMap[column.title].push(node.data.label);
      });
    });

    // Find duplicates and build the duplicate info structure
    Object.entries(columnMap).forEach(([columnName, tables]) => {
      if (tables.length > 1) {
        tables.forEach((tableName) => {
          if (!newDuplicateColumns[tableName]) {
            newDuplicateColumns[tableName] = {};
          }
          newDuplicateColumns[tableName][columnName] = {
            isDuplicate: true,
            tables: tables.filter(t => t !== tableName)
          };
        });
      }
    });

    setDuplicateColumns(newDuplicateColumns);
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Handle table-level connections
      if (params.targetHandle?.startsWith('table-')) {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        if (sourceNode && targetNode) {
          const sourceColumn = params.sourceHandle?.split('-')[1];
          
          // Create a new foreign key column in the target table
          const newColumn = {
            title: `${sourceNode.data.label.toLowerCase()}_id`,
            type: "uuid",
            constraints: ["notnull"],
            id: `col-${Date.now()}-${Math.random()}`
          };
          
          // Update the target node with the new column
          const updatedNodes = nodes.map(node => {
            if (node.id === targetNode.id) {
              return {
                ...node,
                data: {
                  ...node.data,
                  schema: [...node.data.schema, newColumn]
                }
              };
            }
            return node;
          });
          
          setNodes(updatedNodes);
          
          // Create the edge connection to the new column
          const newEdge = {
            id: `e${params.source}-${params.target}`,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: `target-${newColumn.title}`,
            type: 'smoothstep',
            animated: true,
          };
          
          setEdges(eds => addEdge(newEdge, eds));
          toast.success("Created new foreign key column and relationship");
        }
      } else {
        // Handle normal column-to-column connections
        setEdges(eds => addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
        }, eds));
      }
    },
    [nodes, setNodes, setEdges]
  );

  const onSave = useCallback(async () => {
    try {
      const schemaId = params.id as string;
      if (schemaId === "new") {
        return;
      }

      await updateSchema(schemaId, {
        nodes: nodes as any,
        edges: edges as any,
        updatedAt: new Date().toISOString(),
      });
      router.refresh();
      toast.success("Schema saved successfully");
    } catch (error) {
      console.error('Failed to save schema:', error);
      toast.error("Failed to save schema");
    }
  }, [params.id, nodes, edges, updateSchema, router]);

  const onNodeDelete = useCallback((nodesToDelete: Node[]): void => {
    setNodes(nodes => nodes.filter(node => 
      !nodesToDelete.some(n => n.id === node.id)
    ));
  }, [setNodes]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, []);

  const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges(edges => edges.map(e => e.id === oldEdge.id ? { ...oldEdge, ...newConnection } : e));
  }, [setEdges]);

  const updateEdgeData = useCallback((edgeId: string, data: any) => {
    setEdges(edges => edges.map(edge => 
      edge.id === edgeId ? { ...edge, ...data } : edge
    ));
    
    setSelectedEdge(prev => {
      if (prev && prev.id === edgeId) {
        return { ...prev, ...data };
      }
      return prev;
    });
  }, [setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSave,
    onNodeDelete,
    onEdgeClick,
    onEdgeUpdate,
    selectedEdge,
    setSelectedEdge,
    updateEdgeData,
    activeTab,
    setActiveTab,
    duplicateColumns,
  };
}