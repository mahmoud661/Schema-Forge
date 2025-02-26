"use client";

import { memo } from "react";
import { Position } from "@xyflow/react";
import { LabeledHandle } from "@/components/labeled-handle";
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
      <DatabaseSchemaNode className="p-0" selected={selected}>
        <DatabaseSchemaNodeHeader>{data.label}</DatabaseSchemaNodeHeader>
        <DatabaseSchemaNodeBody>
          {data.schema.map((entry) => (
            <DatabaseSchemaTableRow key={entry.title} className="hover:bg-muted/70">
              <DatabaseSchemaTableCell className="pl-0 pr-6 font-medium relative">
                <LabeledHandle
                  id={entry.title}
                  title={entry.title}
                  type="target"
                  position={Position.Left}
                  handleClassName="hover:bg-blue-500 hover:scale-125 transition-all"
                />
              </DatabaseSchemaTableCell>
              <DatabaseSchemaTableCell className="pr-0 text-muted-foreground relative">
                <LabeledHandle
                  id={entry.title}
                  title={entry.type}
                  type="source"
                  position={Position.Right}
                  className="justify-end"
                  handleClassName="hover:bg-green-500 hover:scale-125 transition-all"
                  labelClassName="w-full text-right"
                />
              </DatabaseSchemaTableCell>
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