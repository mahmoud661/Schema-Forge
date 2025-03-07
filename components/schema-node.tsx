"use client";

import { memo, useEffect, useState, useMemo } from "react";
import { Position, Handle } from "@xyflow/react";
import { useTheme } from "next-themes";
import { themeAwareStringToColor } from "@/lib/utils";
import {
  DatabaseSchemaNode,
  DatabaseSchemaNodeHeader,
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell,
} from "@/components/database-schema-node";
import { Badge } from "@/components/ui/badge";
import { SchemaNodeData, ColumnSchema } from "@/app/schemas/editor/[id]/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TABLE_COLORS } from "@/app/schemas/editor/[id]/hooks/use-schema-nodes";

const getHandleStyle = (type: 'source' | 'target', hasConstraints: boolean = false, isDarkMode: boolean = false) => ({
  background: type === 'source' ? (isDarkMode ? '#34d399' : '#10b981') : (isDarkMode ? '#60a5fa' : '#3b82f6'),
  border: `2px solid ${isDarkMode ? '#374151' : 'white'}`,
  boxShadow: isDarkMode 
    ? `0 0 10px ${type === 'source' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`
    : `0 0 10px ${type === 'source' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.9)'}`,
  opacity: hasConstraints ? 1 : 0.5,
});

const getEnumHandleStyle = (isDarkMode: boolean = false) => ({
  background: isDarkMode ? '#a855f7' : '#9333ea', // Purple for enum handles
  border: `2px solid ${isDarkMode ? '#374151' : 'white'}`,
  boxShadow: isDarkMode 
    ? `0 0 10px rgba(168, 85, 247, 0.6)`
    : `0 0 10px rgba(168, 85, 247, 0.9)`,
  opacity: 1,
});

interface DuplicateInfo {
  isDuplicate: boolean;
  tables: string[];
}

const SchemaNode = memo(
  ({ data, selected, duplicateColumns }: { 
    data: SchemaNodeData; 
    selected?: boolean;
    duplicateColumns?: Record<string, DuplicateInfo>;
  }) => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    
    // Use stored color if available, or compute a fallback color based on node ID
    const { headerColor, headerBgColor } = useMemo(() => {
      // If color is stored in the node data, use it
      if (data.color) {
        return {
          headerColor: data.color.border,
          headerBgColor: isDarkMode ? data.color.dark : data.color.light
        };
      }
      
      // Fallback for legacy nodes without stored color
      const colorIndex = Math.abs(
        data.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
      ) % TABLE_COLORS.length;
      
      const colorSet = TABLE_COLORS[colorIndex];
      return {
        headerColor: colorSet.border,
        headerBgColor: isDarkMode ? colorSet.dark : colorSet.light
      };
    }, [data.id, data.color, isDarkMode]);
    
    // Move tableRows useMemo before conditional as well
    const tableRows = useMemo(() => {
      // Only create real rows when mounted
      if (!mounted) return [];
      
      return data.schema.map((row: ColumnSchema, idx) => {
        // ...existing row rendering code...
        const constraints = row.constraints || [];
        const isPrimary = constraints.includes('primary');
        const isUnique = constraints.includes('unique');
        const isNotNull = constraints.includes('notnull');
        const isIndex = constraints.includes('index');
        const isEnum = row.type.startsWith('enum_'); 
        const duplicateInfo = duplicateColumns?.[row.title];
        
        const columnKey = row.id || `${idx}-${row.title}`;
        const enumName = isEnum ? row.type.replace('enum_', '') : null;

        return (
          <DatabaseSchemaTableRow 
            key={columnKey} 
            className={cn(
              "hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-150",
              duplicateInfo?.isDuplicate && "bg-yellow-50/30 dark:bg-yellow-900/20",
              isEnum && "bg-purple-50/30 dark:bg-purple-900/10"
            )}
          >
            <Handle
              id={`target-${row.title}`}
              type="target"
              position={Position.Left}
              className="!absolute transition-all duration-150"
              style={isEnum 
                ? getEnumHandleStyle(isDarkMode) 
                : getHandleStyle('target', isPrimary || isUnique, isDarkMode)}
            />
              
            <DatabaseSchemaTableCell className="pl-4 pr-2">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-medium">
                  {row.title}
                  {duplicateInfo?.isDuplicate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="inline-block ml-1 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border">
                          <p>Row name duplicated in tables:</p>
                          <ul className="list-disc ml-4">
                            {duplicateInfo.tables.map((table) => (
                              <li key={table}>{table}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </span>
                <div className="flex gap-1">
                  {isPrimary && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">PK</Badge>
                  )}
                  {isUnique && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">UQ</Badge>
                  )}
                  {isNotNull && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">NN</Badge>
                  )}
                  {isIndex && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">IDX</Badge>
                  )}
                  {isEnum && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      ENUM
                    </Badge>
                  )}
                </div>
              </div>
            </DatabaseSchemaTableCell>
              
            <DatabaseSchemaTableCell className="pr-4 text-muted-foreground">
              {isEnum ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-right truncate text-xs w-full italic text-purple-700 dark:text-purple-300 cursor-help">
                        {enumName}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">ENUM Type: {enumName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-right truncate text-xs w-full italic opacity-80">
                  {row.type}
                </span>
              )}
            </DatabaseSchemaTableCell>
              
            <Handle
              id={`source-${row.title}`}
              type="source"
              position={Position.Right}
              className="!absolute transition-all duration-150"
              style={isEnum 
                ? getEnumHandleStyle(isDarkMode)
                : getHandleStyle('source', isPrimary || isUnique, isDarkMode)}
            />
          </DatabaseSchemaTableRow>
        );
      });
    }, [data.schema, duplicateColumns, isDarkMode, mounted]);
    
    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <DatabaseSchemaNode className="p-0 shadow-md">
          <DatabaseSchemaNodeHeader>
            <div className="w-full rounded-t-md py-2 px-3 font-medium bg-muted/20"
                style={{ 
                  backgroundColor: headerBgColor,
                  borderBottom: `2px solid ${headerColor}` 
                }}>
              {data.label}
            </div>
          </DatabaseSchemaNodeHeader>
          <DatabaseSchemaNodeBody>
            {/* No content when not mounted */}
          </DatabaseSchemaNodeBody>
        </DatabaseSchemaNode>
      );
    }
    
    return (
      <DatabaseSchemaNode 
        className={`p-0 transition-all duration-200 ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`} 
        selected={selected}
      >
        <DatabaseSchemaNodeHeader>
          <div 
            className="w-full rounded-t-md py-2 px-3 font-medium"
            style={{ 
              backgroundColor: headerBgColor,
              borderBottom: `2px solid ${headerColor}` 
            }}
          >
            {data.label}
          </div>
          <Handle
            type="target"
            position={Position.Top}
            id={`table-${data.label}`}
            className="!absolute transition-all duration-150"
            style={{
              ...getHandleStyle('target', true, isDarkMode),
              top: -8,
              opacity: 0.5,
              width: '16px',
              height: '16px',
            }}
          />
        </DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody>
          {tableRows}
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaNode>
    );
  },
  (prevProps, nextProps) => {
    // More precise comparison for better memo effectiveness
    if (prevProps.selected !== nextProps.selected) return false;
    
    // Compare data structure more efficiently
    const prevData = prevProps.data;
    const nextData = nextProps.data;
    
    if (prevData.label !== nextData.label) return false;
    if (prevData.id !== nextData.id) return false;
    
    // Schema length check
    if (prevData.schema.length !== nextData.schema.length) return false;
    
    // Check if duplicateColumns has changed
    const prevDups = JSON.stringify(prevProps.duplicateColumns || {});
    const nextDups = JSON.stringify(nextProps.duplicateColumns || {});
    if (prevDups !== nextDups) return false;
    
    // Deep schema comparison only when necessary
    for (let i = 0; i < prevData.schema.length; i++) {
      const prevCol = prevData.schema[i];
      const nextCol = nextData.schema[i];
      
      if (prevCol.title !== nextCol.title ||
          prevCol.type !== nextCol.type ||
          JSON.stringify(prevCol.constraints) !== JSON.stringify(nextCol.constraints)) {
        return false;
      }
    }
    
    return true; // No changes detected
  }
);

SchemaNode.displayName = "SchemaNode";

export default SchemaNode;