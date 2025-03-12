import React from 'react';

interface SourceTargetInfoProps {
  sourceNode: any;
  targetNode: any;
  sourceColumn: string | undefined;
  targetColumn: string | undefined;
}

export function SourceTargetInfo({ sourceNode, targetNode, sourceColumn, targetColumn }: SourceTargetInfoProps) {
  return (
    <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
      <div className="text-xs text-muted-foreground">
        <strong>From:</strong> {sourceNode?.data.label}.{sourceColumn}
      </div>
      <div className="text-xs text-muted-foreground">
        <strong>To:</strong> {targetNode?.data.label}.{targetColumn}
      </div>
    </div>
  );
}
