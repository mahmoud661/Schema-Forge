import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScreenshotSettings } from './types';

interface SettingsPopoverProps {
  settings: ScreenshotSettings;
  setSettings: React.Dispatch<React.SetStateAction<ScreenshotSettings>>;
}

export function SettingsPopover({ settings, setSettings }: SettingsPopoverProps) {
  return (
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
  );
}
