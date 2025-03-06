import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and merges class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a color from a string that works in both light and dark modes
 * @param str Input string to generate color from
 * @param options Customization options
 * @returns CSS hsl color string that's theme-aware
 */
export function themeAwareStringToColor(
  str: string, 
  options?: { 
    darkMode?: boolean; 
    saturation?: number; 
    lightness?: { light: number; dark: number }; 
    opacity?: number;
  }
) {
  const defaults = {
    darkMode: false,
    saturation: 70,
    lightness: { light: 60, dark: 50 },
    opacity: 1
  };

  const config = { ...defaults, ...options };
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  const lightness = config.darkMode ? config.lightness.dark : config.lightness.light;
  const alpha = config.opacity;
  
  return alpha < 1 
    ? `hsla(${hue}, ${config.saturation}%, ${lightness}%, ${alpha})`
    : `hsl(${hue}, ${config.saturation}%, ${lightness}%)`;
}
