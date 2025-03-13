import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Connection, Edge, Node, useReactFlow } from "@xyflow/react";
import { useSchemaStore } from "@/hooks/use-schema";
import { toast } from "sonner";
import { debounce } from "lodash"; // You'll need to install lodash if not already
import { NodeTypes } from "@xyflow/react";
interface DuplicateColumnInfo {
  [rowName: string]: {
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
    setSelectedNode,
    onConnect: storeOnConnect,
    setDuplicateRows,
  } = useSchemaStore();
  const { nodes, edges, selectedEdge, activeTab, duplicateRows } = schema;
  
  const reactFlowInstance = useReactFlow();
  // Use a reference to avoid recreating functions
  const stableNodeIds = useRef(new Set());

  // Initial setup - only reset for truly new schemas
  useEffect(() => {
    const schemaId = params.id as string;
    if (schemaId === "new" && nodes.length === 0) {
      updateNodes([]);
      updateEdges([]);
      updateSchemaState({ enumTypes: [] });
    }
  }, [params.id]);

  // Performance optimization: Debounce duplicate row detection
  const debouncedDuplicateCheck = useCallback(
    debounce((nodes) => {
      const rowMap: Record<string, string[]> = {};
      const newDuplicateRows: Record<string, any> = {};

      // Only check database schema nodes
      interface Row {
        title: string;
      }

      interface NodeData {
        schema?: Row[];
        label: string;
      }

      nodes.forEach((node: Node<NodeTypes>) => {
        if (node.data?.schema && Array.isArray(node.data.schema)) {
          node.data.schema.forEach((row: Row) => {
            if (!rowMap[row.title]) {
              rowMap[row.title] = [];
            }
            rowMap[row.title].push(String(node.data.label));
          });
        }
      });

      Object.entries(rowMap).forEach(([rowName, tables]) => {
        if (tables.length > 1) {
          tables.forEach((tableName) => {
            if (!newDuplicateRows[tableName]) {
              newDuplicateRows[tableName] = {};
            }
            newDuplicateRows[tableName][rowName] = {
              isDuplicate: true,
              tables: tables.filter(t => t !== tableName)
            };
          });
        }
      });

      // Always initialize with an object, never undefined
      setDuplicateRows(newDuplicateRows || {});
    }, 300), // 300ms debounce
    [setDuplicateRows]
  );

  // Check for duplicate row names across all tables - now using debounced function
  useEffect(() => {
    // Don't run on every small node change
    if (nodes.length > 0) {
      debouncedDuplicateCheck(nodes);
    }
    return () => {
      debouncedDuplicateCheck.cancel();
    };
  }, [nodes, debouncedDuplicateCheck]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // Get the source and target nodes
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Handle connections from ENUM node to table row
      if (sourceNode.type === 'enumType' && 
          (targetNode.type === 'databaseSchema' || !targetNode.type) &&
          params.sourceHandle?.startsWith('enum-source-') &&
          params.targetHandle?.startsWith('target-')) {
        
        // Extract the row name from the target handle
        const rowName = params.targetHandle.substring('target-'.length);
        const enumName = sourceNode.data.name;
        
        // Find the row index
        const rowIndex = targetNode.data.schema.findIndex(
          (row: any) => row.title === rowName
        );
        
        if (rowIndex !== -1) {
          // Check if there's an existing enum connection we need to remove
          const existingEnumEdges = edges.filter(edge => 
            edge.target === targetNode.id && 
            edge.targetHandle === params.targetHandle &&
            edge.data?.connectionType === 'enum'
          );
          
          // Remove existing enum connections to this row
          if (existingEnumEdges.length > 0) {
            const filteredEdges = edges.filter(edge => !existingEnumEdges.includes(edge));
            updateEdges(filteredEdges);
          }
          
          // Update the row type to use the enum
          const updatedNodes = nodes.map(node => {
            if (node.id === targetNode.id) {
              const updatedSchema = [...node.data.schema];
              updatedSchema[rowIndex] = {
                ...updatedSchema[rowIndex],
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
          
          // Create the edge connection with proper enum styling and a more unique ID
          const newEdge = {
            id: `enum-edge-${Date.now()}-${params.source}-${params.target}-${rowName}`,
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
          
          updateEdges([...edges.filter(e => !existingEnumEdges.includes(e)), newEdge]);
          toast.success(`Applied ENUM type "${enumName}" to row "${rowName}"`);
          return; // Exit early, we've handled this connection
        }
      }
      
      // Handle table-level connections
      if (params.targetHandle?.startsWith('table-')) {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        
        if (sourceNode && targetNode) {
          const sourceColumn = params.sourceHandle?.split('-')[1];
          
          // Create a new foreign key row in the target table
          const newColumn = {
            title: `${sourceNode.data.label.toLowerCase()}_id`,
            type: "uuid",
            constraints: ["notnull"],
            id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          };
          
          // Update the target node with the new row
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
          
          // Create a more unique edge ID including timestamp
          const uniqueEdgeId = `edge-${Date.now()}-${params.source}-${params.target}-${Math.random().toString(36).substring(2, 7)}`;
          
          // Create the edge connection to the new row with the unique ID
          const newEdge = {
            id: uniqueEdgeId,
            source: params.source,
            target: params.target,
            sourceHandle: params.sourceHandle,
            targetHandle: `target-${newColumn.title}`,
            type: 'smoothstep',
            animated: true,
          };
          
          updateEdges([...edges, newEdge]);
          toast.success("Created new foreign key row and relationship");
        }
      } else {
        // Handle normal row-to-row connections
        // Check if this is trying to connect to a row that already has an enum connection
        const existingEnumEdge = edges.find(edge => 
          edge.target === params.target && 
          edge.targetHandle === params.targetHandle &&
          edge.data?.connectionType === 'enum'
        );
        
        if (existingEnumEdge) {
          toast.warning("This row is already connected to an ENUM type. Please disconnect it first.");
          return;
        }
        
        // Check if an edge with the same source and target handles already exists
        const existingEdge = edges.find(edge => 
          edge.source === params.source && 
          edge.sourceHandle === params.sourceHandle &&
          edge.target === params.target &&
          edge.targetHandle === params.targetHandle
        );
        
        if (existingEdge) {
          toast.warning("This connection already exists");
          return;
        }
        
        // Generate a unique ID with timestamp and random string
        const uniqueId = `e${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${params.source}-${params.target}`;
        
        // Add the new edge for normal connections with the unique ID
        updateEdges([...edges, {
          ...params,
          id: uniqueId,
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

      toast.success("Schema saved successfully");
      router.refresh();
    } catch (error) {
      console.error('Failed to save schema:', error);
      toast.error("Failed to save schema");
    }
  }, [params.id, router]);

  const onNodeDelete = useCallback((nodesToDelete: Node[]): void => {
    // Update stable reference of node IDs
    stableNodeIds.current = new Set(nodes.map(n => n.id));
    
    // For each deleted node, we need to perform clean-up
    for (const nodeToDelete of nodesToDelete) {
      // If an enum node is deleted, clean up the enum type
      if (nodeToDelete.type === 'enumType') {
        const enumNode = nodeToDelete as any;
        const enumName = enumNode.data?.name;
        
        if (enumName) {
          // First check if this enum is used by any tables
          let isUsed = false;
          nodes.forEach(node => {
            if ((node.type === 'databaseSchema' || !node.type) && node.data?.schema) {
              node.data.schema.forEach((row: any) => {
                if (row.type === `enum_${enumName}`) {
                  isUsed = true;
                }
              });
            }
          });
          
          if (isUsed) {
            toast.error(`Cannot delete: ENUM type "${enumName}" is used by one or more rows`);
            // Skip this node, don't delete it
            continue;
          }
          
          // Find and remove the enum type from store
          const enumIndex = schema.enumTypes.findIndex(et => et.name === enumName);
          if (enumIndex !== -1) {
            // We'll remove it later after all checks
            setTimeout(() => {
              useSchemaStore.getState().removeEnumType(enumIndex);
            }, 0);
          }
        }
      }
    }
    
    // Filter nodes to remove deleted ones
    const validNodesToDelete = nodesToDelete.filter(node => {
      if (node.type === 'enumType') {
        const enumNode = node as any;
        const enumName = enumNode.data?.name;
        
        // Check if this enum is used by any tables
        let isUsed = false;
        nodes.forEach(n => {
          if ((n.type === 'databaseSchema' || !n.type) && n.data?.schema) {
            n.data.schema.forEach((row: any) => {
              if (row.type === `enum_${enumName}`) {
                isUsed = true;
              }
            });
          }
        });
        
        return !isUsed; // Only include if not used
      }
      return true; // Include all other nodes
    });
    
    if (validNodesToDelete.length !== nodesToDelete.length) {
      // Some nodes weren't deleted
      return;
    }
    
    // Clean up edges connected to deleted nodes
    const nodeIds = new Set(validNodesToDelete.map(n => n.id));
    const newEdges = edges.filter(
      edge => !nodeIds.has(edge.source) && !nodeIds.has(edge.target)
    );
    
    if (newEdges.length !== edges.length) {
      updateEdges(newEdges);
    }
    
    // Update nodes
    updateNodes(nodes.filter(node => !nodeIds.has(node.id)));
    
    // Clear selection if the selected node was deleted
    if (schema.selectedNode && nodeIds.has(schema.selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [nodes, edges, schema, updateNodes, updateEdges, setSelectedNode]);

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

  // Add a utility function to update ENUM type names in any rows using them
  const updateEnumTypeNameInRows = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return false;
    
    const updatedNodes = nodes.map(node => {
      // Only process database schema nodes
      if (node.type === 'databaseSchema' || !node.type) {
        const needsUpdate = node.data.schema?.some((row: any) => 
          row.type === `enum_${oldName}`
        );
        
        if (needsUpdate) {
          // Update the row types to use the new enum name
          const updatedSchema = node.data.schema.map((row: any) => {
            if (row.type === `enum_${oldName}`) {
              return {
                ...row,
                type: `enum_${newName}`
              };
            }
            return row;
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
  
  // Update edges when enum is renamed
  const updateEnumEdges = useCallback((oldEnumNodeId: string, newEnumName: string) => {
    // Find all enum edges from this enum node and update them
    const updatedEdges = edges.map(edge => {
      if (edge.source === oldEnumNodeId && edge.data?.connectionType === 'enum') {
        return {
          ...edge,
          label: `enum: ${newEnumName}`,
        };
      }
      return edge;
    });
    
    // Update edges if any changes were made
    const hasChanges = JSON.stringify(updatedEdges) !== JSON.stringify(edges);
    if (hasChanges) {
      updateEdges(updatedEdges);
    }
    
    return hasChanges;
  }, [edges, updateEdges]);

  return {
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
    duplicateRows,
    updateEnumTypeNameInRows,
    updateEnumEdges,
  };
}
