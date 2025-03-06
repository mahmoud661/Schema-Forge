import { useCallback } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { toast } from "sonner";

export function useEnumConnections() {
  const { schema, updateEdges } = useSchemaStore();
  
  /**
   * Disconnect a column from an enum
   * @param nodeId - ID of the table node
   * @param columnTitle - Title of the column
   * @returns Success flag
   */
  const disconnectEnumFromColumn = useCallback((nodeId: string, columnTitle: string) => {
    const { edges } = schema;
    
    // Find edges connecting to this column's target handle
    const targetHandle = `target-${columnTitle}`;
    const edgesToRemove = edges.filter(edge => 
      edge.target === nodeId && 
      edge.targetHandle === targetHandle &&
      edge.data?.connectionType === 'enum'
    );
    
    if (edgesToRemove.length === 0) {
      return false;
    }
    
    // Remove the edge(s)
    const updatedEdges = edges.filter(edge => !edgesToRemove.includes(edge));
    updateEdges(updatedEdges);
    
    // Show success message
    if (edgesToRemove.length > 0) {
      toast.info("Disconnected from ENUM type");
      return true;
    }
    
    return false;
  }, [schema, updateEdges]);
  
  /**
   * Check if a column is connected to an enum
   * @param nodeId - ID of the table node
   * @param columnTitle - Title of the column
   * @returns Boolean indicating if connected
   */
  const isColumnConnectedToEnum = useCallback((nodeId: string, columnTitle: string) => {
    const { edges } = schema;
    const targetHandle = `target-${columnTitle}`;
    
    return edges.some(edge => 
      edge.target === nodeId && 
      edge.targetHandle === targetHandle &&
      edge.data?.connectionType === 'enum'
    );
  }, [schema]);

  return {
    disconnectEnumFromColumn,
    isColumnConnectedToEnum,
  };
}
