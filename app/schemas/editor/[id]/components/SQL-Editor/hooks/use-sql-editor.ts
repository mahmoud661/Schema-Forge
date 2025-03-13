import { useState, useEffect, useCallback } from "react";
import { useSchemaStore } from "@/hooks/use-schema";
import { generateSql } from "../sqlGenerators";
import { parseSqlToSchema } from "../sqlParser";
import { fixCommonSqlIssues } from "../sql-validation";
import { toast } from "sonner";
import { ensureTableNamesAreQuoted, removeDuplicateAlterTableStatements, defaultSettings } from "../utils/sql-utils";
import { SchemaNode } from "@/app/schemas/editor/[id]/types/types";
import { SqlEditorSettings } from "../types/types";

export function useSqlEditor() {
  const { 
    schema, 
    updateNodes, 
    updateEdges, 
    updateCode, 
    updateSettings,
    updateSchema
  } = useSchemaStore();
  
  // Safely access schema properties with defaults for new properties
  const nodes = schema.nodes || [];
  const edges = schema.edges || [];
  const enumTypes = schema.enumTypes || [];
  const settings = schema.settings || defaultSettings;
  const sqlCode = schema.sqlCode || "";
  
  // State for SQL editor
  const [dbType, setDbType] = useState<string>("postgresql");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSqlCode, setEditingSqlCode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  
  // Use a stable function reference for setDbType
  const handleSetDbType = useCallback((type: string) => {
    setDbType(type);
  }, []);
  
  // On mount, initialize settings if they don't exist and generate SQL once
  useEffect(() => {
    if (!schema.settings) {
      updateSettings(defaultSettings);
    }
    
    // Generate SQL once on component mount if empty
    if (!sqlCode) {
      const initialSql = generateSql(dbType, nodes, edges, enumTypes, settings);
      updateCode(initialSql);
    }
  }, []);
  
  // When editing mode is activated, initialize the editing state with current SQL
  useEffect(() => {
    if (isEditing) {
      setEditingSqlCode(sqlCode);
    }
  }, [isEditing, sqlCode]);
  
  // Regenerate SQL when db type changes
  useEffect(() => {
    if (!isEditing) {
      const newSql = generateSql(dbType, nodes, edges, enumTypes, settings);
      updateCode(newSql);
    }
  }, [dbType]);
  
  // Handle SQL updates when settings change
  useEffect(() => {
    if (!isEditing) {
      const newSql = generateSql(dbType, nodes, edges, enumTypes, settings);
      updateCode(newSql);
    }
  }, [settings.caseSensitiveIdentifiers, settings.useInlineConstraints]);
  
  // Effect for live updates when SQL changes
  useEffect(() => {
    if (isEditing && liveEditMode && editingSqlCode) {
      handleApplySqlChangesInternal(editingSqlCode, true);
    }
  }, [editingSqlCode, liveEditMode, isEditing]);

  const handleToggleCaseSensitive = () => {
    updateSettings({ 
      ...settings,
      caseSensitiveIdentifiers: !settings.caseSensitiveIdentifiers 
    });
    
    if (isEditing) {
      toast.info("Apply your changes to see updates with new settings", {
        description: "Current edits are preserved until you apply them",
        action: {
          label: "Apply Now",
          onClick: () => handleApplySqlChanges()
        }
      });
    }
  };

  const handleToggleInlineConstraints = () => {
    updateSettings({
      ...settings,
      useInlineConstraints: !settings.useInlineConstraints
    });
    
    if (isEditing) {
      toast.info("Apply your changes to see updates with new settings", {
        description: "Current edits are preserved until you apply them",
        action: {
          label: "Apply Now",
          onClick: () => handleApplySqlChanges()
        }
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([sqlCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${dbType}_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpdateSchema = (newNodes: SchemaNode[], newEdges: any[], newEnumTypes: any[] = []) => {
    updateNodes(newNodes);
    updateEdges(newEdges);
    
    if (newEnumTypes.length > 0) {
      updateSchema({ enumTypes: newEnumTypes });
    }
  };

  const handleApplySqlChangesInternal = (sql: string, isLiveUpdate = false) => {
    try {
      setError(null);
      if (!sql.trim()) {
        setError("SQL cannot be empty");
        return;
      }
      
      let processedSql = sql;
      if (!isLiveUpdate) {
        // Fix table names with spaces by adding quotes if they're missing
        processedSql = ensureTableNamesAreQuoted(processedSql);
        
        // Regular SQL fixes
        const fixedSql = fixCommonSqlIssues(processedSql);
        if (fixedSql !== processedSql) {
          processedSql = fixedSql;
        }
        
        // Remove duplicate ALTER TABLE statements
        processedSql = removeDuplicateAlterTableStatements(processedSql);
      }
      
      try {
        const parsedSchema = parseSqlToSchema(processedSql);
        
        if (parsedSchema) {
          // Preserve node positions
          const preservedNodes = parsedSchema.nodes.map(newNode => {
            const existingNode = schema.nodes.find(n => n.id === newNode.id);
            const existingNodeByLabel = !existingNode ? schema.nodes.find(n => 
              n.data?.label && newNode.data?.label && 
              n.data.label.toLowerCase() === newNode.data.label.toLowerCase()
            ) : null;
            
            const nodeToPreserve = existingNode || existingNodeByLabel;
            
            if (nodeToPreserve && nodeToPreserve.position) {
              return {
                ...newNode,
                position: nodeToPreserve.position,
                style: nodeToPreserve.style,
                data: {
                  ...newNode.data,
                  color: nodeToPreserve.data?.color || newNode.data?.color
                }
              };
            }
            
            return newNode;
          });
          
          // Update the schema with preserved nodes and unique edges
          handleUpdateSchema(
            preservedNodes,
            parsedSchema.edges,
            parsedSchema.enumTypes || []
          );
          
          // Update the store with the processed SQL
          updateCode(processedSql);
          
          if (!isLiveUpdate) {
            toast.success("SQL changes applied successfully");
            setIsEditing(false);
          }
        }
      } catch (parseError: any) {
        console.error('SQL Parsing Error:', parseError);
        setError(`Failed to parse SQL: ${parseError.message}`);
        return;
      }
    } catch (error: any) {
      console.error('SQL Apply Error:', error);
      setError(`Failed to apply SQL changes: ${error.message}`);
    }
  };

  const handleApplySqlChanges = () => {
    handleApplySqlChangesInternal(editingSqlCode);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingSqlCode("");
    setError(null);
  };

  return {
    // State
    dbType,
    sqlCode,
    isEditing,
    error,
    liveEditMode,
    settings,
    enumTypes,
    editingSqlCode,
    
    // State setters
    setDbType: handleSetDbType,
    setEditingSqlCode,
    setIsEditing,
    setLiveEditMode,
    
    // Actions
    handleToggleCaseSensitive,
    handleToggleInlineConstraints,
    handleDownload,
    handleApplySqlChanges,
    cancelEdit
  };
}
