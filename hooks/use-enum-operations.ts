import { useState } from "react";
import { toast } from "sonner";
import { EnumTypeNode, SchemaNode } from "@/app/schemas/editor/[id]/types";
import { useSchemaStore } from "@/hooks/use-schema";

export const useEnumOperations = (
  selectedNode: EnumTypeNode | null,
  onUpdateNode: (data: Partial<any>) => void,
  nodes: (SchemaNode | EnumTypeNode)[]
) => {
  const [newEnumValue, setNewEnumValue] = useState("");
  const { schema, updateEnumType, removeEnumType } = useSchemaStore();

  const findColumnsUsingEnum = () => {
    if (!selectedNode) return [];
    
    const usages: { table: string, column: string }[] = [];
    
    nodes.forEach(node => {
      if ((node.type === 'databaseSchema' || !node.type) && node.data.schema) {
        node.data.schema.forEach((col: any) => {
          if (col.type === `enum_${selectedNode.data.name}`) {
            usages.push({ table: node.data.label, column: col.title });
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
    
    // Check for duplicate names
    const isDuplicate = schema.enumTypes.some(et => 
      et.name !== selectedNode.data.name && et.name.toLowerCase() === newName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.warning(`ENUM type "${newName}" already exists`);
      return;
    }
    
    const oldName = selectedNode.data.name;
    
    // Update enum node
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
    
    // Find columns using this enum
    const tablesWithEnum = nodes.filter(node => 
      node.type === 'databaseSchema' || !node.type
    ).filter(node => 
      node.data.schema?.some((col: any) => 
        col.type === `enum_${oldName}`
      )
    );
    
    if (tablesWithEnum.length > 0) {
      toast.info(`Updated ENUM reference in ${tablesWithEnum.length} table(s)`);
    }
  };

  const deleteEnumType = () => {
    if (!selectedNode) return;
    
    const enumUsages = findColumnsUsingEnum();
    if (enumUsages.length > 0) {
      toast.error(`Cannot delete: This ENUM is used by ${enumUsages.length} column(s)`);
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
    findColumnsUsingEnum,
    addEnumValue,
    removeEnumValue,
    renameEnumType,
    deleteEnumType
  };
};
