import { EnumTypeNode } from "@/app/schemas/editor/[id]/types";
import { cn } from "@/lib/utils";

interface EnumItemProps {
  node: EnumTypeNode;
  isSelected: boolean;
  onClick: () => void;
}

export const EnumItem: React.FC<EnumItemProps> = ({ node, isSelected, onClick }) => {
  const displayName = node.data?.name || 'Unnamed Enum';
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-all duration-200 mb-1",
        isSelected && "ring-2 ring-purple-500/30",
        "border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-900/10"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
        <span className="font-medium text-sm text-purple-700 dark:text-purple-300">{displayName}</span>
        <span className="text-xs text-muted-foreground">
          ({node.data?.values?.length || 0} values)
        </span>
      </div>
    </div>
  );
};
