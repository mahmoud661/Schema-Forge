"use client";

import React, { useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { SchemaFlow } from "./components/schemaFlow/schema-flow";
import { useSchemaStore } from "@/hooks/use-schema";
import { useSchemasCollection } from "@/hooks/use-schemas-collection";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingSpinner } from "./components/loading-spinner";

export default function SchemaEditorClient() {
  const params = useParams();
  const router = useRouter();
  const schemaId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTitle, setLoadingTitle] = useState("Loading Schema");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string | null>(null);
  const [isExitingWithoutSaving, setIsExitingWithoutSaving] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  
  // Access both stores
  const { 
    schema,
    resetSchema,
    updateSchema,
  } = useSchemaStore();
  
  const { 
    getSchema, 
    updateSchema: updateSchemaMetadata,
    addSchema
  } = useSchemasCollection();
  
  // Track changes by comparing current state with last saved state
  useEffect(() => {
    const currentState = JSON.stringify({
      title: schema.title,
      description: schema.description,
      nodes: schema.nodes,
      edges: schema.edges,
      sqlCode: schema.sqlCode,
      enumTypes: schema.enumTypes
    });
    
    if (lastSavedState !== null && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    }
    
    // This subscription detects when the schema changes
    const unsubscribe = useSchemaStore.subscribe(
      (state) => {
        if (lastSavedState) {
          const newState = JSON.stringify({
            title: state.schema.title,
            description: state.schema.description,
            nodes: state.schema.nodes,
            edges: state.schema.edges,
            sqlCode: state.schema.sqlCode,
            enumTypes: state.schema.enumTypes
          });
          
          setHasUnsavedChanges(newState !== lastSavedState);
        }
      }
    );
    
    return () => unsubscribe();
  }, [schema, lastSavedState]);
  
  // Browser beforeunload event to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isExitingWithoutSaving) {
        // Standard way to show a confirmation dialog before leaving page
        e.preventDefault();
        // Message may be shown in some browsers
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    // Add event listener for browser/tab close or navigation
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isExitingWithoutSaving]);
  
  // Next.js router event handling for navigation within the app
  useEffect(() => {
    // Create a handler for route changes
    const handleRouteChangeStart = (url: string) => {
      // If navigating away from editor and has unsaved changes
      if (!url.includes(`/schemas/editor/${schemaId}`) && hasUnsavedChanges && !isExitingWithoutSaving) {
        // Cancel the navigation (cannot cancel router events in App Router)
        // Show our custom dialog by simulating Exit button click
        document.getElementById('exit-editor-button')?.click();
        return false;
      }
      return true;
    };

    return () => {
    };
  }, [hasUnsavedChanges, router, schemaId, isExitingWithoutSaving]);
  
  // Handle saving the complete schema to the collection
  const handleSaveSchema = () => {
    // Get all current schema data from the schema store
    const schemaData = {
      title: schema.title,
      description: schema.description,
      tags: schema.tags,
      sqlCode: schema.sqlCode,
      nodes: schema.nodes,
      edges: schema.edges,
      enumTypes: schema.enumTypes,
      settings: schema.settings
    };
    
    let currentId = schemaId;
    
    if (schemaId === "new") {
      // Create a new schema entry in the collection
      currentId = addSchema(schemaData);
      
      // Update the URL to the new schema ID without reloading
      window.history.replaceState(null, '', `/schemas/editor/${currentId}`);
      
      // Show success message
      toast.success("New schema created successfully");
    } else {
      // Update existing schema in the collection
      updateSchemaMetadata(schemaId, schemaData);
      toast.success("Schema saved successfully");
    }
    
    // Update the last saved state to track future changes
    setLastSavedState(JSON.stringify({
      title: schema.title,
      description: schema.description,
      nodes: schema.nodes,
      edges: schema.edges,
      sqlCode: schema.sqlCode,
      enumTypes: schema.enumTypes
    }));
    
    setHasUnsavedChanges(false);
    return currentId;
  };

  // Explicitly allow exit without saving (bypasses warnings)
  const allowExit = () => {
    setIsExitingWithoutSaving(true);
  };
  
  // Load schema data when component mounts
  useEffect(() => {
    // Start the loading process
    setIsLoading(true);
    setEditorVisible(false);
    
    if (schemaId === "new") {
      setLoadingTitle("Creating New Schema");
      // Create a new empty schema
      resetSchema();
      
      // Simulate a brief loading time for consistency in UX
      setTimeout(() => {
        setIsLoading(false);
        // Slight delay before showing editor for smoother transition
        setTimeout(() => setEditorVisible(true), 100);
      }, 1200);
    } else {
      setLoadingTitle("Loading Existing Schema");
      // Load existing schema from collection
      const schemaMetadata = getSchema(schemaId);
      
      if (!schemaMetadata) {
        toast.error("Schema not found");
        router.push("/browse");
        return;
      }
      
      // Adding a small delay to allow the loading animation to run
      setTimeout(() => {
        // Update the schema store with ALL data from the collection
        updateSchema({
          id: schemaId,
          title: schemaMetadata.title || "Untitled Schema",
          description: schemaMetadata.description || "",
          tags: schemaMetadata.tags || [],
          sqlCode: schemaMetadata.sqlCode || "",
          nodes: schemaMetadata.nodes || [],
          edges: schemaMetadata.edges || [],
          enumTypes: schemaMetadata.enumTypes || [],
          settings: schemaMetadata.settings || {
            caseSensitiveIdentifiers: true,
            useInlineConstraints: false
          }
        });
        
        // Set the initial saved state after loading
        setLastSavedState(JSON.stringify({
          title: schemaMetadata.title,
          description: schemaMetadata.description,
          nodes: schemaMetadata.nodes || [],
          edges: schemaMetadata.edges || [],
          sqlCode: schemaMetadata.sqlCode || "",
          enumTypes: schemaMetadata.enumTypes || []
        }));
        
        // Finish loading after all data is prepared
        setIsLoading(false);
        // Slight delay before showing editor for smoother transition
        setTimeout(() => setEditorVisible(true), 100);
      }, 2000); // Allow the loading spinner to show for a better experience
    }
  }, [schemaId, resetSchema, getSchema, updateSchema, router]);

  // Apply fade-in animation to the editor once it's loaded
  const editorClasses = `transition-opacity duration-500 ${editorVisible ? 'opacity-100' : 'opacity-0'}`;

  if (isLoading) {
    return <LoadingSpinner title={loadingTitle} />;
  }

  return (
    <div className={editorClasses}>
      <ReactFlowProvider>
        <SchemaFlow 
          onSave={handleSaveSchema} 
          hasUnsavedChanges={hasUnsavedChanges}
          allowExit={allowExit}
        />
      </ReactFlowProvider>
    </div>
  );
}