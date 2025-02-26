"use client";

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchemaNodeProps {
  id: string;
  data: {
    label: string;
    schema: {
      title: string;
      type: string;
    }[];
  };
  selected: boolean;
}

export default function SchemaNode({ id, data, selected }: SchemaNodeProps) {
  return (
    <Card className={`w-64 shadow-md ${selected ? 'border-primary border-2' : ''}`}>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium">{data.label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-xs space-y-1.5">
          {data.schema.map((field, idx) => (
            <div key={idx} className="flex justify-between items-center border-b pb-1">
              <div className="font-medium">{field.title}</div>
              <div className="text-muted-foreground">{field.type}</div>
              
              {/* Add source/target handles for connecting tables */}
              <Handle
                id={field.title}
                type="source"
                position={Position.Right}
                style={{ 
                  background: '#555', 
                  width: 10, 
                  height: 10,
                  right: -5,
                  top: '50%'
                }}
              />
              
              {field.type === 'uuid' && (
                <Handle
                  id={field.title}
                  type="target"
                  position={Position.Left}
                  style={{ 
                    background: '#555', 
                    width: 10, 
                    height: 10,
                    left: -5,
                    top: '50%'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}