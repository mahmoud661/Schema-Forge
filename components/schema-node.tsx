"use client";

import { memo, useEffect, useState, useMemo, useRef, forwardRef } from "react";
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
import { SchemaNodeData, ColumnSchema } from "@/app/schemas/editor/[id]/types/types";
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

// Update SchemaNodeData type to include _colorUpdated
interface ExtendedSchemaNodeData extends SchemaNodeData {
  _colorUpdated?: boolean;
}

const SchemaNode = memo(
  ({ data, selected, duplicateRows }: { 
    data: ExtendedSchemaNodeData; 
    selected?: boolean;
    duplicateRows?: Record<string, DuplicateInfo>;
  }) => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === 'dark';
    const nodeRef = useRef<HTMLDivElement>(null);
    
    // Extract only border color from node data - simplified approach
    const { borderColor, nodeStyle } = useMemo(() => {
      // Get the border color from node data or use default
      const borderColor = data.color?.border || '#38bdf8';
      
      // Apply only border styling, no background
      const nodeStyle = {
        borderBottom: `3px solid ${borderColor}`
      };
      
      return { borderColor, nodeStyle };
    }, [data.color]);

    // Direct DOM update for color changes - very performant
    useEffect(() => {
      if (mounted && nodeRef.current && data._colorUpdated) {
        // Find the header element
        const header = nodeRef.current.querySelector('.node-header');
        if (header && data.color) {
          // Apply only border style for instant update
          (header as HTMLElement).style.borderBottom = `3px solid ${data.color.border}`;
        }
      }
    }, [data._colorUpdated, mounted]);

    useEffect(() => {
      setMounted(true);
    }, []);
    
    // Move tableRows useMemo before conditional as well
    const tableRows = useMemo(() => {
      // Only create real columns when mounted
      if (!mounted) return [];
      
      return data.schema.map((column: ColumnSchema, idx) => {
        // ...existing column rendering code...
        const constraints = column.constraints || [];
        const isPrimary = constraints.includes('primary');
        const isUnique = constraints.includes('unique');
        const isNotNull = constraints.includes('notnull');
        const isIndex = constraints.includes('index');
        const isEnum = column.type.startsWith('enum_'); 
        const duplicateInfo = duplicateRows?.[column.title];
        
        const rowKey = column.id || `${idx}-${column.title}`;
        const enumName = isEnum ? column.type.replace('enum_', '') : null;

        // Create left handle component
        const leftHandle = (
          <Handle
            id={`target-${column.title}`}
            type="target"
            position={Position.Left}
            className="!absolute transition-all duration-150"
            style={isEnum 
              ? getEnumHandleStyle(isDarkMode) 
              : getHandleStyle('target', isPrimary || isUnique, isDarkMode)}
          />
        );

        // Create right handle component
        const rightHandle = (
          <Handle
            id={`source-${column.title}`}
            type="source"
            position={Position.Right}
            className="!absolute transition-all duration-150"
            style={isEnum 
              ? getEnumHandleStyle(isDarkMode)
              : getHandleStyle('source', isPrimary || isUnique, isDarkMode)}
          />
        );

        return (
          <DatabaseSchemaTableRow 
            key={rowKey} 
            className={cn(
              "hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-150",
              duplicateInfo?.isDuplicate && "bg-yellow-50/30 dark:bg-yellow-900/20",
              isEnum && "bg-purple-50/30 dark:bg-purple-900/10"
            )}
          >
            <DatabaseSchemaTableCell className="pl-4 pr-2" leftHandle={leftHandle}>
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-medium">
                  {column.title}
                  {duplicateInfo?.isDuplicate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="inline-block ml-1 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-popover text-popover-foreground border">
                          <p>Column name duplicated in tables:</p>
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
              
            <DatabaseSchemaTableCell className="pr-4 text-muted-foreground" rightHandle={rightHandle}>
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
                  {column.type}
                </span>
              )}
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        );
      });
    }, [data.schema, duplicateRows, isDarkMode, mounted]);

    if (!mounted) {
      return (
        <DatabaseSchemaNode className="p-0 shadow-md">
          <DatabaseSchemaNodeHeader>
            <div className="w-full rounded-t-md py-2 px-3 font-medium bg-muted/20"
                style={{ 
                  borderBottom: `3px solid ${borderColor}` 
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
    
    // Use the memoized nodeStyle directly with a wrapping div to hold the ref
    return (
      <div 
        ref={nodeRef}
        className={`p-0 transition-all duration-200 ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`}
      >
        <DatabaseSchemaNode 
          className="p-0" 
          selected={selected}
        >
          <DatabaseSchemaNodeHeader>
            <div 
              className="w-full rounded-t-md py-2 px-3 font-medium node-header bg-card"
              style={nodeStyle}
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
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Optimize the equality check to reduce re-renders
    if (prevProps.selected !== nextProps.selected) return false;
    
    // Fast path check for color-only changes
    if ((prevProps.data as ExtendedSchemaNodeData)._colorUpdated !== 
        (nextProps.data as ExtendedSchemaNodeData)._colorUpdated &&
        prevProps.data.id === nextProps.data.id && 
        JSON.stringify(prevProps.data.color) !== JSON.stringify(nextProps.data.color)) {
      // Allow color updates but don't re-check the rest of the data
      return false;
    }
    
    // Compare data structure more efficiently
    const prevData = prevProps.data;
    const nextData = nextProps.data;
    
    if (prevData.label !== nextData.label) return false;
    if (prevData.id !== nextData.id) return false;
    
    // Schema length check
    if (prevData.schema?.length !== nextData.schema?.length) return false;
    
    // Check if duplicateRows has changed
    const prevDups = JSON.stringify(prevProps.duplicateRows || {});
    const nextDups = JSON.stringify(nextProps.duplicateRows || {});
    if (prevDups !== nextDups) return false;
    
    // Skip detailed schema comparison if only color changed
    if ((prevProps.data as ExtendedSchemaNodeData)._colorUpdated !== 
        (nextProps.data as ExtendedSchemaNodeData)._colorUpdated) {
      return true; // Schema didn't change, only color did
    }
    
    // Otherwise do the full deep comparison
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