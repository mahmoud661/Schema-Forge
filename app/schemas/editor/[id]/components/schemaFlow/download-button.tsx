import React, { useState } from 'react';
import {
  Panel,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Camera, Settings, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Slider
} from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// Function to handle the download of the image
function downloadImage(dataUrl: string, fileName: string = 'schema') {
  const a = document.createElement('a');
  a.setAttribute('download', `${fileName}-${new Date().toISOString().slice(0, 10)}.png`);
  a.setAttribute('href', dataUrl);
  a.click();
}

interface DownloadButtonProps {
  className?: string;
}

interface ScreenshotSettings {
  quality: number;         // 1-4, where 4 is highest quality
  padding: number;         // 0-0.5, padding around nodes
  transparent: boolean;    // transparent background or white
  includeControls: boolean; // include ReactFlow controls in screenshot
  zoomLevel: number;       // 0.5-3, custom zoom level for the screenshot
  fillCanvas: boolean;     // whether to fill the entire canvas with the schema
}

// Default dimensions for the exported image
const baseWidth = 1920;
const baseHeight = 1080;

export function DownloadButton({ className }: DownloadButtonProps) {
  const { getNodes, getViewport, getZoom } = useReactFlow();
  const [isCapturing, setIsCapturing] = useState(false);
  const [settings, setSettings] = useState<ScreenshotSettings>({
    quality: 2,           // Default to 2x quality
    padding: 0.25,        // Default padding
    transparent: false,   // Default to white background
    includeControls: false, // Default to not including controls
    zoomLevel: 1.2,       // Default custom zoom level
    fillCanvas: true,     // Default to filling the canvas
  });

  const handleDownload = async () => {
    try {
      setIsCapturing(true);

      // Get the schema title for the filename
      const schemaTitle = document.querySelector('span.font-bold')?.textContent || 'schema';
      const fileName = schemaTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      // Get all nodes
      const nodes = getNodes();
      if (nodes.length === 0) {
        toast.error("No schema elements found to capture");
        return;
      }
      
      // Small delay to ensure UI updates complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Get the viewport element to capture
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewportElement) {
        toast.error("Cannot find diagram to capture.");
        return;
      }

      // Calculate bounds of all nodes
      const nodesBounds = getNodesBounds(nodes);
      
      // Calculate dimensions with fixed aspect ratio (16:9 or 4:3)
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
      // This is the key change - we center the schema in the image
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
        pixelRatio: settings.quality,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
        cacheBust: true,
        canvasWidth: imageWidth,
        canvasHeight: imageHeight,
        skipAutoScale: true,
        fontEmbedCSS: document.querySelector('style')?.textContent || '',
      };

      // Generate the PNG image
      const dataUrl = await toPng(viewportElement, options);

      // Download the image
      downloadImage(dataUrl, fileName);
      toast.success("Screenshot saved");

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
      toast.error("Failed to capture screenshot");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Panel position="top-right" className={`flex gap-2 ${className || ''}`}>
      {/* Settings popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0"
          >
            <Settings size={16} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium leading-none">Screenshot Settings</h4>
            <p className="text-sm text-muted-foreground">
              Adjust the quality and appearance of your schema screenshots.
            </p>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="quality">Image Quality</Label>
                <Select 
                  value={settings.quality.toString()}
                  onValueChange={(value) => setSettings({...settings, quality: parseInt(value)})}
                >
                  <SelectTrigger id="quality">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Standard</SelectItem>
                    <SelectItem value="2">High (2x)</SelectItem>
                    <SelectItem value="3">Ultra (3x)</SelectItem>
                    <SelectItem value="4">Maximum (4x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Padding ({Math.round(settings.padding * 100)}%)</Label>
                <Slider 
                  value={[settings.padding * 100]} 
                  min={0} 
                  max={50} 
                  step={5}
                  onValueChange={(value) => setSettings({...settings, padding: value[0] / 100})} 
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="transparent">Transparent Background</Label>
                <Switch 
                  id="transparent"
                  checked={settings.transparent}
                  onCheckedChange={(checked) => setSettings({...settings, transparent: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="controls">Include Controls</Label>
                <Switch 
                  id="controls"
                  checked={settings.includeControls}
                  onCheckedChange={(checked) => setSettings({...settings, includeControls: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="fillCanvas">Auto-fit Schema</Label>
                <Switch 
                  id="fillCanvas"
                  checked={settings.fillCanvas}
                  onCheckedChange={(checked) => setSettings({...settings, fillCanvas: checked})}
                />
                <div className="sr-only">(Centers and sizes schema to fit the image)</div>
              </div>

              <div className="space-y-2">
                <Label>Manual Zoom ({settings.zoomLevel.toFixed(1)}x)</Label>
                <Slider 
                  value={[settings.zoomLevel * 10]} 
                  min={5} 
                  max={30} 
                  step={1}
                  disabled={settings.fillCanvas}
                  onValueChange={(value) => setSettings({...settings, zoomLevel: value[0] / 10})} 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {settings.fillCanvas ? "Disabled when Auto-fit is on" : "Adjust to manually set zoom level"}
                </p>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Screenshot button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={isCapturing}
        className="gap-2"
      >
        {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {isCapturing ? "Capturing..." : "Screenshot"}
      </Button>
    </Panel>
  );
}

export default DownloadButton;