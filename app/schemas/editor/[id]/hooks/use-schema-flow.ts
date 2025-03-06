import { useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, Edge, Node, useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/hooks/use-schema";
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
  const { 
    schema, 
    updateSchema: updateSchemaState, 
    updateNodes, 
    updateEdges,
    onNodesChange, 
    onEdgesChange,
    setSelectedEdge,
    updateActiveTab,
    setDuplicateColumns
  } = useSchemaStore();
  const { nodes, edges, selectedEdge, activeTab, duplicateColumns } = schema;
  
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const schemaId = params.id as string;
    if (schemaId === "new") {
      updateNodes([]);
      updateEdges([]);
      // Clear any existing enum types when creating a new schema
      updateSchemaState({ enumTypes: [] });
      return;
    }

    // This should now load from your schema store or API instead of a separate schemas store
    // You'll need to adapt this part based on how your application loads schemas
  }, [params.id, updateNodes, updateEdges, updateSchemaState]);

  // Check for duplicate column names across all tables
  useEffect(() => {
    const columnMap: Record<string, string[]> = {};
    const newDuplicateColumns: Record<string, DuplicateColumnInfo> = {};

    // Build a map of column names to table names - only for database schema nodes
    nodes.forEach((node) => {
      // Check if this is a database schema node - enum nodes don't have 'schema' property
      if (node.data && node.data.schema && Array.isArray(node.data.schema)) {
        node.data.schema.forEach((column) => {
          if (!columnMap[column.title]) {
            columnMap[column.title] = [];
          }
          columnMap[column.title].push(node.data.label);
        });
      }
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
  }, [nodes, setDuplicateColumns]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Get the source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Handle connections from ENUM node to table column
      if (sourceNode.type === 'enumType' && 
          (targetNode.type === 'databaseSchema' || !targetNode.type) &&
          params.sourceHandle?.startsWith('enum-source-') &&
          params.targetHandle?.startsWith('target-')) {
        
        // Extract the column name from the target handle
        const columnName = params.targetHandle.substring('target-'.length);
        const enumName = sourceNode.data.name;
        
        // Find the column index
        const columnIndex = targetNode.data.schema.findIndex(
          (col: any) => col.title === columnName
        );
        
        if (columnIndex !== -1) {
          // Update the column type to use the enum
          const updatedNodes = nodes.map(node => {
            if (node.id === targetNode.id) {
              const updatedSchema = [...node.data.schema];
              updatedSchema[columnIndex] = {
                ...updatedSchema[columnIndex],
                type: `enum_${enumName}`
              };
              
              return {
                ...node,
                data: {
                  ...node.data,
                  schema: updatedSchema
                }
              };
            }
            return node;
          });
          
          // Update nodes with the new schema
          updateNodes(updatedNodes);
          
          // Create the edge connection
          const newEdge = {
            id: `e-enum-${params.source}-${params.target}-${columnName}`,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
            type: 'smoothstep',
            animated: true,
            label: 'enum type',
            style: { stroke: '#a855f7' }, // Purple color for enum connections
            data: { connectionType: 'enum' }
          };
          
          updateEdges([...edges, newEdge]);
          toast.success(`Applied ENUM type "${enumName}" to column "${columnName}"`);
          return; // Exit early, we've handled this connection
        }
      }
      
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
          
          updateNodes(updatedNodes);
          
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
          
          updateEdges([...edges, newEdge]);
          toast.success("Created new foreign key column and relationship");
        }
      } else {
        // Handle normal column-to-column connections
        updateEdges([...edges, {
          ...params,
          id: `e${params.source}-${params.target}`,
          type: 'smoothstep',
          animated: true,
        } as Edge]);
      }
    },
    [nodes, edges, updateNodes, updateEdges]
  );

  const onSave = useCallback(async () => {
    try {
      const schemaId = params.id as string;
      if (schemaId === "new") {
        return;
      }

      // This should update your schema in the database or wherever you store it
      // You'll need to adapt this based on your application's save mechanism
      toast.success("Schema saved successfully");
      router.refresh();
    } catch (error) {
      console.error('Failed to save schema:', error);
      toast.error("Failed to save schema");
    }
  }, [params.id, nodes, edges, router]);

  const onNodeDelete = useCallback((nodesToDelete: Node[]): void => {
    updateNodes(nodes.filter(node => 
      !nodesToDelete.some(n => n.id === node.id)
    ));
  }, [nodes, updateNodes]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
  }, [setSelectedEdge]);

  const onEdgeUpdate = useCallback((oldEdge: Edge, newConnection: Connection) => {
    updateEdges(edges.map(e => e.id === oldEdge.id ? { ...oldEdge, ...newConnection } : e));
  }, [edges, updateEdges]);

  const updateEdgeData = useCallback((edgeId: string, data: any) => {
    updateEdges(edges.map(edge => 
      edge.id === edgeId ? { ...edge, ...data } : edge
    ));
  }, [edges, updateEdges]);

  // Add a utility function to update ENUM type names in any columns using them
  const updateEnumTypeNameInColumns = useCallback((oldName: string, newName: string) => {
    const updatedNodes = nodes.map(node => {
      if (node.type === 'databaseSchema' || !node.type) {
        const needsUpdate = node.data.schema?.some((col: any) => 
          col.type === `enum_${oldName}`
        );
        
        if (needsUpdate) {
          // Update the column types to use the new enum name
          const updatedSchema = node.data.schema.map((col: any) => {
            if (col.type === `enum_${oldName}`) {
              return {
                ...col,
                type: `enum_${newName}`
              };
            }
            return col;
          });
          
          return {
            ...node,
            data: {
              ...node.data,
              schema: updatedSchema
            }
          };
        }
      }
      return node;
    });
    
    // Update nodes if any changes were made
    const hasChanges = JSON.stringify(updatedNodes) !== JSON.stringify(nodes);
    if (hasChanges) {
      updateNodes(updatedNodes);
    }
    
    return hasChanges;
  }, [nodes, updateNodes]);

  return {
    nodes,
    edges,
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
    setActiveTab: updateActiveTab,
    duplicateColumns,
    updateEnumTypeNameInColumns,
  };
}