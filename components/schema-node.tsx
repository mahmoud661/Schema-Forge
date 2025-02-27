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

const getHandleStyle = (type: 'source' | 'target', hasConstraints: boolean = false) => ({
  background: type === 'source' ? '#10b981' : '#3b82f6',
  width: '12px',
  height: '12px',
  border: '2px solid white',
  boxShadow: `0 0 10px ${type === 'source' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.9)'}`,
  opacity: hasConstraints ? 1 : 0.5,
});

const SchemaNode = memo(
  ({ data, selected }: { data: SchemaNodeData; selected?: boolean }) => {
    return (
      <DatabaseSchemaNode 
        className={`p-0 transition-all duration-200 ${selected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`} 
        selected={selected}
      >
        <DatabaseSchemaNodeHeader>
          {data.label}
        </DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody>
          {data.schema.map((column: ColumnSchema, idx) => {
            const constraints = column.constraints || [];
            const isPrimary = constraints.includes('primary');
            const isUnique = constraints.includes('unique');
            const isNotNull = constraints.includes('notnull');
            const isIndex = constraints.includes('index');
            
            // Use a stable key for each column
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
                  className="!absolute transition-all duration-150 hover:scale-110"
                  style={getHandleStyle('target', isPrimary || isUnique)}
                />
                  
                <DatabaseSchemaTableCell className="pl-4 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">{column.title}</span>
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
                  className="!absolute transition-all duration-150 hover:scale-110"
                  style={getHandleStyle('source', isPrimary || isUnique)}
                />
              </DatabaseSchemaTableRow>
            );
          })}
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaNode>
    );
  },
  // Add a custom comparison function to ensure updates happen when needed
  (prevProps, nextProps) => {
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) && 
           prevProps.selected === nextProps.selected;
  }
);

SchemaNode.displayName = "SchemaNode";

export default SchemaNode;