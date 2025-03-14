import React, { useState, useCallback, useEffect } from 'react';
import { useReactFlow, Panel, Background, MiniMap, useKeyPress } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, Compass, Grid3X3, MapIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function FlowControls() {
  const { setViewport, zoomIn, zoomOut, fitView, getViewport, getNodes, toObject } = useReactFlow();
  const [showMinimap, setShowMinimap] = useState(false);
  const [backgroundPattern, setBackgroundPattern] = useState<'dots' | 'lines' | 'cross'>('dots');
  
  // Custom handler to pan to center with animation
  const handlePanToCenter = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
  }, [setViewport]);

  // Custom implementation of fitView with animation
  const handleFitView = useCallback(() => {
    fitView({ duration: 800, padding: 0.1 });
  }, [fitView]);
  
  // Toggle background pattern
  const toggleBackgroundPattern = useCallback(() => {
    setBackgroundPattern(current => {
      switch (current) {
        case 'dots': return 'lines';
        case 'lines': return 'cross';
        case 'cross': return 'dots';
        default: return 'dots';
      }
    });
  }, []);
  
  // Toggle minimap
  const toggleMinimap = useCallback(() => {
    setShowMinimap(prev => !prev);
  }, []);

  // Fixed keyboard shortcuts implementation
  // Replace the incorrectly configured useKeyPress hooks
  const fPressed = useKeyPress('f');
  const hPressed = useKeyPress('h');
  const mPressed = useKeyPress('m');
  const gPressed = useKeyPress('g');

  // React to key press state changes
  useEffect(() => {
    if (fPressed) handleFitView();
  }, [fPressed, handleFitView]);

  useEffect(() => {
    if (hPressed) handlePanToCenter();
  }, [hPressed, handlePanToCenter]);

  useEffect(() => {
    if (mPressed) toggleMinimap();
  }, [mPressed, toggleMinimap]);

  useEffect(() => {
    if (gPressed) toggleBackgroundPattern();
  }, [gPressed, toggleBackgroundPattern]);

  // Add global keyboard event listener as fallback
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target === document.body) { // Only trigger when not typing in an input
        switch (event.key.toLowerCase()) {
          case 'f':
            handleFitView();
            break;
          case 'h':
            handlePanToCenter();
            break;
          case 'm':
            toggleMinimap();
            break;
          case 'g':
            toggleBackgroundPattern();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleFitView, handlePanToCenter, toggleMinimap, toggleBackgroundPattern]);
  
  return (
    <>
      <Background 
        variant={backgroundPattern as any} 
        gap={20} 
        size={1} 
        color="var(--border-color)" 
        className="transition-all duration-300"
      />
      
      {showMinimap && (
        <MiniMap 
            nodeColor={(node) => (node.data?.color as string) || 'hsl(var(--primary))'}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="bg-background/95 border border-border rounded-md shadow-md"
          />
      )}
      
      <Panel position="top-right" className="custom-flow-controls">
        <div className="react-flow__controls">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => zoomIn({ duration: 800 })} 
                className="react-flow__controls-button"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom in</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => zoomOut({ duration: 800 })} 
                className="react-flow__controls-button"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Zoom out</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleFitView} 
                className="react-flow__controls-button"
                aria-label="Fit view"
              >
                <Maximize2 size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Fit view (F)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowMinimap(prev => !prev)} 
                className={`react-flow__controls-button ${showMinimap ? 'active-control' : ''}`}
                aria-label="Toggle minimap"
              >
                <MapIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Toggle minimap (M)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={toggleBackgroundPattern} 
                className="react-flow__controls-button"
                title="Change background (G)"
                aria-label="Change background"
              >
                <Grid3X3 size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Change background (G)</TooltipContent>
          </Tooltip>
          
        </div>
      </Panel>
    </>
  );
}
