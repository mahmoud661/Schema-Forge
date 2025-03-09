import { useCallback } from "react";

export function useColorHandlers(updateNodeData: (nodeId: string, data: any) => void) {
  // Add a specialized handler for color updates that's fast
  const handleColorUpdate = useCallback((nodeId: string, color: any) => {
    // Find the node element in ReactFlow
    const nodeElement = document.querySelector(`[data-id="${nodeId}"] .node-header`);
    if (nodeElement) {
      // Directly update DOM style for instant feedback
      const isDarkMode = document.documentElement.classList.contains('dark');
      nodeElement.setAttribute('style', `
        background-color: ${isDarkMode ? color.dark : color.light};
        border-bottom: 2px solid ${color.border};
      `);
    }
    
    // Then update the store normally
    updateNodeData(nodeId, { color });
  }, [updateNodeData]);

  // Update the direct DOM manipulation function to only update border
  const handleBorderColorUpdate = useCallback((nodeId: string, color: any) => {
    // Find the node element in ReactFlow
    const nodeElement = document.querySelector(`[data-id="${nodeId}"] .node-header`);
    if (nodeElement) {
      // Directly update only the border style for instant feedback
      nodeElement.style.borderBottom = `3px solid ${color.border}`;
    }
    
    // Then update the store normally
    updateNodeData(nodeId, { color });
  }, [updateNodeData]);

  return {
    handleColorUpdate,
    handleBorderColorUpdate
  };
}
