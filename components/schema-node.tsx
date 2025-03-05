"use client";

import { memo } from "react";
import { Position, Handle } from "@xyflow/react";
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

const getHandleStyle = (type: 'source' | 'target', hasConstraints: boolean = false) => ({
  background: type === 'source' ? '#10b981' : '#3b82f6',
  border: '2px solid white',
  boxShadow: `0 0 10px ${type === 'source' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.9)'}`,
  opacity: hasConstraints ? 1 : 0.5,
});

interface DuplicateInfo {
  isDuplicate: boolean;
  tables: string[];
}

// Function to generate a unique color based on string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const SchemaNode = memo(
  ({ data, selected, duplicateColumns }: { 
    data: SchemaNodeData; 
    selected?: boolean;
    duplicateColumns?: Record<string, DuplicateInfo>;
  }) => {
    const headerColor = stringToColor(data.label);
    
    return (
      <DatabaseSchemaNode 
        className={`p-0 transition-all duration-200 ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`} 
        selected={selected}
      >
        <DatabaseSchemaNodeHeader>
          <div 
            className="w-full rounded-t-md py-2 px-3 font-medium"
            style={{ 
              backgroundColor: `${headerColor}20`,
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
              ...getHandleStyle('target', true),
              top: -8,
              opacity: 0.5,
              width: '16px',
              height: '16px',
            }}
          />
        </DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody>
          {data.schema.map((column: ColumnSchema, idx) => {
            const constraints = column.constraints || [];
            const isPrimary = constraints.includes('primary');
            const isUnique = constraints.includes('unique');
            const isNotNull = constraints.includes('notnull');
            const isIndex = constraints.includes('index');
            const duplicateInfo = duplicateColumns?.[column.title];
            
            const columnKey = column.id || `${idx}-${column.title}`;

            return (
              <DatabaseSchemaTableRow 
                key={columnKey} 
                className="hover:bg-primary/5 transition-colors duration-150"
              >
                <Handle
                  id={`target-${column.title}`}
                  type="target"
                  position={Position.Left}
                  className="!absolute transition-all duration-150"
                  style={getHandleStyle('target', isPrimary || isUnique)}
                />
                  
                <DatabaseSchemaTableCell className="pl-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">
                      {column.title}
                      {duplicateInfo?.isDuplicate && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="inline-block ml-1 h-4 w-4 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
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
                    </div>
                  </div>
                </DatabaseSchemaTableCell>
                  
                <DatabaseSchemaTableCell className="pr-4 text-muted-foreground">
                  <span className="text-right truncate text-xs w-full italic opacity-80">
                    {column.type}
                  </span>
                </DatabaseSchemaTableCell>
                  
                <Handle
                  id={`source-${column.title}`}
                  type="source"
                  position={Position.Right}
                  className="!absolute transition-all duration-150"
                  style={getHandleStyle('source', isPrimary || isUnique)}
                />
              </DatabaseSchemaTableRow>
            );
          })}
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaNode>
    );
  },
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) && 
           prevProps.selected === nextProps.selected &&
           JSON.stringify(prevProps.duplicateColumns) === JSON.stringify(nextProps.duplicateColumns);
  }
);

SchemaNode.displayName = "SchemaNode";

export default SchemaNode;