import { useState, useEffect, useCallback } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { generateSql } from "../sqlGenerators";
import { validateSqlSyntax, fixCommonSqlIssues } from "../sql-validation";
import { parseSqlToSchema } from "../sqlParser";
import { ensureTableNamesAreQuoted, removeDuplicateAlterTableStatements } from "../utils/sql-utils";
import { showToast } from "@/components/ui/toast-notification";
import { useSqlEditorStore } from '../../../store/sql-editor-store';

export interface SqlEditorSettings {
  caseSensitiveIdentifiers: boolean;
  useInlineConstraints: boolean;
}

export function useSqlEditor() {
  // Use the Zustand store for state management
  const {
    isAiEditing,
    successAnimation,
    error,
    setEditingSqlCode: storeSetEditingSqlCode,
    setIsEditing,
    startAiEditing: storeStartAiEditing,
    finishAiEditing: storeFinishAiEditing,
    setError,
    setSqlCode: storeSetSqlCode
  } = useSqlEditorStore();
  
  // Get SQL from the main schema store - this is the source of truth
  const { schema, updateSchema, updateCode } = useSchemaStore();
  const { nodes, edges, settings, enumTypes } = schema;
  
  // Get the real SQL code from the schema store
  const sqlCode = schema.sqlCode;
  
  // Sync the SQL code from schema store to our SQL editor store
  useEffect(() => {
    storeSetSqlCode(sqlCode);
  }, [sqlCode, storeSetSqlCode]);
  
  // Get editingSqlCode from the store
  const editingSqlCode = useSqlEditorStore(state => state.editingSqlCode);
  
  // Get isEditing from the store
  const isEditing = useSqlEditorStore(state => state.isEditing);
  
  // Define setIsAiEditing function to handle AI editing state
  const setIsAiEditing = useCallback((value: boolean) => {
    console.log(`[SQL Editor Hook] Setting isAiEditing to: ${value}`);
    if (value) {
      storeStartAiEditing();
    } else {
      storeFinishAiEditing(false);
    }
  }, [storeStartAiEditing, storeFinishAiEditing]);
  
  // Create a function to set editingSqlCode that updates both stores
  const setEditingSqlCode = useCallback((code: string) => {
    storeSetEditingSqlCode(code);
  }, [storeSetEditingSqlCode]);
  
  // Internal state for the editor
  const [dbType, setDbType] = useState("postgresql");
  const [liveEditMode, setLiveEditMode] = useState(false);
  
  // Set default settings to match PostgreSQL format
  const defaultSettings = {
    caseSensitiveIdentifiers: true,  // No quotes for regular identifiers
    useInlineConstraints: false,       // Use inline REFERENCES syntax
  };

  // Update SQL from schema when database type changes or schema changes
  useEffect(() => {
    if (!isEditing) {
      const generatedSql = generateSql(
        dbType, 
        nodes, 
        edges,
        enumTypes,
        settings
      );
      updateCode(generatedSql);
    }
  }, [dbType, nodes, edges, enumTypes, settings, updateCode, isEditing]);

  // Start editing
  useEffect(() => {
    if (isEditing) {
      setEditingSqlCode(sqlCode);
    }
  }, [isEditing, sqlCode]);

  // Handle live edit mode
  useEffect(() => {
    if (isEditing && liveEditMode) {
      const timer = setTimeout(() => {
        handleApplySqlChanges();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isEditing, liveEditMode, editingSqlCode]);

  // Apply SQL changes to the schema
  const handleApplySqlChanges = useCallback(() => {
    if (!editingSqlCode.trim()) {
      setError("SQL cannot be empty");
      return;
    }

    try {
      // Validate syntax
      const validation = validateSqlSyntax(editingSqlCode);
      
      if (!validation.isValid) {
        const criticalErrors = validation.errors.filter(err => !err.startsWith('Warning:'));
        if (criticalErrors.length > 0) {
          setError(`SQL has syntax errors: ${criticalErrors.join(', ')}`);
          return;
        }
      }

      // Auto-fix common issues before parsing
      const fixedSql = removeDuplicateAlterTableStatements(
        ensureTableNamesAreQuoted(fixCommonSqlIssues(editingSqlCode))
      );
      
      // Parse SQL back to schema
      const parsedSchema = parseSqlToSchema(fixedSql);
      
      if (parsedSchema) {
        // Update the schema with the parsed data
        updateSchema({
          nodes: parsedSchema.nodes || [],
          edges: parsedSchema.edges || [],
          sqlCode: fixedSql,
          ...(parsedSchema.enumTypes ? { enumTypes: parsedSchema.enumTypes } : {})
        });
        
        // Show success animation in the store
        storeFinishAiEditing(true);
        
        // Show success toast with counts
        showToast({
          title: "Schema Applied Successfully",
          description: `Created ${parsedSchema.nodes?.length || 0} tables and ${
            parsedSchema.edges?.length || 0
          } relationships from SQL`,
          type: 'success'
        });
        
        // Clear error and exit edit mode if not in live edit
        setError(null);
        if (!liveEditMode) {
          setIsEditing(false);
        }
      } else {
        setError("Failed to parse SQL schema");
      }
    } catch (e: any) {
      setError(`Error: ${e.message}`);
      showToast({
        title: "Error Applying Schema",
        description: e.message,
        type: 'error'
      });
    }
  }, [editingSqlCode, liveEditMode, updateSchema, setError, setIsEditing, storeFinishAiEditing]);

  // Cancel editing
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingSqlCode(sqlCode);
    setError(null);
  };

  // Download SQL
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([sqlCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `schema_${dbType}_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Setting toggles
  const handleToggleCaseSensitive = useCallback(() => {
    // Log the setting change
    console.log(`[SQL Editor] Toggling case sensitivity from ${settings?.caseSensitiveIdentifiers} to ${!settings?.caseSensitiveIdentifiers}`);
    
    // Update schema settings
    updateSchema({
      settings: {
        ...settings,
        caseSensitiveIdentifiers: !settings?.caseSensitiveIdentifiers
      }
    });
    
    // Force SQL regeneration if not in edit mode
    if (!isEditing) {
      const generatedSql = generateSql(
        dbType, 
        nodes, 
        edges,
        enumTypes,
        { 
          ...settings, 
          caseSensitiveIdentifiers: !settings?.caseSensitiveIdentifiers 
        }
      );
      updateCode(generatedSql);
      storeSetSqlCode(generatedSql);
    }
  }, [settings, updateSchema, isEditing, dbType, nodes, edges, enumTypes, updateCode, storeSetSqlCode]);

  const handleToggleInlineConstraints = useCallback(() => {
    updateSchema({
      settings: {
        ...settings,
        useInlineConstraints: !settings.useInlineConstraints
      }
    });
  }, [settings, updateSchema]);

  // Apply AI suggestion to editor
  const handleApplySqlSuggestion = useCallback((suggestedSql: string, withAnimation = true) => {
    // Switch to edit mode if not already
    if (!isEditing) {
      setIsEditing(true);
    }
    
    // If we want animation/streaming effect
    if (true) {
      console.log("asndvaskjbdkajsndblkasd")
      // Set AI editing mode
      setIsAiEditing(true);
      
      // Start with empty string if in streaming mode
      setEditingSqlCode("");
      
      // Show initial toast
      const loadingToast = showToast({
        title: "Applying AI Schema",
        description: "Generating your database schema in the editor...",
        type: 'ai',
        duration: 10000 // Longer timeout since we'll dismiss it manually
      });
      
      // Split suggested SQL into chunks to simulate streaming
      const segments = suggestedSql.match(/.{1,20}/g) || [];
      let currentText = "";
      
      // Process each segment with a delay
      segments.forEach((segment, index) => {
        setTimeout(() => {
          currentText += segment;
          setEditingSqlCode(currentText);
          
          // When done, apply changes and exit AI editing mode
          if (index === segments.length - 1) {
            setTimeout(() => {
              // Dismiss the loading toast
              loadingToast();
              
              // Apply SQL and show results
              handleApplySqlChanges();
              setIsAiEditing(false);
              
              // Show completion toast
              showToast({
                title: "AI Schema Applied",
                description: "SQL has been transformed into a visual database schema",
                type: 'success',
              });
            }, 500);
          }
        }, index * 30); // 30ms between chunks
      });
    } else {
      // No animation, just apply immediately
      setEditingSqlCode(suggestedSql);
      handleApplySqlChanges();
    }
  }, [isEditing, handleApplySqlChanges, setIsEditing, setIsAiEditing]);

  // Start direct AI editing mode with streaming content
  const startAiEditing = useCallback(() => {
    console.log('[SQL Editor Debug] startAiEditing called, current isAiEditing:', isAiEditing);
   
    // Switch to SQL tab
    const { updateActiveTab } = useSchemaStore.getState();
    updateActiveTab("sql");
    
    // Enable editing and AI mode
    if (!isEditing) {
      setIsEditing(true);
    }
    
    // Set AI editing mode to true
    console.log('[SQL Editor Debug] Setting isAiEditing to true');
    storeStartAiEditing(); // Call the store function to set isAiEditing
    
    // Show toast notification
    showToast({
      title: "AI SQL Generation",
      description: "Creating SQL schema in the editor...",
      type: 'ai',
    });
    
    let currentContent = "";
    
    // Return the control interface
    return {
      updateStreamingContent: (contentOrFn: string | ((prev: string) => string)) => {
        if (typeof contentOrFn === 'function') {
          const prevContent = useSqlEditorStore.getState().editingSqlCode;
          const newContent = contentOrFn(prevContent);
          setEditingSqlCode(newContent);
        } else {
          setEditingSqlCode(contentOrFn);
        }
      },
      finishEditing: () => {
        console.log('[SQL Editor Debug] finishEditing called, setting isAiEditing to false');
        storeFinishAiEditing(true); // Call the store function with success=true
        handleApplySqlChanges();
        
        showToast({
          title: "SQL Schema Generated",
          description: "AI has completed generating your schema",
          type: 'success',
        });
      },
      cancel: () => {
        console.log('[SQL Editor Debug] cancel called, setting isAiEditing to false');
        storeFinishAiEditing(false); // Call the store function with success=false
        if (sqlCode) {
          setEditingSqlCode(sqlCode); // Restore original SQL
        }
        setError(null);
      }
    };
  }, [isEditing, handleApplySqlChanges, sqlCode, isAiEditing, setIsEditing, storeStartAiEditing, storeFinishAiEditing, setEditingSqlCode, setError]);

  // When startAiEditing is called in the hook
  const handleStartAiEditing = () => {
    console.log('[SQL Editor Debug] handleStartAiEditing called, current isAiEditing:', isAiEditing);
    // Call the store action directly instead of the local function
    storeStartAiEditing();
  };

  // When finishEditing is called in the hook
  const handleFinishEditing = (success = false) => {
    console.log('[SQL Editor Debug] handleFinishEditing called, setting isAiEditing to false');
    // Call the store action
    storeFinishAiEditing(success);
  };

  return {
    dbType,
    setDbType,
    isEditing,
    setIsEditing,
    liveEditMode,
    setLiveEditMode,
    sqlCode,
    editingSqlCode,
    setEditingSqlCode,
    error,
    isAiEditing,
    setIsAiEditing,
    settings: {
      caseSensitiveIdentifiers: settings?.caseSensitiveIdentifiers ?? true,
      useInlineConstraints: settings?.useInlineConstraints ?? false
    },
    enumTypes,
    successAnimation,
    handleApplySqlChanges,
    cancelEdit,
    handleDownload,
    handleToggleCaseSensitive,
    handleToggleInlineConstraints,
    handleApplySqlSuggestion,
    startAiEditing,
    finishEditing: (success = false) => storeFinishAiEditing(success),
  };
}
