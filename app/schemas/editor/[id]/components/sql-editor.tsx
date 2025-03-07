"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Settings } from "lucide-react";
import { toast } from "sonner";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { generateSql } from "./SQL-Editor/sqlGenerators";
import { parseSqlToSchema } from "./SQL-Editor/sqlParser";
import EditorComponent from "./SQL-Editor/EditorComponent";
import { validateSqlSyntax, fixCommonSqlIssues } from "./SQL-Editor/sql-validation";
import { useSchemaStore } from "@/hooks/use-schema";
import { SchemaNode } from "../types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Default settings to use if schema settings are undefined
const defaultSettings = {
  caseSensitiveIdentifiers: false,
  useInlineConstraints: true
};

// Main SQL Editor Component
export function SqlEditor() {
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
  
  // New state to store last applied SQL
  const [appliedSql, setAppliedSql] = useState<string>("");
  const [dbType, setDbType] = useState<string>("postgresql");
  const [sqlContent, setSqlContent] = useState<string>("");
  const [editableSql, setEditableSql] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  const { widths, updateWidth } = useSidebarStore();
  
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
  }, [schema.settings, updateSettings]);
  
  // Effect for live updates when SQL changes
  useEffect(() => {
    if (isEditing && liveEditMode && editableSql) {
      handleApplySqlChangesInternal(editableSql, true);
    }
  }, [editableSql, liveEditMode, isEditing]);

  const handleToggleCaseSensitive = () => {
    updateSettings({ 
      ...settings,
      caseSensitiveIdentifiers: !settings.caseSensitiveIdentifiers 
    });
  };

  const handleToggleInlineConstraints = () => {
    updateSettings({ 
      ...settings,
      useInlineConstraints: !settings.useInlineConstraints 
    });
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
        const fixedSql = fixCommonSqlIssues(sql);
        if (fixedSql !== originalSql) {
          console.log("SQL was modified by auto-fix");
          toast.info("Some SQL syntax issues were automatically fixed");
          setEditableSql(fixedSql);
          processedSql = fixedSql;
        }
      }
      
      const validation = validateSqlSyntax(processedSql);
      if (!validation.isValid) {
        // Only treat true errors (not warnings) as critical
        const criticalErrors = validation.errors.filter(err => 
          !err.startsWith('Warning:') && (
            err.includes("cannot be empty") || 
            err.includes("must contain at least one CREATE TABLE")
          )
        );
        
        if (criticalErrors.length > 0) {
          setError(criticalErrors[0]);
          return;
        } else if (!isLiveUpdate && validation.errors.length > 0) {
          // Log warnings but don't block execution
          const warnings = validation.errors.filter(err => err.startsWith('Warning:'));
          if (warnings.length > 0) {
            console.warn("SQL warnings:", warnings);
          }
        }
      }
      
      try {
        const parsedSchema = parseSqlToSchema(processedSql);
        if (parsedSchema) {
          console.log("Parsed schema:", { 
            tables: parsedSchema.nodes.filter(n => n.type !== 'enumType').map(n => n.data.label),
            enums: parsedSchema.nodes.filter(n => n.type === 'enumType').map(n => n.data.name),
            edges: parsedSchema.edges.length,
            enumTypes: parsedSchema.enumTypes?.length || 0,
            edgeDetails: parsedSchema.edges.map(e => ({
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              connectionType: e.data?.connectionType
            })),
            sql: processedSql 
          });
          
          // Make sure we update BOTH the nodes AND enumTypes in our schema
          handleUpdateSchema(
            parsedSchema.nodes, 
            parsedSchema.edges, 
            parsedSchema.enumTypes || []
          );
          
          // Update SQL stored in state
          updateCode(processedSql);
          
          if (!isLiveUpdate) {
            // Save the user's SQL exactly as applied
            setAppliedSql(processedSql);
            setSqlContent(processedSql);
            setIsEditing(false);
            
            const enumCount = parsedSchema.nodes.filter(n => n.type === 'enumType').length;
            const tableCount = parsedSchema.nodes.filter(n => n.type === 'databaseSchema' || !n.type).length;
            
            toast.success(
              `Schema updated successfully (${tableCount} tables, ${parsedSchema.edges.length} relationships, ${enumCount} enum types)`
            );
          }
        }
      } catch (parseError: any) {
        console.error("SQL parsing error:", parseError);
        setError(`SQL parsing failed: ${parseError.message}`);
        if (!isLiveUpdate) {
          toast.error(`Failed to parse SQL: ${parseError.message}`);
        }
        return;
      }
    } catch (error: any) {
      console.error("SQL application error:", error);
      setError(error.message || "An error occurred while processing SQL");
      if (!isLiveUpdate) {
        toast.error("Failed to update schema");
      }
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

  // Header actions for the BaseSidebar
  const headerActions = (
    <>
      <div className="flex items-center gap-2">
        <Select value={dbType} onValueChange={setDbType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Database Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="sqlite">SQLite</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="SQL Settings">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">SQL Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="case-sensitive">Case-sensitive identifiers</Label>
                  <div className="text-xs text-muted-foreground">
                    Use quotes around table and row names
                  </div>
                </div>
                <Switch
                  id="case-sensitive"
                  checked={settings.caseSensitiveIdentifiers}
                  onCheckedChange={handleToggleCaseSensitive}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inline-constraints">Use inline constraints</Label>
                  <div className="text-xs text-muted-foreground">
                    Add foreign key constraints inside CREATE TABLE instead of ALTER TABLE
                  </div>
                </div>
                <Switch
                  id="inline-constraints"
                  checked={settings.useInlineConstraints}
                  onCheckedChange={handleToggleInlineConstraints}
                />
              </div>
              
              {dbType === "postgresql" && (
                <div className="pt-2">
                  <h5 className="text-sm font-medium mb-2">ENUM Types ({enumTypes.length})</h5>
                  <div className="max-h-24 overflow-y-auto text-xs">
                    {enumTypes.length > 0 ? (
                      <ul className="space-y-1">
                        {enumTypes.map((enumType, index) => (
                          <li key={index} className="flex justify-between items-center">
                            <span className="font-mono">{enumType.name}</span>
                            <span className="text-muted-foreground">
                              ({enumType.values.length} values)
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground italic">No ENUM types defined</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Add ENUM types using CREATE TYPE in the SQL editor
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex gap-2">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <>
            <div className="flex items-center mr-2">
              <input 
                type="checkbox" 
                id="liveEdit" 
                checked={liveEditMode} 
                onChange={(e) => setLiveEditMode(e.target.checked)} 
                className="mr-1"
              />
              <label htmlFor="liveEdit" className="text-xs">Live</label>
            </div>
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplySqlChanges}>
              Apply
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </>
  );

  return (
    <BaseSidebar 
      title="SQL Editor"
      width={widths.sql}
      onWidthChange={(width) => updateWidth('sql', width)}
      maxWidth={800}
      headerActions={headerActions}
      headerClassName="p-4 flex-col gap-3 sm:flex-row"
      collapsible={true}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive overflow-auto">
            <p className="mb-2 font-medium">{error}</p>
            <details className="text-xs opacity-80">
              <summary>Show troubleshooting info</summary>
              <p className="mt-2">If your foreign keys are not showing up, make sure the table names and row names match exactly (including case).</p>
              <p className="mt-1">The ALTER TABLE statement should look like: ALTER TABLE "Table1" ADD CONSTRAINT name FOREIGN KEY ("row") REFERENCES "Table2"("row");</p>
            </details>
          </div>
        )}
        
        <div className="flex-1 h-full bg-muted/30 overflow-hidden">
          <EditorComponent 
            isEditing={isEditing}
            editableSql={editableSql}
            sqlContent={sqlContent}
            setEditableSql={setEditableSql}
          />
        </div>
      </div>
    </BaseSidebar>
  );
}