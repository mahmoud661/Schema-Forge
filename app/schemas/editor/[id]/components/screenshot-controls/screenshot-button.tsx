import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';

interface ScreenshotButtonProps {
  isCapturing: boolean;
  onClick: () => void;
}

export function ScreenshotButton({ isCapturing, onClick }: ScreenshotButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={isCapturing}
      className="gap-2"
    >
      {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      {isCapturing ? "Capturing..." : "Screenshot"}
    </Button>
  );
}
