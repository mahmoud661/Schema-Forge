import { EnumTypeNode } from "@/app/schemas/editor/[id]/types/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnumItemProps {
  node: EnumTypeNode;
  isSelected: boolean;
  isExpanded?: boolean;
  onClick: () => void;
  onToggleExpand: (e: React.MouseEvent) => void;
}

export const EnumItem: React.FC<EnumItemProps> = ({ 
  node, 
  isSelected, 
  isExpanded = false,
  onClick,
  onToggleExpand
}) => {
  const displayName = node.data?.name || 'Unnamed Enum';
  const values = node.data?.values || [];
  
  return (
    <div className="rounded-md overflow-hidden">
      <div 
        className={cn(
          "flex items-center justify-between p-2.5 border transition-colors",
          isSelected 
            ? "bg-purple-100/50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-800" 
            : "border-border hover:bg-muted/50 dark:hover:bg-muted/20",
          isExpanded ? "rounded-b-none border-b-0" : "rounded-md",
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Use a proper button element for the toggle */}
          <button 
            className="p-1 rounded-md flex items-center justify-center"
            onClick={onToggleExpand}
            type="button"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-purple-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-purple-500" />
            )}
          </button>
          
          <div className="w-3.5 h-3.5 rounded-full bg-purple-500"></div>
          <span className="font-medium text-sm text-purple-700 dark:text-purple-300 truncate flex-1">
            {displayName}
          </span>
        </div>
        
        <Badge variant="outline" className="text-[10px] bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300">
          {values.length}
        </Badge>
      </div>
      
      {/* Expandable enum values - visible when expanded */}
      {isExpanded && values.length > 0 && (
        <div className="border border-t-0 rounded-b-md bg-purple-50/30 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800/50 px-2 py-1">
          <div className="max-h-[120px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-0.5">
              {values.map((value, index) => (
                <div 
                  key={index} 
                  className="flex items-center py-1 px-2 text-xs rounded-sm hover:bg-purple-100/50 dark:hover:bg-purple-900/30"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-2"></div>
                  <span className="font-mono text-xs text-purple-800 dark:text-purple-300 truncate">'{value}'</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{index}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
