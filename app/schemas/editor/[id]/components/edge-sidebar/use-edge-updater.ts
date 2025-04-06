import { useState, useEffect, useCallback } from "react";
import { Edge } from "@xyflow/react";
import { relationshipStyles, relationshipMarkers } from "@/components/ui/custom-edge";

type RelationshipType = 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany' | 'enumType';

export function useEdgeUpdater(
  selectedEdge: Edge,
  onUpdateEdge: (edgeId: string, data: any) => void,
  sourceNode?: any,
  targetNode?: any,
  sourceColumn?: string,
  targetColumn?: string
) {
  const [localColor, setLocalColor] = useState<string>(
    (selectedEdge.style?.stroke as string) || '#3b82f6'
  );
  
  const initialDisplayType = typeof selectedEdge.data?.displayType === 'string' 
    ? selectedEdge.data.displayType 
    : 'smoothstep';
  const [localDisplayType, setLocalDisplayType] = useState<string>(initialDisplayType);

  const [localLabel, setLocalLabel] = useState<string>(
    typeof selectedEdge.label === 'string' ? selectedEdge.label : ''
  );
  
  const [localAnimated, setLocalAnimated] = useState<boolean>(
    selectedEdge.animated || false
  );
  
  const currentStrokeWidth = selectedEdge.style?.strokeWidth as number || 2;

  const getRelationshipType = useCallback((): RelationshipType => {
    if (!sourceNode || !targetNode || !sourceColumn || !targetColumn) {
      return 'oneToMany';
    }
    
    if (!sourceNode.data?.schema || !targetNode.data?.schema) {
      return 'oneToMany';
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

  const initialRelationshipType: RelationshipType = 
    typeof selectedEdge.data?.relationshipType === 'string'
      ? selectedEdge.data.relationshipType as RelationshipType
      : getRelationshipType();
  const [localRelationshipType, setLocalRelationshipType] = useState<RelationshipType>(initialRelationshipType);
  
  useEffect(() => {
    setLocalColor((selectedEdge.style?.stroke as string) || '#3b82f6');
    setLocalDisplayType(typeof selectedEdge.data?.displayType === 'string' 
      ? selectedEdge.data.displayType 
      : 'smoothstep');
    setLocalLabel(typeof selectedEdge.label === 'string' ? selectedEdge.label : '');
    setLocalAnimated(selectedEdge.animated || false);
    setLocalRelationshipType(
      typeof selectedEdge.data?.relationshipType === 'string'
        ? selectedEdge.data.relationshipType as RelationshipType
        : getRelationshipType()
    );
  }, [
    selectedEdge.id, 
    selectedEdge.style?.stroke, 
    selectedEdge.data,
    selectedEdge.label,
    selectedEdge.animated,
    selectedEdge.data?.displayType,
    selectedEdge.data?.relationshipType
  ]);
  
  const handleLabelChange = useCallback((value: string) => {
    setLocalLabel(value);
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      label: value,
      animated: localAnimated,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localDisplayType]);

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

  const handleRelationshipTypeChange = useCallback((value: RelationshipType) => {
    setLocalRelationshipType(value);
    const currentStyle = selectedEdge.style || {};
    
    const markers = value === 'enumType' ? 
      relationshipMarkers.enumType : 
      relationshipMarkers[value as keyof typeof relationshipMarkers];
    
    const baseStyle = value === 'enumType' ? 
      relationshipStyles.enumType : 
      relationshipStyles[value as keyof typeof relationshipStyles];
      
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
        ...baseStyle,
        ...markers,
        stroke: value === 'enumType' ? '#a855f7' : localColor,
      }
    });
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localDisplayType, localColor]);

  const handleColorChange = useCallback((value: string) => {
    setLocalColor(value);
  }, []);
  
  const handleColorComplete = useCallback(() => {
    const currentStyle = selectedEdge.style || {};
    onUpdateEdge(selectedEdge.id, {
      ...selectedEdge,
      animated: localAnimated,
      label: localLabel,
      data: {
        ...selectedEdge.data,
        displayType: localDisplayType,
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
          displayType: localDisplayType,
        },
        style: {
          ...currentStyle,
          stroke: value,
        },
      });
    }, 300);
  }, [selectedEdge, onUpdateEdge, localAnimated, localLabel, localDisplayType]);
  
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
    localAnimated,
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
    localRelationshipType
  };
}
