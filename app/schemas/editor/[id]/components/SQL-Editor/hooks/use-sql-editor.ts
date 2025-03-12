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
  
  // State for SQL editor
  const [appliedSql, setAppliedSql] = useState<string>("");
  const [dbType, setDbType] = useState<string>("postgresql");
  const [sqlContent, setSqlContent] = useState<string>("");
  const [editableSql, setEditableSql] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  
  // On mount, initialize settings if they don't exist and generate SQL once
  useEffect(() => {
    if (!schema.settings) {
      updateSettings(defaultSettings);
    }
    
    // Generate SQL once on component mount or when switching to this tab
    if (!appliedSql || appliedSql === "") {
      const initialSql = generateSql(dbType, nodes, edges, enumTypes, settings);
      setAppliedSql(initialSql);
      setSqlContent(initialSql);
      setEditableSql(initialSql);
    }
  }, []);
  
  // Regenerate SQL when db type changes (but not other settings)
  useEffect(() => {
    const newSql = generateSql(dbType, nodes, edges, enumTypes, settings);
    setSqlContent(newSql);
    
    // Only update editable SQL if we're not currently editing
    // This ensures we don't overwrite user-edited SQL
    if (!isEditing) {
      setEditableSql(newSql);
      setAppliedSql(newSql);
      
      // Also update store - this ensures consistency
      updateCode(newSql);
    }
    
    console.log("SQL editor db type changed:", dbType);
  }, [dbType]);
  
  // Modify the settings change effect to preserve user edits
  useEffect(() => {
    // Only update the SQL representation when not in editing mode
    if (!isEditing) {
      // Regenerate SQL completely when settings change
      const newSql = generateSql(dbType, nodes, edges, enumTypes, settings);
      
      // Update all state
      setSqlContent(newSql);
      setAppliedSql(newSql);
      setEditableSql(newSql);
      
      // Also update store to maintain consistency
      updateCode(newSql);
    } else {
      console.log("Settings changed but preserving user edits in editor");
    }
  }, [settings.caseSensitiveIdentifiers, settings.useInlineConstraints]);
  
  // Effect for live updates when SQL changes
  useEffect(() => {
    if (isEditing && liveEditMode && editableSql) {
      handleApplySqlChangesInternal(editableSql, true);
    }
  }, [editableSql, liveEditMode, isEditing]);

  // Add a special effect to force reparse when settings change
  useEffect(() => {
    // Regenerate SQL completely when settings change
    const newSql = generateSql(dbType, nodes, edges, enumTypes, settings);
    
    // Update all state
    setSqlContent(newSql);
    setAppliedSql(newSql);
    
    if (!isEditing) {
      setEditableSql(newSql);
    }
    
    // Also update store to maintain consistency
    updateCode(newSql);
    
    console.log("Settings changed, regenerated SQL:", {
      dbType,
      useInlineConstraints: settings.useInlineConstraints,
      caseSensitive: settings.caseSensitiveIdentifiers,
      edgeCount: edges.length,
      tableCount: nodes.filter(n => n.type === 'databaseSchema' || !n.type).length
    });
  }, [dbType, settings.caseSensitiveIdentifiers, settings.useInlineConstraints]);

  const handleToggleCaseSensitive = () => {
    // First update the setting
    updateSettings({ 
      ...settings,
      caseSensitiveIdentifiers: !settings.caseSensitiveIdentifiers 
    });
    
    // If editing, prompt user to apply changes or warn that settings won't affect current edits
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

  // Handle toggling inline constraints with immediate SQL reparse
  const handleToggleInlineConstraints = () => {
    console.log("Toggling inline constraints from", settings.useInlineConstraints, "to", !settings.useInlineConstraints);
    
    // First update the setting
    updateSettings({
      ...settings,
      useInlineConstraints: !settings.useInlineConstraints
    });
    
    // If editing, prompt user to apply changes or warn that settings won't affect current edits
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
    const blob = new Blob([isEditing ? editableSql : sqlContent], { type: 'text/plain' });
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
    
    // Update enum types if provided
    if (newEnumTypes.length > 0) {
      updateSchema({ enumTypes: newEnumTypes });
    }
    
    // Also update the SQL code in the store
    updateCode(editableSql);
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
        const originalSql = sql;
        
        // Fix table names with spaces by adding quotes if they're missing
        processedSql = ensureTableNamesAreQuoted(processedSql);
        
        // Regular SQL fixes
        const fixedSql = fixCommonSqlIssues(processedSql);
        if (fixedSql !== processedSql) {
          processedSql = fixedSql;
          console.log("Fixed SQL syntax:", fixedSql);
        }
        
        // Remove duplicate ALTER TABLE statements
        processedSql = removeDuplicateAlterTableStatements(processedSql);
        console.log("After removing duplicate ALTER TABLE statements:", 
          processedSql.includes("ALTER TABLE") ? 
            `Contains ${(processedSql.match(/ALTER TABLE/g) || []).length} ALTER TABLE statements` : 
            "No ALTER TABLE statements");
      }
      
      try {
        // Log SQL before parsing to help debug issues
        console.log("Parsing SQL:", processedSql);
        const parsedSchema = parseSqlToSchema(processedSql);
        
        if (parsedSchema) {
          console.log("Successfully parsed schema:", parsedSchema.nodes.map(n => n.data?.label));
          
          // Preserve node positions
          const preservedNodes = parsedSchema.nodes.map(newNode => {
            // Look up the existing node, first try by ID
            const existingNode = schema.nodes.find(n => n.id === newNode.id);
            
            // If not found by ID, try by label with case-insensitive matching
            const existingNodeByLabel = !existingNode ? schema.nodes.find(n => 
              n.data?.label && newNode.data?.label && 
              n.data.label.toLowerCase() === newNode.data.label.toLowerCase()
            ) : null;
            
            // Use whichever node we found
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
          
          console.log(`Applying schema with ${preservedNodes.length} nodes and ${parsedSchema.edges.length} edges`);
          
          // Update the schema with preserved nodes and unique edges
          handleUpdateSchema(
            preservedNodes,
            parsedSchema.edges,
            parsedSchema.enumTypes || []
          );
          
          // Set the applied SQL for next comparison - use the fixed and deduplicated version
          setAppliedSql(processedSql);
          
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
    handleApplySqlChangesInternal(editableSql);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditableSql(appliedSql);
    setError(null);
  };

  return {
    // State
    dbType,
    sqlContent,
    editableSql,
    isEditing,
    error,
    liveEditMode,
    settings,
    enumTypes,
    
    // State setters
    setDbType,
    setEditableSql,
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
