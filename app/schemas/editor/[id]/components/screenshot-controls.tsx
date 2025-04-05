import React from 'react';
import { ScreenshotControls as ModularScreenshotControls } from './screenshot-controls/index';

interface ScreenshotControlsProps {
  reactFlowInstanceRef: React.MutableRefObject<any>;
}

export function ScreenshotControls({ reactFlowInstanceRef }: ScreenshotControlsProps) {
  return <ModularScreenshotControls reactFlowInstanceRef={reactFlowInstanceRef} />;
}