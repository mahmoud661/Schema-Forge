import { ChevronDown, Table } from "lucide-react";
import { cn } from "@/lib/utils";
import { themeAwareStringToColor } from "@/lib/utils";
import { SchemaNode, EnumTypeNode } from "@/app/schemas/editor/[id]/types/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TableItemProps {
  node: SchemaNode;
  isSelected: boolean;
  isOpen: boolean;
  isDarkMode: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}

export const TableItem = ({ 
  node, 
  isSelected, 
  isOpen, 
  isDarkMode, 
  onToggle,
  children 
}: TableItemProps) => {
  const displayName = node.data?.label || 'Untitled Table';

  return (
    <Collapsible
      key={node.id}
      open={isOpen}
      onOpenChange={onToggle}
    >
      <CollapsibleTrigger className="w-full">
        <div 
          className={cn(
            "flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-all duration-200",
            isSelected && "ring-2 ring-primary/30"
          )}
          style={{
            borderColor: themeAwareStringToColor(displayName, { darkMode: isDarkMode }),
            backgroundColor: themeAwareStringToColor(displayName, { 
              darkMode: isDarkMode, 
              saturation: isDarkMode ? 40 : 70, 
              lightness: { light: 97, dark: 20 }, 
              opacity: 0.2 
            })
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: themeAwareStringToColor(displayName, { darkMode: isDarkMode }) }}
            />
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">({node.data?.schema?.length || 0})</span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent 
        className={cn(
          "overflow-hidden transition-all duration-200",
          "data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up"
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};
