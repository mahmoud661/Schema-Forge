import { getNodesBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { ScreenshotSettings, ScreenshotOptions } from './types';

export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;

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

export function calculateViewport(nodes: any[], settings: ScreenshotSettings) {
  const nodesBounds = getNodesBounds(nodes);
  
  const boundsWidth = Math.max(nodesBounds.width, 500);
  const boundsHeight = Math.max(nodesBounds.height, 400);
  
  const paddingFactor = settings.padding * 2 + 1;
  const customScale = settings.zoomLevel;
  
  const centerX = nodesBounds.x + nodesBounds.width / 2;
  const centerY = nodesBounds.y + nodesBounds.height / 2;
  
  const viewport = {
    x: BASE_WIDTH / 2 - centerX * customScale,
    y: BASE_HEIGHT / 2 - centerY * customScale,
    zoom: customScale
  };
  
  if (settings.fillCanvas) {
    const widthRatio = boundsWidth / BASE_WIDTH;
    const heightRatio = boundsHeight / BASE_HEIGHT;
    
    if (widthRatio > heightRatio) {
      viewport.zoom = (BASE_WIDTH * 0.85) / (boundsWidth * paddingFactor);
    } else {
      viewport.zoom = (BASE_HEIGHT * 0.85) / (boundsHeight * paddingFactor);
    }
    
    viewport.x = BASE_WIDTH / 2 - centerX * viewport.zoom;
    viewport.y = BASE_HEIGHT / 2 - centerY * viewport.zoom;
  }
  
  viewport.zoom = Math.max(viewport.zoom, 0.5);
  return viewport;
}

export function prepareScreenshotOptions(viewport: any, settings: ScreenshotSettings): ScreenshotOptions {
  return {
    backgroundColor: settings.transparent ? undefined : '#ffffff',
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    pixelRatio: settings.quality,
    style: {
      width: `${BASE_WIDTH}px`,
      height: `${BASE_HEIGHT}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
    cacheBust: true,
    canvasWidth: BASE_WIDTH,
    canvasHeight: BASE_HEIGHT,
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
  
  const visibilityChanges: {el: HTMLElement, originalDisplay: string}[] = [];
  
  if (controlsEl && !settings.includeControls) {
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

  try {
    const viewport = calculateViewport(nodes, settings);
    const options = prepareScreenshotOptions(viewport, settings);
    const dataUrl = await toPng(viewportElement, options);
    return { dataUrl, fileName: getFileName() };
  } finally {
    visibilityChanges.forEach(item => {
      item.el.style.display = item.originalDisplay;
    });
  }
}
