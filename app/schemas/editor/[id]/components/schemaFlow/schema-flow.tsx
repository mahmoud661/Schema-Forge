import React, { useState, useEffect } from "react";
import "@xyflow/react/dist/style.css";
import "@/styles/schema-flow-styles.css";
import { Toaster } from "sonner";

import { useSchemaFlow } from "../../hooks/use-schema-flow";
import { useSchemaNodes } from "../../hooks/use-schema-nodes";
import { useSchemaStore } from "@/hooks/use-schema";
import { EditorLayout } from ".././editor-layout";
import { useColorHandlers } from ".././color-handlers";
import { ReactFlowProvider } from "../../context/react-flow-context";

interface SchemaFlowProps {
  onSave: () => void;
  hasUnsavedChanges: boolean;
  allowExit: () => void;
}

export function SchemaFlow({ onSave, hasUnsavedChanges, allowExit }: SchemaFlowProps) {
  // Use the centralized schema store
  const { schema, updateActiveTab } = useSchemaStore();
  const { nodes, edges, activeTab } = schema;
  
  const flowHooks = useSchemaFlow();
  const nodeHooks = useSchemaNodes();
  
  // Add a force refresh counter to trigger React Flow re-renders
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Setup color handlers
  const { handleColorUpdate, handleBorderColorUpdate } = useColorHandlers((nodeId, data) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      nodeHooks.updateNodeData(node, data);
    }
  });
  
  // Listen for color changes in nodes and force refresh
  useEffect(() => {
    const unsubscribe = useSchemaStore.subscribe(
      (state) => {
        // Check if any node's color has changed
        const hasColorChange = state.schema.nodes.some(node => 
          node.data?.color && (node.style as any)?.['--colorUpdateTimestamp']
        );
        
        if (hasColorChange) {
          // Force a re-render of ReactFlow
          setRefreshKey(prev => prev + 1);
        }
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Expose the fast color update handler to child components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - This is an intentional global for optimization
      window.__schemaColorUpdater = handleColorUpdate;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.__schemaColorUpdater;
      }
    };
  }, [handleColorUpdate]);

  // Expose the border color update handler to child components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - This is an intentional global for optimization
      window.__schemaBorderColorUpdater = handleBorderColorUpdate;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.__schemaBorderColorUpdater;
      }
    };
  }, [handleBorderColorUpdate]);

  // Pass the onSave function and allowExit to flowHooks
  const enhancedFlowHooks = {
    ...flowHooks,
    onSave,
    allowExit
  };

  return (
    <ReactFlowProvider>
      <EditorLayout 
        flowHooks={enhancedFlowHooks}
        nodeHooks={nodeHooks}
        activeTab={activeTab}
        setActiveTab={updateActiveTab}
        refreshKey={refreshKey}
        hasUnsavedChanges={hasUnsavedChanges}
      >
        <Toaster position="top-right" />
      </EditorLayout>
    </ReactFlowProvider>
  );
}