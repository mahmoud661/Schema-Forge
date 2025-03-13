"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edge, useReactFlow } from "@xyflow/react";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../../store/sidebar-store";
import { useSchemaStore } from "@/hooks/use-schema";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

import { SourceTargetInfo } from "./source-target-info";
import { RelationshipLabelInput } from './relationship-label-input';
import { EdgeTypeSelector } from "./edge-type-selector";
import { AnimationToggle } from './animation-toggle';
import { RelationshipTypeSelector } from "./relationship-type-selector";
import { EdgeStyleControls } from './edge-style-controls';
import { EnumConnectionInfo } from "./enum-connection-info";
import { useEdgeUpdater } from './use-edge-updater';

// Add the following type alias to resolve the error
type RelationshipType = string;

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
  
  // Create ref for the sidebar element
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Set up click outside detection with improved flow canvas handling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const targetElement = event.target as HTMLElement;
      
      // Check if click was outside the sidebar
      const outsideSidebar = sidebarRef.current && !sidebarRef.current.contains(targetElement);
      
      // Check if click was on dropdown elements (we should ignore these)
      const isDropdownElement = 
        // Check for any dropdown related elements from shadcn/ui
        targetElement.closest('[role="dialog"]') || 
        targetElement.closest('[role="listbox"]') ||
        targetElement.closest('.select-content') ||
        targetElement.closest('.select-item') ||
        targetElement.closest('.select-viewport') ||
        targetElement.closest('[data-radix-popper-content-wrapper]') ||
        targetElement.classList.contains('select-item') ||
        // Check common Radix UI dropdown classes
        targetElement.closest('[data-state="open"]') ||
        targetElement.closest('[data-radix-portal]') ||
        // Check specific class names from the select component
        targetElement.classList.contains('radix-select');
      
      // Check if click was on canvas elements (but not on nodes or edges)
      const onFlowCanvas = (
        // Direct click on pane (background)
        targetElement.classList.contains('react-flow__pane') ||
        // Click on viewport
        targetElement.classList.contains('react-flow__viewport') ||
        // Click on attribution
        targetElement.classList.contains('react-flow__attribution') ||
        // Parent is a pane or viewport
        targetElement.parentElement?.classList.contains('react-flow__pane') ||
        targetElement.parentElement?.classList.contains('react-flow__viewport')
      );
      
      // Check if the click is NOT on an edge or node
      const notOnEdgeOrNode = (
        !targetElement.closest('.react-flow__edge') && 
        !targetElement.closest('.react-flow__node')
      );
      
      // Close if outside sidebar AND not on a dropdown AND (on canvas OR not on edge/node)
      if (outsideSidebar && !isDropdownElement && (onFlowCanvas || notOnEdgeOrNode)) {
        console.log('Closing sidebar - click detected on:', targetElement);
        onClose();
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Handle edge deletion
  const handleDeleteEdge = () => {
    if (!selectedEdge) return;
    
    // Get current edges
    const edges = reactFlowInstance.getEdges();
    
    // Remove the selected edge
    const newEdges = edges.filter(edge => edge.id !== selectedEdge.id);
    
    // Update the edges in ReactFlow
    reactFlowInstance.setEdges(newEdges);
    
    // Close the sidebar
    onClose();
  };

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
    localAnimated, // Use the local animated state
    currentStrokeWidth,
    handleLabelChange,
    handleTypeChange,
    handleAnimatedChange,
    handleRelationshipTypeChange,
    handleColorChange,
    handleColorComplete,
    handleManualColorInput,
    handleStyleChange,
    getRelationshipType,
    localRelationshipType  // new
  } = useEdgeUpdater(selectedEdge, onUpdateEdge, sourceNode, targetNode, sourceColumn, targetColumn);

  return (
    <div ref={sidebarRef}>
      <BaseSidebar 
        title="Edge Properties" 
        onClose={onClose}
        width={widths.edge}
        onWidthChange={(width) => updateWidth("edge", width)}
        showClose={true}
        position="right" 
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
                checked={localAnimated} // Use local state instead of reading directly from edge
                onChange={handleAnimatedChange}
              />

              <RelationshipTypeSelector
                selectedType={localRelationshipType}
                onTypeChange={(type:any) => handleRelationshipTypeChange(type)}
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
          
          {/* Delete Button - added at the bottom */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="destructive" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDeleteEdge}
            >
              <Trash2 size={16} />
              Delete Connection
            </Button>
          </div>
        </div>
      </BaseSidebar>
    </div>
  );
}
