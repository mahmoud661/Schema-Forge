import { toast } from "sonner";
import { SchemaNode } from "@/app/schemas/editor/[id]/types";
import { useEnumConnections } from "./use-enum-connections";
import { useSchemaStore } from "@/hooks/use-schema";
import { useCallback } from "react";

export const useTableOperations = (
  selectedNode: SchemaNode | null,
  onUpdateNode: (data: Partial<any>) => void
) => {
  const { disconnectEnumFromColumn } = useEnumConnections();
  const { schema, updateEdges } = useSchemaStore();
  
  const addColumn = () => {
    if (!selectedNode) return;
    const columnId = Date.now().toString();
    onUpdateNode({
      schema: [
        ...(selectedNode.data?.schema || []),
        { title: "new_column", type: "varchar", constraints: [], id: columnId }
      ]
    });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    
    if (field === 'title') {
      const existingTitles = selectedNode.data.schema
        .map((c: any) => c.title)
        .filter((_: any, i: number) => i !== index);
      
      if (existingTitles.includes(value)) {
        toast.warning(`Row name "${value}" already exists in this table`);
        value = `${value}_${index}`;
      }
    }
    
    // Handle type changes from/to enum
    if (field === 'type') {
      const oldType = newSchema[index].type;
      const oldIsEnum = oldType.startsWith('enum_');
      const newIsEnum = value.startsWith('enum_');
      
      // If changing from enum to non-enum or between different enums
      if (oldIsEnum && (!newIsEnum || oldType !== value)) {
        // We need to disconnect the old enum connection
        disconnectEnumFromColumn(selectedNode.id, newSchema[index].title);
      }
      
      // If changing to an enum type, create a connection
      if (newIsEnum && (!oldIsEnum || oldType !== value)) {
        // Extract enum name from the type (format: enum_typename)
        const enumName = value.substring(5); // Remove 'enum_' prefix
        
        // Find the enum node with this name
        const enumNode = schema.nodes.find(node => 
          node.type === 'enumType' && 
          node.data?.name?.toLowerCase() === enumName.toLowerCase()
        );
        
        if (enumNode) {
          // Create an edge connection from enum to this column
          const newEdge = {
            id: `enum-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: enumNode.id,
            target: selectedNode.id,
            sourceHandle: `enum-source-${enumNode.data.name}`,
            targetHandle: `target-${newSchema[index].title}`,
            type: 'smoothstep',
            animated: true,
            label: 'enum type',
            style: { stroke: '#a855f7' }, // Purple color for enum connections
            data: { connectionType: 'enum' }
          };
          
          // Update edges in the store
          updateEdges([...schema.edges, newEdge]);
          
          // Show success toast
          toast.success(`Connected column to ENUM type "${enumName}"`);
        }
      }
    }
    
    newSchema[index] = { ...newSchema[index], [field]: value };
    onUpdateNode({ schema: newSchema });
  };

  const removeColumn = (index: number) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    
    // If column has enum type, disconnect it first
    const column = newSchema[index];
    if (column.type.startsWith('enum_')) {
      disconnectEnumFromColumn(selectedNode.id, column.title);
    }
    
    newSchema.splice(index, 1);
    onUpdateNode({ schema: newSchema });
  };

  const toggleConstraint = (index: number, constraint: string) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    const row = newSchema[index];
    const constraints = row.constraints || [];
    const hasConstraint = constraints.includes(constraint);
    
    newSchema[index] = {
      ...row,
      constraints: hasConstraint 
        ? constraints.filter((c: string) => c !== constraint)
        : [...constraints, constraint]
    };
    
    onUpdateNode({ schema: newSchema });
  };

  const disconnectFromEnum = (index: number) => {
    if (!selectedNode) return;
    const column = selectedNode.data.schema[index];
    if (column && column.type.startsWith('enum_')) {
      disconnectEnumFromColumn(selectedNode.id, column.title);
    }
  };

  return {
    addColumn,
    updateColumn,
    removeColumn,
    toggleConstraint,
    disconnectFromEnum
  };
};
