import { useState } from "react";
import { toast } from "sonner";
import { EnumTypeNode, SchemaNode } from "@/app/schemas/editor/[id]/types";
import { useSchemaStore } from "@/hooks/use-schema";
import { useSchemaFlow } from "@/app/schemas/editor/[id]/hooks/use-schema-flow";

export const useEnumOperations = (
  selectedNode: EnumTypeNode | null,
  onUpdateNode: (data: Partial<any>) => void,
  nodes: (SchemaNode | EnumTypeNode)[]
) => {
  const [newEnumValue, setNewEnumValue] = useState("");
  const { schema, updateEnumType, removeEnumType } = useSchemaStore();
  
  // Get the updateEnumTypeNameInRows function from useSchemaFlow
  // We need this in a component that uses useEnumOperations
  let schemaFlowFunctions: any = {};
  try {
    schemaFlowFunctions = useSchemaFlow();
  } catch (e) {
    // Ignore - in some contexts useReactFlow won't be available
  }
  
  const { updateEnumTypeNameInRows, updateEnumEdges } = schemaFlowFunctions;

  const findRowsUsingEnum = () => {
    if (!selectedNode) return [];
    
    const usages: { table: string, row: string }[] = [];
    
    nodes.forEach(node => {
      if ((node.type === 'databaseSchema' || !node.type) && node.data.schema) {
        node.data.schema.forEach((row: any) => {
          if (row.type === `enum_${selectedNode.data.name}`) {
            usages.push({ table: node.data.label, row: row.title });
          }
        });
      }
    });
    
    return usages;
  };

  const addEnumValue = () => {
    if (!selectedNode || !newEnumValue.trim()) return;
    
    const existingValues = selectedNode.data.values || [];
    
    // Check for duplicates
    if (existingValues.includes(newEnumValue)) {
      toast.warning(`Value "${newEnumValue}" already exists in this ENUM`);
      return;
    }
    
    // Update enum node
    onUpdateNode({
      values: [...existingValues, newEnumValue]
    });
    
    // Also update in store
    const enumIndex = schema.enumTypes.findIndex(et => et.name === selectedNode.data.name);
    if (enumIndex !== -1) {
      updateEnumType(enumIndex, {
        name: selectedNode.data.name,
        values: [...existingValues, newEnumValue]
      });
    }
    
    setNewEnumValue("");
    toast.success(`Added "${newEnumValue}" to ENUM values`);
    
    return newEnumValue;
  };
  
  const removeEnumValue = (valueToRemove: string) => {
    if (!selectedNode) return;
    
    const filteredValues = selectedNode.data.values.filter(v => v !== valueToRemove);
    
    // Update enum node
    onUpdateNode({
      values: filteredValues
    });
    
    // Also update in store
    const enumIndex = schema.enumTypes.findIndex(et => et.name === selectedNode.data.name);
    if (enumIndex !== -1) {
      updateEnumType(enumIndex, {
        name: selectedNode.data.name,
        values: filteredValues
      });
    }
  };
  
  const renameEnumType = (newName: string) => {
    if (!selectedNode) return;
    
    // Don't allow empty names
    if (!newName.trim()) return;
    
    // No change case
    if (newName === selectedNode.data.name) return;
    
    // Check for duplicate names
    const isDuplicate = schema.enumTypes.some(et => 
      et.name !== selectedNode.data.name && et.name.toLowerCase() === newName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.warning(`ENUM type "${newName}" already exists`);
      return;
    }
    
    const oldName = selectedNode.data.name;
    
    // Update enum node first
    onUpdateNode({
      name: newName
    });
    
    // Also update in store
    const enumIndex = schema.enumTypes.findIndex(et => et.name === oldName);
    if (enumIndex !== -1) {
      updateEnumType(enumIndex, {
        name: newName,
        values: selectedNode.data.values
      });
    }
    
    // Update all rows using this enum
    if (updateEnumTypeNameInRows) {
      const updated = updateEnumTypeNameInRows(oldName, newName);
      
      if (updated) {
        toast.info(`Updated ENUM reference in rows`);
      }
    }
    
    // Update edge labels
    if (updateEnumEdges) {
      updateEnumEdges(selectedNode.id, newName);
    }
  };

  const deleteEnumType = () => {
    if (!selectedNode) return;
    
    const enumUsages = findRowsUsingEnum();
    if (enumUsages.length > 0) {
      toast.error(`Cannot delete: This ENUM is used by ${enumUsages.length} row(s)`);
      return false;
    }
    
    // Find the enum index
    const enumIndex = schema.enumTypes.findIndex(et => et.name === selectedNode.data.name);
    if (enumIndex !== -1) {
      removeEnumType(enumIndex);
      return true;
    }
    
    return false;
  };

  return {
    newEnumValue,
    setNewEnumValue,
    findRowsUsingEnum,
    addEnumValue,
    removeEnumValue,
    renameEnumType,
    deleteEnumType
  };
};
