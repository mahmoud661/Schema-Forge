/**
 * Color utilities for the schema editor
 */

/**
 * Converts a color to its light and dark variants
 * Returns an object with light, dark, and border properties
 */
export function generateColorVariants(baseColor: string) {
  // Parse the color - only supporting hex format for now
  if (!baseColor.startsWith('#')) {
    return {
      light: '#e0f2fe', // Default light blue
      dark: '#0c4a6e',  // Default dark blue
      border: '#38bdf8'  // Default border blue
    };
  }
  
  // A safe way to handle colors in case of parsing errors
  try {
    // Parse the hex color to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // For the light variant - keep as is if it's already light, otherwise lighten
    const isLight = (r * 0.299 + g * 0.587 + b * 0.114) > 150;
    
    // If the selected color is already light, use it as the light variant
    // and darken it for the dark variant
    if (isLight) {
      // For dark variant, darken the color
      const darkR = Math.floor(r * 0.6);
      const darkG = Math.floor(g * 0.6);
      const darkB = Math.floor(b * 0.6);
      const darkHex = `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
      
      // For border, use a slightly darker version of the original
      const borderR = Math.floor(r * 0.9);
      const borderG = Math.floor(g * 0.9);
      const borderB = Math.floor(b * 0.9);
      const borderHex = `#${borderR.toString(16).padStart(2, '0')}${borderG.toString(16).padStart(2, '0')}${borderB.toString(16).padStart(2, '0')}`;
      
      return {
        light: baseColor,
        dark: darkHex,
        border: borderHex
      };
    } 
    // If the selected color is dark, use it as the dark variant
    // and lighten it for the light variant
    else {
      // For light variant, lighten the color
      const lightR = Math.min(255, Math.floor(r + (255 - r) * 0.7));
      const lightG = Math.min(255, Math.floor(g + (255 - g) * 0.7));
      const lightB = Math.min(255, Math.floor(b + (255 - b) * 0.7));
      const lightHex = `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
      
      return {
        light: lightHex,
        dark: baseColor,
        border: baseColor
      };
    }
  } catch (error) {
    console.error('Error parsing color:', error);
    return {
      light: '#e0f2fe',
      dark: '#0c4a6e',
      border: '#38bdf8'
    };
  }
}
