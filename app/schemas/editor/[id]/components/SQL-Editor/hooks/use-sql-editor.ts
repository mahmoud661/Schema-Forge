import { useState, useEffect, useCallback } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { generateSql } from "../sqlGenerators";
import { validateSqlSyntax, fixCommonSqlIssues } from "../sql-validation";
import { parseSqlToSchema } from "../sqlParser";
import { ensureTableNamesAreQuoted, removeDuplicateAlterTableStatements } from "../utils/sql-utils";
import { showToast } from "@/components/ui/toast-notification";

export interface SqlEditorSettings {
  caseSensitiveIdentifiers: boolean;
  useInlineConstraints: boolean;
}

export function useSqlEditor() {
  const { schema, updateSchema, updateCode } = useSchemaStore();
  const { nodes, edges, sqlCode, settings, enumTypes } = schema;

  // Internal state for the editor
  const [dbType, setDbType] = useState("postgresql");
  const [isEditing, setIsEditing] = useState(false);
  const [editingSqlCode, setEditingSqlCode] = useState("");
  const [liveEditMode, setLiveEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);
  
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
        
        // Show success animation
        setSuccessAnimation(true);
        setTimeout(() => setSuccessAnimation(false), 1500);
        
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
  }, [editingSqlCode, liveEditMode, updateSchema]);

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
    updateSchema({
      settings: {
        ...settings,
        caseSensitiveIdentifiers: !settings.caseSensitiveIdentifiers
      }
    });
  }, [settings, updateSchema]);

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
    if (withAnimation) {
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
  }, [isEditing, handleApplySqlChanges]);

  // Start direct AI editing mode with streaming content
  const startAiEditing = useCallback(() => {
    // Switch to SQL tab
    const { updateActiveTab } = useSchemaStore.getState();
    updateActiveTab("sql");
    
    // Enable editing and AI mode
    if (!isEditing) {
      setIsEditing(true);
    }
    setIsAiEditing(true);
    
    // Show toast notification
    showToast({
      title: "AI SQL Generation",
      description: "Creating SQL schema in the editor...",
      type: 'ai',
    });
    
    let currentContent = "";
    
    return {
      updateStreamingContent: (contentOrFn: string | ((prev: string) => string)) => {
        if (typeof contentOrFn === 'function') {
          currentContent = contentOrFn(currentContent);
        } else {
          currentContent = contentOrFn;
        }
        setEditingSqlCode(currentContent);
      },
      finishEditing: () => {
        setIsAiEditing(false);
        handleApplySqlChanges();
        
        showToast({
          title: "SQL Schema Generated",
          description: "AI has completed generating your schema",
          type: 'success',
        });
      },
      cancel: () => {
        setIsAiEditing(false);
        if (sqlCode) {
          setEditingSqlCode(sqlCode); // Restore original SQL
        }
        setError(null);
      }
    };
  }, [isEditing, handleApplySqlChanges, sqlCode]);

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
      caseSensitiveIdentifiers: settings?.caseSensitiveIdentifiers ?? false,
      useInlineConstraints: settings?.useInlineConstraints ?? true
    },
    enumTypes,
    successAnimation,
    handleApplySqlChanges,
    cancelEdit,
    handleDownload,
    handleToggleCaseSensitive,
    handleToggleInlineConstraints,
    handleApplySqlSuggestion,
    startAiEditing
  };
}
