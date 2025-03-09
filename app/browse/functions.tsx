import { templates } from "./data";
import { Schema } from "./types";

export const handleCreateFromTemplate = (template: typeof templates[0], addSchema: (newSchema: Schema) => void, setIsCreating: (isCreating: boolean) => void) => {
  const newSchema = {
    id: `${template.id}-${Date.now()}`,
    title: `${template.title} Copy`,
    description: template.description,
    tags: template.tags,
    template: template.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  addSchema(newSchema);
  setIsCreating(true);
  // Navigate to editor after a brief delay to show feedback
  setTimeout(() => {
    window.location.href = `/schemas/editor/${newSchema.id}`;
  }, 500);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(date);
};
