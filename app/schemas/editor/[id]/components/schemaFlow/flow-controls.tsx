import React from 'react';
import { useReactFlow, Panel, Background } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export function FlowControls() {
  const { setViewport, zoomIn, zoomOut, fitView } = useReactFlow();
  
  // Custom handler to pan to center with animation
  const handlePanToCenter = () => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  };

  // Custom implementation of fitView with animation
  const handleFitView = () => {
    fitView({ duration: 800, padding: 0.1 });
  };
  
  return (
    <>
      <Background />
      <Panel position="top-right" className="custom-flow-controls">
        <div className="react-flow__controls">
          <button 
            onClick={() => zoomIn({ duration: 800 })} 
            className="react-flow__controls-button"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          
          <button 
            onClick={() => zoomOut({ duration: 800 })} 
            className="react-flow__controls-button"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          
          <button 
            onClick={handleFitView} 
            className="react-flow__controls-button"
            title="Fit view"
            aria-label="Fit view"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </Panel>
    </>
  );
}
