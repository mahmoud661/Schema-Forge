import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { ScreenshotSettings, ScreenshotOptions } from './types';

// Default minimum dimensions to ensure the image is not too small
export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;
// Padding around the schema (in pixels)
export const SCHEMA_PADDING = 100;

export function downloadImage(dataUrl: string, fileName: string = 'schema') {
  const a = document.createElement('a');
  a.setAttribute('download', `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
  a.setAttribute('href', dataUrl);
  a.click();
}

export function getFileName() {
  const schemaTitle = document.querySelector('span.font-bold')?.textContent || 'schema';
  return schemaTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}

export function calculateViewport(reactFlowInstance: any, settings: ScreenshotSettings) {
  // Use the getNodesBounds from the reactFlowInstance to support sub flows
  const nodes = reactFlowInstance.getNodes();
  const nodesBounds = reactFlowInstance.getNodesBounds(nodes);
  
  // Calculate the bounds with padding
  const paddingPixels = SCHEMA_PADDING * 2;
  
  // Calculate the dimensions of the image based on the schema content
  const contentWidth = Math.max(nodesBounds.width, 500);
  const contentHeight = Math.max(nodesBounds.height, 400);
  
  // Add padding to the content dimensions
  const imageWidth = contentWidth + paddingPixels;
  const imageHeight = contentHeight + paddingPixels;
  
  // Apply the quality setting to increase resolution if needed
  const finalWidth = Math.max(MIN_WIDTH, imageWidth) * settings.quality;
  const finalHeight = Math.max(MIN_HEIGHT, imageHeight) * settings.quality;
  
  // Calculate the center of the nodes
  const centerX = nodesBounds.x + nodesBounds.width / 2;
  const centerY = nodesBounds.y + nodesBounds.height / 2;
  
  // Calculate the zoom level to fit the content in the viewport
  // If fillCanvas is true, we calculate the zoom to fit the content in the viewport
  // Otherwise, we use the specified zoom level
  let zoom = settings.zoomLevel;
  
  if (settings.fillCanvas) {
    const widthRatio = contentWidth / finalWidth;
    const heightRatio = contentHeight / finalHeight;
    
    // Use the larger ratio to ensure the content fits
    const ratio = Math.max(widthRatio, heightRatio);
    
    // Calculate zoom with the padding factor
    const paddingFactor = settings.padding * 2 + 1;
    zoom = 1 / (ratio * paddingFactor);
  }
  
  // Ensure a reasonable zoom level
  zoom = Math.max(zoom, 0.5);
  
  // Calculate viewport position to center the content
  const viewport = {
    x: finalWidth / 2 - centerX * zoom,
    y: finalHeight / 2 - centerY * zoom,
    zoom: zoom,
    width: finalWidth,
    height: finalHeight
  };
  
  return viewport;
}

export function prepareScreenshotOptions(viewport: any, settings: ScreenshotSettings): ScreenshotOptions {
  return {
    backgroundColor: settings.transparent ? undefined : '#ffffff',
    width: viewport.width,
    height: viewport.height,
    pixelRatio: 1, // We already account for quality in the viewport calculation
    style: {
      width: `${viewport.width}px`,
      height: `${viewport.height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
    cacheBust: true,
    canvasWidth: viewport.width,
    canvasHeight: viewport.height,
    skipAutoScale: true,
    fontEmbedCSS: document.querySelector('style')?.textContent || '',
  };
}

export async function captureScreenshot(reactFlowInstance: any, settings: ScreenshotSettings) {
  const nodes = reactFlowInstance.getNodes();
  if (!nodes || nodes.length === 0) {
    toast.error("No schema elements found to capture");
    return null;
  }
  
  const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
  if (!viewportElement) {
    toast.error("Cannot find diagram to capture.");
    return null;
  }

  const reactFlowEl = document.querySelector('.react-flow') as HTMLElement;
  const controlsEl = reactFlowEl?.querySelector('.react-flow__controls');
  const panelEls = reactFlowEl?.querySelectorAll('.react-flow__panel');
  const handels = reactFlowEl?.querySelectorAll('.react-flow__handle');

  const visibilityChanges: {el: HTMLElement, originalDisplay: string}[] = [];
  
  if (controlsEl) {
    visibilityChanges.push({
      el: controlsEl as HTMLElement, 
      originalDisplay: (controlsEl as HTMLElement).style.display
    });
    (controlsEl as HTMLElement).style.display = 'none';
  }
  
  if (panelEls) {
    panelEls.forEach(panel => {
      const panelEl = panel as HTMLElement;
      if (!panelEl.classList.contains('screenshot-included')) {
        visibilityChanges.push({
          el: panelEl,
          originalDisplay: panelEl.style.display
        });
        panelEl.style.display = 'none';
      }
    });
  }

  if (handels && settings.hideConectionsPoints) {
    handels.forEach(handle => {
      const handleEl = handle as HTMLElement;
      if (!handleEl.classList.contains('screenshot-included')) {
        visibilityChanges.push({
          el: handleEl,
          originalDisplay: handleEl.style.display
        });
        handleEl.style.display = 'none';
      }
    });
  }
  
  try {
    const viewport = calculateViewport(reactFlowInstance, settings);
    const options = prepareScreenshotOptions(viewport, settings);
    const dataUrl = await toPng(viewportElement, options);
    return { dataUrl, fileName: getFileName() };
  } finally {
    visibilityChanges.forEach(item => {
      item.el.style.display = item.originalDisplay;
    });
  }
}
