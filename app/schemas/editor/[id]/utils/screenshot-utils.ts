import { toPng } from 'html-to-image';
import { ReactFlowInstance, getNodesBounds } from '@xyflow/react';

interface ScreenshotSettings {
  quality: number;         // 1-4, where 4 is highest quality
  padding: number;         // 0-0.5, padding around nodes
  transparent: boolean;    // transparent background or white
  includeControls: boolean; // include ReactFlow controls in screenshot
  zoomLevel: number;       // 0.5-3, custom zoom level for the screenshot
  fillCanvas: boolean;     // whether to fill the entire canvas with the schema
}

interface ScreenshotOptions {
  reactFlowInstance: ReactFlowInstance;
  fileName?: string;
  settings?: ScreenshotSettings;
}

// Default dimensions for the exported image
const baseWidth = 1920;
const baseHeight = 1080;

// Function to handle the download of the image
function downloadImage(dataUrl: string, fileName: string = 'schema') {
  const a = document.createElement('a');
  a.setAttribute('download', `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
  a.setAttribute('href', dataUrl);
  a.click();
}

/**
 * Captures a screenshot of the schema diagram
 */
export async function captureScreenshot({
  reactFlowInstance,
  fileName = 'schema',
  settings = {
    quality: 2,
    padding: 0.25,
    transparent: false,
    includeControls: false,
    zoomLevel: 1.2,
    fillCanvas: true,
  }
}: ScreenshotOptions): Promise<void> {
  try {
    // Get all nodes
    const nodes = reactFlowInstance.getNodes();
    if (nodes.length === 0) {
      throw new Error("No schema elements found to capture");
    }
    
    // Small delay to ensure UI updates complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get the viewport element to capture
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) {
      throw new Error("Cannot find diagram to capture");
    }

    // Calculate bounds of all nodes
    const nodesBounds = getNodesBounds(nodes);
    
    // Calculate dimensions with fixed aspect ratio (16:9)
    let imageWidth = baseWidth;
    let imageHeight = baseHeight; 
    
    // Get the aspect ratio of the bounds
    const boundsWidth = Math.max(nodesBounds.width, 500);
    const boundsHeight = Math.max(nodesBounds.height, 400);
    
    // Add extra padding for better visual appearance
    const paddingFactor = settings.padding * 2 + 1; // Convert from percentage to factor
    
    // Use the zoom level setting to determine the scale
    const customScale = settings.zoomLevel;
    
    // Calculate center point of nodes
    const centerX = nodesBounds.x + nodesBounds.width / 2;
    const centerY = nodesBounds.y + nodesBounds.height / 2;
    
    // Calculate the viewport transformation that centers the nodes
    const viewport = {
      x: imageWidth / 2 - centerX * customScale,
      y: imageHeight / 2 - centerY * customScale,
      zoom: customScale
    };
    
    // Size the image for better fitting if fill canvas is enabled
    if (settings.fillCanvas) {
      // Determine if we should fit to width or height
      const widthRatio = boundsWidth / imageWidth;
      const heightRatio = boundsHeight / imageHeight;
      
      if (widthRatio > heightRatio) {
        // Schema is wider than tall relative to our target size
        // Fit to width with padding
        viewport.zoom = (imageWidth * 0.85) / (boundsWidth * paddingFactor);
      } else {
        // Schema is taller than wide relative to our target size
        // Fit to height with padding
        viewport.zoom = (imageHeight * 0.85) / (boundsHeight * paddingFactor);
      }
      
      // Recalculate center position with new zoom
      viewport.x = imageWidth / 2 - centerX * viewport.zoom;
      viewport.y = imageHeight / 2 - centerY * viewport.zoom;
    }
    
    // Apply minimum zoom to ensure schema is not too small
    viewport.zoom = Math.max(viewport.zoom, 0.5);
    
    // Calculate what elements to include/exclude
    const reactFlowEl = document.querySelector('.react-flow') as HTMLElement;
    const controlsEl = reactFlowEl?.querySelector('.react-flow__controls');
    const panelEls = reactFlowEl?.querySelectorAll('.react-flow__panel');
    
    // Temporarily hide controls if not included
    if (controlsEl && !settings.includeControls) {
      (controlsEl as HTMLElement).style.display = 'none';
    }

    // Change panel visibility to hide buttons that shouldn't be in screenshot
    const panelVisibility: {el: HTMLElement, originalDisplay: string}[] = [];
    
    if (panelEls) {
      panelEls.forEach(panel => {
        const panelEl = panel as HTMLElement;
        if (!panelEl.classList.contains('screenshot-included')) {
          panelVisibility.push({
            el: panelEl,
            originalDisplay: panelEl.style.display
          });
          panelEl.style.display = 'none';
        }
      });
    }

    // Enhanced options for better quality
    const options = {
      backgroundColor: settings.transparent ? undefined : '#ffffff',
      width: imageWidth,
      height: imageHeight,
      pixelRatio: settings.quality, // Use the user-defined quality setting
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      cacheBust: true, // Avoid caching issues
      canvasWidth: imageWidth,
      canvasHeight: imageHeight,
      skipAutoScale: true,
      fontEmbedCSS: document.querySelector('style')?.textContent || '', // Include fonts
    };

    // Generate the PNG image
    const dataUrl = await toPng(viewportElement, options);

    // Download the image
    downloadImage(dataUrl, fileName);

    // Restore original display state for controls
    if (controlsEl && !settings.includeControls) {
      (controlsEl as HTMLElement).style.display = '';
    }

    // Restore panel visibility
    panelVisibility.forEach(item => {
      item.el.style.display = item.originalDisplay;
    });

  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
}