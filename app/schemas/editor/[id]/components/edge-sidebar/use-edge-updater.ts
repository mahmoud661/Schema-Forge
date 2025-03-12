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

  // Add local relationship type state
  const [localRelationshipType, setLocalRelationshipType] = useState<string>(
    selectedEdge.data?.relationshipType || getRelationshipType()
  );
  
  // Update local states whenever selected edge changes
  useEffect(() => {
    setLocalColor((selectedEdge.style?.stroke as string) || '#3b82f6');
    setLocalDisplayType(selectedEdge.data?.displayType || 'smoothstep');
    setLocalLabel(typeof selectedEdge.label === 'string' ? selectedEdge.label : '');
    setLocalAnimated(selectedEdge.animated || false);
    setLocalRelationshipType(selectedEdge.data?.relationshipType || getRelationshipType());
  }, [
    selectedEdge.id, 
    selectedEdge.style?.stroke, 
    selectedEdge.data,
    selectedEdge.label,
    selectedEdge.animated,
    selectedEdge.data?.displayType,
    selectedEdge.data?.relationshipType
  ]);
  
  // Label change handler
  const handleLabelChange = useCallback((value: string) => {
    setLocalLabel(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      label: value,
      // Preserve other properties
      animated: localAnimated,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localDisplayType]);

  // Type change handler - preserve animated state and stroke color
  const handleTypeChange = useCallback((value: string) => {
    setLocalDisplayType(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: localAnimated,
      label: localLabel,
      data: {
        ...selectedEdge.data,
        displayType: value,
      },
      style: {
        ...selectedEdge.style,
        stroke: localColor,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localColor]);

  // Animation toggle handler - preserve display type
  const handleAnimatedChange = useCallback((value: boolean) => {
    setLocalAnimated(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: value,
      label: localLabel,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType
      }
    });
  }, [selectedEdge, onUpdateEdge, localDisplayType, localLabel]);

  // Relationship type change handler
  const handleRelationshipTypeChange = useCallback((value: string) => {
    setLocalRelationshipType(value);
    const currentStyle = selectedEdge.style || {};
    
    const markers = value === 'enumType' ? 
      relationshipMarkers.enumType : 
      relationshipMarkers[value];
    
    const baseStyle = value === 'enumType' ? 
      relationshipStyles.enumType : 
      relationshipStyles[value];
      
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: localAnimated,
      label: localLabel,
      data: { 
        ...selectedEdge.data, 
        relationshipType: value,
        displayType: localDisplayType
      },
      style: {
        ...currentStyle,
        ...baseStyle,  // Apply stroke width and basic styles
        ...markers,    // Apply the markers separately
        // Keep existing stroke color unless it's an enum
        stroke: value === 'enumType' ? '#a855f7' : localColor,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localDisplayType, localColor]);

  // Color change handlers
  const handleColorChange = useCallback((value: string) => {
    setLocalColor(value);
  }, []);
  
  // Update color without modifying displayType
  const handleColorComplete = useCallback(() => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: localAnimated,
      label: localLabel,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType, // preserve current displayType
      },
      style: {
        ...currentStyle,
        stroke: localColor,
      },
    });
  }, [selectedEdge, onUpdateEdge, localColor, localAnimated, localLabel, localDisplayType]);
  
  const handleManualColorInput = useCallback((value: string) => {
    setLocalColor(value);
    setTimeout(() => {
      const currentStyle = selectedEdge.style || {};
      onUpdateEdge(selectedEdge.id, {
        ...selectedEdge,
        animated: localAnimated,
        label: localLabel,
        data: {
          ...selectedEdge.data,
          displayType: localDisplayType, // preserve current displayType
        },
        style: {
          ...currentStyle,
          stroke: value,
        },
      });
    }, 300);
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localDisplayType]);
  
  // Style property change handler
  const handleStyleChange = useCallback((property: string, value: string | number) => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: localAnimated,
      label: localLabel,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType
      },
      style: {
        ...currentStyle,
        [property]: value,
      },
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localDisplayType]);

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
    getRelationshipType,
    // Return the local relationship type state
    localRelationshipType
  };
}
