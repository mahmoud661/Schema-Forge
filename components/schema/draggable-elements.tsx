import { Database, Type, Plus } from "lucide-react";
import { useState } from "react";

interface DraggableElementsProps {}

export const DraggableElements: React.FC<DraggableElementsProps> = () => {
  const [draggedType, setDraggedType] = useState<string | null>(null);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedType(nodeType);
  };

  const onDragEnd = () => {
    setDraggedType(null);
  };

  return (
    <div className="bg-accent/30 rounded-lg p-3">
      <h3 className="font-semibold mb-2 text-sm flex items-center gap-1">
        <Plus className="h-4 w-4" />
        Add Schema Elements
      </h3>
      
      <div className="flex flex-col gap-2">
        <div
          className="p-3 border rounded-lg cursor-move transition-all hover:bg-muted hover:scale-[1.02] active:scale-[0.98] bg-card shadow-sm flex items-center"
          draggable
          onDragStart={(e) => onDragStart(e, 'table')}
          onDragEnd={onDragEnd}
        >
          <Database className="h-4 w-4 text-primary mr-2" />
          <span>Database Table</span>
        </div>
        
        <div
          className="p-3 border rounded-lg cursor-move transition-all hover:bg-muted hover:scale-[1.02] active:scale-[0.98] bg-card shadow-sm flex items-center border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/20"
          draggable
          onDragStart={(e) => onDragStart(e, 'enum')}
          onDragEnd={onDragEnd}
        >
          <Type className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
          <span className="text-purple-700 dark:text-purple-300">ENUM Type</span>
        </div>
      </div>
    </div>
  );
};
