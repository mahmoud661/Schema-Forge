"use client";

import React, { useState, useEffect } from "react";
import { Edge, useReactFlow } from "@xyflow/react";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../../store/sidebar-store";
import { useSchemaStore } from "@/hooks/use-schema";

import { SourceTargetInfo } from './source-target-info';
import { RelationshipLabelInput } from './relationship-label-input';
import { EdgeTypeSelector } from './edge-type-selector';
import { AnimationToggle } from './animation-toggle';
import { RelationshipTypeSelector } from './relationship-type-selector';
import { EdgeStyleControls } from './edge-style-controls';
import { EnumConnectionInfo } from './enum-connection-info';
import { useEdgeUpdater } from './use-edge-updater';

interface EdgeSidebarProps {
  selectedEdge: Edge | null;
  onUpdateEdge: (edgeId: string, data: any) => void;
  onClose: () => void;
}

export function EdgeSidebar({ selectedEdge, onUpdateEdge, onClose }: EdgeSidebarProps) {
  if (!selectedEdge) return null;
  
  const reactFlowInstance = useReactFlow();
  const { widths, updateWidth } = useSidebarStore();
  const { schema } = useSchemaStore();
  const { nodes } = schema;
  
  // Determine if this is an enum connection
  const isEnumConnection = selectedEdge.data?.connectionType === 'enum';
  
  // Get source and target nodes
  const sourceNode = nodes.find(n => n.id === selectedEdge.source);
  const targetNode = nodes.find(n => n.id === selectedEdge.target);
  
  // Get source and target columns
  const sourceColumn = selectedEdge.sourceHandle?.replace('source-', '');
  const targetColumn = selectedEdge.targetHandle?.replace('target-', '');
  
  // Custom hook to manage edge updates and local state
  const { 
    localLabel,
    localColor,
    localDisplayType,
    currentStrokeWidth,
    handleLabelChange,
    handleTypeChange,
    handleAnimatedChange,
    handleRelationshipTypeChange,
    handleColorChange,
    handleColorComplete,
    handleManualColorInput,
    handleStyleChange,
    getRelationshipType
  } = useEdgeUpdater(selectedEdge, onUpdateEdge, sourceNode, targetNode, sourceColumn, targetColumn);

  return (
    <BaseSidebar 
      title="Edge Properties" 
      onClose={onClose}
      width={widths.edge}
      onWidthChange={(width) => updateWidth("edge", width)}
      showClose={true}
    >
      <div className="p-4 space-y-4">
        <SourceTargetInfo 
          sourceNode={sourceNode}
          targetNode={targetNode}
          sourceColumn={sourceColumn}
          targetColumn={targetColumn}
        />

        {!isEnumConnection && (
          <>
            <RelationshipLabelInput
              value={localLabel}
              onChange={handleLabelChange}
            />

            <EdgeTypeSelector
              selectedType={localDisplayType}
              onTypeChange={handleTypeChange}
            />

            <AnimationToggle
              checked={selectedEdge.animated || false}
              onChange={handleAnimatedChange}
            />

            <RelationshipTypeSelector
              selectedType={selectedEdge.data?.relationshipType || getRelationshipType()}
              onTypeChange={handleRelationshipTypeChange}
            />

            <EdgeStyleControls
              color={localColor}
              strokeWidth={currentStrokeWidth}
              onColorChange={handleColorChange}
              onColorComplete={handleColorComplete}
              onManualColorInput={handleManualColorInput}
              onStrokeWidthChange={handleStyleChange}
            />
          </>
        )}

        {isEnumConnection && <EnumConnectionInfo />}
      </div>
    </BaseSidebar>
  );
}
