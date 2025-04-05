import React, { useState } from 'react';
import { toast } from 'sonner';
import { SettingsPopover } from './settings-popover';
import { ScreenshotButton } from './screenshot-button';
import { captureScreenshot, downloadImage } from './utils';
import { defaultScreenshotSettings } from './types';

interface ScreenshotControlsProps {
  reactFlowInstanceRef: React.MutableRefObject<any>;
}

export function ScreenshotControls({ reactFlowInstanceRef }: ScreenshotControlsProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [settings, setSettings] = useState(defaultScreenshotSettings);

  const handleScreenshot = async () => {
    if (!reactFlowInstanceRef?.current) {
      toast.error("Unable to access diagram. Please try again.");
      return;
    }

    setIsCapturing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const result = await captureScreenshot(reactFlowInstanceRef.current, settings);
      if (result) {
        downloadImage(result.dataUrl, result.fileName);
        toast.success("Screenshot saved");
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast.error("Failed to capture screenshot");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <SettingsPopover settings={settings} setSettings={setSettings} />
      <ScreenshotButton isCapturing={isCapturing} onClick={handleScreenshot} />
    </div>
  );
}
