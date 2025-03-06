import { toast } from "sonner";
import { SchemaNode } from "@/app/schemas/editor/[id]/types";

export const useTableOperations = (
  selectedNode: SchemaNode | null,
  onUpdateNode: (data: Partial<any>) => void
) => {
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
        toast.warning(`Column name "${value}" already exists in this table`);
        value = `${value}_${index}`;
      }
    }
    
    newSchema[index] = { ...newSchema[index], [field]: value };
    onUpdateNode({ schema: newSchema });
  };

  const removeColumn = (index: number) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    newSchema.splice(index, 1);
    onUpdateNode({ schema: newSchema });
  };

  const toggleConstraint = (index: number, constraint: string) => {
    if (!selectedNode) return;
    const newSchema = [...(selectedNode.data?.schema || [])];
    const column = newSchema[index];
    const constraints = column.constraints || [];
    const hasConstraint = constraints.includes(constraint);
    
    newSchema[index] = {
      ...column,
      constraints: hasConstraint 
        ? constraints.filter((c: string) => c !== constraint)
        : [...constraints, constraint]
    };
    
    onUpdateNode({ schema: newSchema });
  };

  return {
    addColumn,
    updateColumn,
    removeColumn,
    toggleConstraint
  };
};
