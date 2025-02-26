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

export type DatabaseSchemaNodeData = {
  selected?: boolean;
  data: {
    label: string;
    schema: { title: string; type: string }[];
  };
};

const SchemaNode = memo(
  ({ data, selected }: DatabaseSchemaNodeData) => {
    return (
      <DatabaseSchemaNode 
        className={`p-0 transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'}`} 
        selected={selected}
      >
        <DatabaseSchemaNodeHeader >
          {data.label}
        </DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody >
          {data.schema.map((entry) => (
            <DatabaseSchemaTableRow 
              key={entry.title} 
              className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors duration-150 "
            >
              <Handle
                id={`target-${entry.title}`}
                type="target"
                position={Position.Left}
                className="!absolute transition-all duration-150 hover:scale-110"
                style={{
                  background: '#3b82f6',
                  width: '20px',
                  height: '20px',
                  border: '3px solid white',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.9)',
                  left: 0,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 9999, // Very high z-index to be on top of everything
                }}
              />
                
              <DatabaseSchemaTableCell className="pl-4 pr-6 font-medium">
                <span className="truncate text-xs font-medium">{entry.title}</span>
              </DatabaseSchemaTableCell>
                
              <DatabaseSchemaTableCell className="pr-4 text-muted-foreground">
                <span className="text-right truncate text-xs w-full italic opacity-80">{entry.type}</span>
              </DatabaseSchemaTableCell>
                
              <Handle
                id={`source-${entry.title}`}
                type="source"
                position={Position.Right}
                className="!absolute transition-all duration-150 hover:scale-110"
                style={{
                  background: '#10b981',
                  width: '20px',
                  height: '20px',
                  border: '3px solid white',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.9)',
                  right: 0,
                  top: '50%',
                  transform: 'translate(50%, -50%)',
                  zIndex: 9999, // Very high z-index to be on top of everything
                }}
              />
            </DatabaseSchemaTableRow>
          ))}
        </DatabaseSchemaNodeBody>
      </DatabaseSchemaNode>
    );
  }
);

// Add display name
SchemaNode.displayName = "SchemaNode";

export default SchemaNode;