export interface ScreenshotSettings {
  quality: number;
  padding: number;
  transparent: boolean;
  includeControls: boolean;
  zoomLevel: number;
  fillCanvas: boolean;
}

export const defaultScreenshotSettings: ScreenshotSettings = {
  quality: 2,
  padding: 0.25,
  transparent: false,
  includeControls: false,
  zoomLevel: 1.2,
  fillCanvas: true,
};

export interface ScreenshotOptions {
  backgroundColor: string | undefined;  // Changed from string | null to string | undefined
  width: number;
  height: number;
  pixelRatio: number;
  style: {
    width: string;
    height: string;
    transform: string;
  };
  cacheBust: boolean;
  canvasWidth: number;
  canvasHeight: number;
  skipAutoScale: boolean;
  fontEmbedCSS: string;
}
