import { BaseEdge, EdgeProps, getStraightPath, getBezierPath, getSimpleBezierPath, getSmoothStepPath } from '@xyflow/react';
import { useTheme } from 'next-themes';
import React from 'react';
// Separate marker definitions from other style properties
export const relationshipMarkers = {
  oneToOne: {
    markerStart: 'url(#one-required)',
    markerEnd: 'url(#one-required)',
  },
  oneToMany: {
    markerStart: 'url(#one-required)',
    markerEnd: 'url(#many-required)',
  },
  manyToOne: {
    markerStart: 'url(#many-required)',
    markerEnd: 'url(#one-required)',
  },
  manyToMany: {
    markerStart: 'url(#many-required)',
    markerEnd: 'url(#many-required)',
  },
  // For enum relationships
  enumType: {
    markerEnd: 'url(#enum-required)',
  }
};

// Default visual styles without markers
export const relationshipStyles = {
  oneToOne: {
    strokeWidth: 2,
  },
  oneToMany: {
    strokeWidth: 2,
  },
  manyToOne: {
    strokeWidth: 2,
  },
  manyToMany: {
    strokeWidth: 2,
  },
  // For enum relationships
  enumType: {
    strokeWidth: 2,
    stroke: '#a855f7',
  }
};

export function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  id,
  label,
}: EdgeProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  // Get path based on the edge type - prioritize data.displayType over the type prop
  const displayType = data?.displayType || 'smoothstep'; // Default to smoothstep if not set

  // Calculate the path for the edge based on the display type
  let edgePath: string = '';
  let labelX: number = 0;
  let labelY: number = 0;
  const pathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  // Use our displayType for path calculation and also calculate label position
  if (displayType === 'straight') {
    [edgePath] = getStraightPath(pathParams);
    // For straight lines, label position is simply the midpoint
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } 
  else if (displayType === 'step') {
    [edgePath] = getSmoothStepPath({
      ...pathParams,
      borderRadius: 0,
    });
    // For step lines, approximate the center
    labelX = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  }
  else if (displayType === 'bezier') {
    // getBezierPath returns [path, labelX, labelY, offsetX, offsetY]
    const [path, bezierLabelX, bezierLabelY] = getBezierPath(pathParams);
    
    edgePath = path;
    // Use the labelX and labelY values directly from getBezierPath
    labelX = bezierLabelX;
    labelY = bezierLabelY;
  }
  else if (displayType === 'simplebezier') {
    // getSimpleBezierPath also returns position information
    const [path, simpleBezierLabelX, simpleBezierLabelY] = getSimpleBezierPath(pathParams);
    
    edgePath = path;
    labelX = simpleBezierLabelX;
    labelY = simpleBezierLabelY;
  }
  else {
    // Default to smoothstep
    // getSmoothStepPath also returns label position data
    const [path, smoothLabelX, smoothLabelY] = getSmoothStepPath(pathParams);
    
    edgePath = path;
    labelX = smoothLabelX;
    labelY = smoothLabelY;
  }

  // Determine relationship type from data, cast to a key of relationshipStyles/relationshipMarkers
  const relationshipType = (data?.relationshipType || 'oneToMany') as keyof typeof relationshipStyles;
  const isEnum = data?.connectionType === 'enum';

  // Get base style and markers for the relationship type
  const baseStyle = isEnum ? relationshipStyles.enumType : relationshipStyles[relationshipType];
  const markers = isEnum ? relationshipMarkers.enumType : relationshipMarkers[relationshipType];

  // Combine with custom style, markers, and selected state
  const edgeStyle = {
    ...baseStyle,
    ...markers, // Apply markers
    ...style,
    stroke: isEnum ? '#a855f7' : (style.stroke || (isDarkMode ? '#60a5fa' : '#3b82f6')),
    ...selected && {
      stroke: isEnum ? '#c084fc' : (isDarkMode ? '#93c5fd' : '#60a5fa'),
      strokeWidth: (baseStyle.strokeWidth || 2) + 1,
    },
  };

  // Determine the actual color of the edge for the markers
  const edgeColor = edgeStyle.stroke as string;

  return (
    <>
      <BaseEdge path={edgePath} style={edgeStyle} />
      
      {/* Add label if present with additional checks for valid coordinates */}
      {label && !isNaN(labelX) && !isNaN(labelY) && (
        <foreignObject
          width="200"
          height="40"
          x={labelX - 100}
          y={labelY - 20}
          className="edge-label-container"
          style={{
            pointerEvents: 'none', // Let mouse events pass through to the edge
            overflow: 'visible',
          }}
        >
          <div
            style={{
              background: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              padding: '3px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 500,
              textAlign: 'center',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              userSelect: 'none',
              border: '1px solid',
              borderColor: isDarkMode ? 'rgba(100, 116, 139, 0.4)' : 'rgba(203, 213, 225, 0.6)',
              color: isDarkMode ? '#e2e8f0' : '#334155',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
      
      {/* Define smaller markers that inherit edge color */}
      <defs>
        {/* One (required) - Simple vertical line, smaller */}
        <marker
          id="one-required"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <line
            x1="4"
            y1="1"
            x2="4"
            y2="7"
            stroke={edgeColor} // Use edge color
            strokeWidth="1.5"
          />
        </marker>

        {/* Many (required) - Three parallel vertical lines, smaller */}
        <marker
          id="many-required"
          viewBox="0 0 8 8"
          refX="8"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <line
            x1="2"
            y1="1"
            x2="2"
            y2="7"
            stroke={edgeColor} // Use edge color
            strokeWidth="1.2"
          />
          <line
            x1="4"
            y1="1"
            x2="4"
            y2="7"
            stroke={edgeColor} // Use edge color
            strokeWidth="1.2"
          />
          <line
            x1="6"
            y1="1"
            x2="6"
            y2="7"
            stroke={edgeColor} // Use edge color
            strokeWidth="1.2"
          />
        </marker>

        {/* Enum marker - Simplified circle, smaller */}
        <marker
          id="enum-required"
          viewBox="0 0 12 12"
          refX="6"
          refY="6"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          {/* Diamond shape for enum */}
          <path
            d="M 6 1 L 11 6 L 6 11 L 1 6 Z"
            fill="#a855f7"
            stroke="#a855f7"
            strokeWidth="1"
          />
        </marker>
      </defs>
    </>
  );
}