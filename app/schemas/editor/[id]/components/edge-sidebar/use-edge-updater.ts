import { useState, useEffect, useCallback } from "react";
import { Edge } from "@xyflow/react";
import { relationshipStyles, relationshipMarkers } from "@/components/ui/custom-edge";

export function useEdgeUpdater(
  selectedEdge: Edge,
  onUpdateEdge: (edgeId: string, data: any) => void,
  sourceNode?: any,
  targetNode?: any,
  sourceColumn?: string,
  targetColumn?: string
) {
  // Local state for color to avoid excessive edge updates
  const [localColor, setLocalColor] = useState<string>(
    (selectedEdge.style?.stroke as string) || '#3b82f6'
  );
  
  // Track current display type in local state to ensure UI updates
  const [localDisplayType, setLocalDisplayType] = useState<string>(
    selectedEdge.data?.displayType || 'smoothstep'
  );

  // Add local state for the label
  const [localLabel, setLocalLabel] = useState<string>(
    typeof selectedEdge.label === 'string' ? selectedEdge.label : ''
  );
  
  // Add local state for animation toggle
  const [localAnimated, setLocalAnimated] = useState<boolean>(
    selectedEdge.animated || false
  );
  
  // Update local states whenever selected edge changes
  useEffect(() => {
    setLocalColor((selectedEdge.style?.stroke as string) || '#3b82f6');
    setLocalDisplayType(selectedEdge.data?.displayType || 'smoothstep');
    setLocalLabel(typeof selectedEdge.label === 'string' ? selectedEdge.label : '');
    setLocalAnimated(selectedEdge.animated || false);
  }, [
    selectedEdge.id, 
    selectedEdge.style?.stroke, 
    selectedEdge.data,
    selectedEdge.label,
    selectedEdge.animated,
    selectedEdge.data?.displayType,
    selectedEdge.data?.relationshipType
  ]);
  
  // Get current stroke width safely
  const currentStrokeWidth = selectedEdge.style?.strokeWidth as number || 2;

  // Determine relationship type based on constraints
  const getRelationshipType = useCallback(() => {
    if (!sourceNode || !targetNode || !sourceColumn || !targetColumn) {
      return 'oneToMany'; // default
    }

    const sourceRow = sourceNode.data.schema.find((r: any) => r.title === sourceColumn);
    const targetRow = targetNode.data.schema.find((r: any) => r.title === targetColumn);

    const isSourceUnique = sourceRow?.constraints?.includes('unique') || sourceRow?.constraints?.includes('primary');
    const isTargetUnique = targetRow?.constraints?.includes('unique') || targetRow?.constraints?.includes('primary');

    if (isSourceUnique && isTargetUnique) return 'oneToOne';
    if (isSourceUnique && !isTargetUnique) return 'oneToMany';
    if (!isSourceUnique && isTargetUnique) return 'manyToOne';
    return 'manyToMany';
  }, [sourceNode, targetNode, sourceColumn, targetColumn]);

  // Label change handler
  const handleLabelChange = useCallback((value: string) => {
    setLocalLabel(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      label: value,
    });
  }, [selectedEdge, onUpdateEdge]);

  // Type change handler - preserve animated state using localAnimated
  const handleTypeChange = useCallback((value: string) => {
    setLocalDisplayType(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      // Use local animated state instead of selectedEdge.animated
      animated: localAnimated,
      data: {
        ...selectedEdge.data,
        displayType: value,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated]); // Add localAnimated to dependencies

  // Animation toggle handler - preserve display type
  const handleAnimatedChange = useCallback((value: boolean) => {
    setLocalAnimated(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: value,
      // Explicitly preserve the display type when toggling animation
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType
      }
    });
  }, [selectedEdge, onUpdateEdge, localDisplayType]); // Add localDisplayType to dependencies

  // Relationship type change handler
  const handleRelationshipTypeChange = useCallback((value: string) => {
    const currentStyle = selectedEdge.style || {};
    
    const markers = value === 'enumType' ? 
      relationshipMarkers.enumType : 
      relationshipMarkers[value];
    
    const baseStyle = value === 'enumType' ? 
      relationshipStyles.enumType : 
      relationshipStyles[value];
      
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      data: { ...selectedEdge.data, relationshipType: value },
      style: {
        ...currentStyle,
        ...baseStyle,  // Apply stroke width and basic styles
        ...markers,    // Apply the markers separately
        // Keep existing stroke color unless it's an enum
        stroke: value === 'enumType' ? '#a855f7' : currentStyle.stroke,
      }
    });
  }, [selectedEdge, onUpdateEdge]);

  // Color change handlers
  const handleColorChange = useCallback((value: string) => {
    setLocalColor(value);
  }, []);
  
  const handleColorComplete = useCallback(() => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      style: {
        ...currentStyle,
        stroke: localColor,
      },
    });
  }, [selectedEdge, onUpdateEdge, localColor]);
  
  const handleManualColorInput = useCallback((value: string) => {
    setLocalColor(value);
    setTimeout(() => {
      const currentStyle = selectedEdge.style || {};
      onUpdateEdge(selectedEdge.id, {
        ...selectedEdge,
        style: {
          ...currentStyle,
          stroke: value,
        },
      });
    }, 300);
  }, [selectedEdge, onUpdateEdge]);
  
  // Style property change handler
  const handleStyleChange = useCallback((property: string, value: string | number) => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      style: {
        ...currentStyle,
        [property]: value,
      },
    });
  }, [selectedEdge, onUpdateEdge]);

  return {
    localLabel,
    localColor,
    localDisplayType,
    localAnimated, // Add this to returned values
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
  };
}
