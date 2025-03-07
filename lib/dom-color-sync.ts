/**
 * Direct DOM manipulation utilities for instant color updates
 */

// Global registry of elements that need color updates
type ColorRegistry = {
  [nodeId: string]: {
    elements: HTMLElement[],
    color: {
      light: string,
      dark: string,
      border: string
    }
  }
};

// The registry instance
const colorRegistry: ColorRegistry = {};

/**
 * Register a node element for color updates
 */
export function registerNodeForColorUpdates(
  nodeId: string, 
  element: HTMLElement, 
  initialColor?: { light: string, dark: string, border: string }
) {
  if (!colorRegistry[nodeId]) {
    colorRegistry[nodeId] = {
      elements: [],
      color: initialColor || {
        light: '#e0f2fe',
        dark: '#0c4a6e',
        border: '#38bdf8'
      }
    };
  }
  
  colorRegistry[nodeId].elements.push(element);
  
  // Apply initial color
  applyColorToElement(element, colorRegistry[nodeId].color);
}

/**
 * Update a node's color directly in the DOM
 */
export function updateNodeColor(
  nodeId: string, 
  color: { light: string, dark: string, border: string }
) {
  if (!colorRegistry[nodeId]) {
    colorRegistry[nodeId] = {
      elements: [],
      color
    };
    return;
  }
  
  colorRegistry[nodeId].color = color;
  
  // Update all registered elements
  colorRegistry[nodeId].elements.forEach(element => {
    applyColorToElement(element, color);
  });
}

/**
 * Apply color to a specific element based on theme
 */
function applyColorToElement(
  element: HTMLElement,
  color: { light: string, dark: string, border: string }
) {
  const isDarkMode = document.documentElement.classList.contains('dark');
  element.style.backgroundColor = isDarkMode ? color.dark : color.light;
  element.style.borderBottom = `2px solid ${color.border}`;
}

/**
 * Cleanup registry for unmounted nodes
 */
export function unregisterNodeForColorUpdates(nodeId: string) {
  if (colorRegistry[nodeId]) {
    delete colorRegistry[nodeId];
  }
}
