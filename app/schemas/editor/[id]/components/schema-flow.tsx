import React, { useCallback, memo, useMemo, useEffect, useState } from "react";
import { ReactFlow, ReactFlowProvider, useReactFlow, ViewportHelperFunctions } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "@/lib/schema-flow-styles.css";
import { Toaster } from "sonner";

import SchemaNode from "@/components/schema-node";
import EnumNode from "@/components/enum-node";
import { Sidebar } from "@/app/schemas/editor/[id]/components/SideBar/schema-sidebar";
import { EdgeSidebar } from "./edge-sidebar";
import { FlowControls } from "./flow-controls";
import { EditorHeader } from "./editor-header";
import { SqlEditor } from "./sql-editor";
import { AiAssistant } from "./ai-assistant";
import { useSchemaFlow } from "../hooks/use-schema-flow";
import { useSchemaNodes } from "../hooks/use-schema-nodes";
import { useSchemaStore } from "@/hooks/use-schema";

const nodeTypes = {
  databaseSchema: SchemaNode,
  enumType: EnumNode,
};

export function SchemaFlow() {
  // Use the centralized schema store
  const { schema, updateActiveTab } = useSchemaStore();
  const { nodes, edges, activeTab } = schema;
  
  const  {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSave,
    onNodeDelete,
    onEdgeClick,
    onEdgeUpdate,
    selectedEdge,
    setSelectedEdge,
    updateEdgeData,
    duplicateRows,
    updateEnumTypeNameInRows,
    updateEnumEdges,
  }= useSchemaFlow();

  const {
    selectedNode,
    reactFlowWrapper,
    onNodeClick,
    onDragOver,
    onDrop,
    updateNodeData,
    deleteNode
  } = useSchemaNodes();

  // Add a force refresh counter to trigger React Flow re-renders
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Listen for color changes in nodes and force refresh
  useEffect(() => {
    const unsubscribe = useSchemaStore.subscribe(
      (state) => {
        // Check if any node's color has changed
        const hasColorChange = state.schema.nodes.some(node => 
          node.data?.color && node.style?.['--colorUpdateTimestamp']
        );
        
        if (hasColorChange) {
          // Force a re-render of ReactFlow
          setRefreshKey(prev => prev + 1);
        }
      }
    );
    
    return () => unsubscribe();
  }, []);

  // Add a specialized handler for color updates that's fast
  const handleColorUpdate = useCallback((nodeId, color) => {
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
  }, []);

  // Update the direct DOM manipulation function to only update border
  const handleBorderColorUpdate = useCallback((nodeId, color) => {
    // Find the node element in ReactFlow
    const nodeElement = document.querySelector(`[data-id="${nodeId}"] .node-header`);
    if (nodeElement) {
      // Directly update only the border style for instant feedback
      nodeElement.style.borderBottom = `3px solid ${color.border}`;
    }
    
    // Then update the store normally
    updateNodeData(nodeId, { color });
  }, [updateNodeData]);

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
      window.__schemaColorUpdater = handleBorderColorUpdate;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        delete window.__schemaColorUpdater;
      }
    };
  }, [handleBorderColorUpdate]);

  // Performance enhancement: Optimize panning and viewport for large diagrams
  const onInit = useCallback((reactFlowInstance: ViewportHelperFunctions) => {
    reactFlowInstance.fitView({
      padding: 0.2,
      maxZoom: 1.5,
      minZoom: 0.5,
    });
  }, []);

  // Create an efficient memoization key that doesn't change for color-only updates
  const memoKey = useMemo(() => {
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      selectedNodeId: selectedNode?.id || 'none',
      lastStructuralUpdate: nodes.map(node => node._colorUpdated ? '' : node.id).join('|')
    };
  }, [nodes, edges, selectedNode]);
  
  // Performance enhancement: Use a memoization for the ReactFlow content
  const MemoizedReactFlow = useMemo(() => {
    console.log("Re-rendering ReactFlow");
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodesDelete={onNodeDelete}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="bg-muted/30"
        style={{ width: '100%', height: '100%' }}
        connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2 }}
        connectionLineType="smoothstep"
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
        // Performance settings
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        minZoom={0.1}
        maxZoom={2.5}
        nodeExtent={[
          [-2000, -2000],
          [4000, 4000]
        ]}
      >
        <FlowControls />
      </ReactFlow>
    );
  }, [memoKey]); // Only depend on memoKey to prevent re-renders for color changes

  // Render the appropriate sidebar content based on the active tab
  const renderSidebar = () => {
    switch (activeTab) {
      case "visual":
        return (
          <Sidebar 
            selectedNode={selectedNode}
            onUpdateNode={(nodeData) => {
              if (selectedNode) {
                updateNodeData(selectedNode, nodeData);
              }
            }}
            onDeleteNode={(node) => {
              deleteNode(node);
            }}
            duplicateRows={selectedNode?.data?.label ? duplicateRows[selectedNode.data.label] : undefined}
            nodes={nodes} // Always pass all nodes, not just when a node is selected
            onNodeSelect={(node) => onNodeClick({} as React.MouseEvent, node)}
          />
        );
      case "sql":
        return <SqlEditor />;
      case "ai":
        return <AiAssistant 
          nodes={nodes} 
          edges={edges} 
          onApplySuggestion={(suggestedNodes, suggestedEdges) => {
            // Implement your logic to apply suggestions here.
            console.log("Apply suggestion", suggestedNodes, suggestedEdges);
          }}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Toaster position="top-right" />
      
      <EditorHeader 
        onSave={onSave}
        activeTab={activeTab}
        setActiveTab={updateActiveTab}
      />
      
      <div ref={reactFlowWrapper} className="flex-1 flex overflow-hidden">
        {renderSidebar()}
        
        <div className="flex-1 h-full">
          {MemoizedReactFlow}
        </div>
        
        {activeTab === "visual" && selectedEdge && (
          <EdgeSidebar 
            selectedEdge={selectedEdge}
            onUpdateEdge={updateEdgeData}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>
    </div>
  );
}