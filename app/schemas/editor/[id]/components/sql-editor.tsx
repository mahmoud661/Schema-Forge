"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { generateSql } from "./SQL-Editor/sqlGenerators";
import { parseSqlToSchema } from "./SQL-Editor/sqlParser";
import EditorComponent from "./SQL-Editor/EditorComponent";
import { validateSqlSyntax, fixCommonSqlIssues } from "./SQL-Editor/sql-validation"; // unchanged

// Types
interface SqlEditorProps {
  nodes: SchemaNode[];
  edges: any[];
  onUpdateSchema: (nodes: SchemaNode[], edges: any[]) => void;
}

// Main SQL Editor Component
export function SqlEditor({ nodes, edges, onUpdateSchema }: SqlEditorProps) {
  // New state to store last applied SQL
  const [appliedSql, setAppliedSql] = useState<string>("");
  const [dbType, setDbType] = useState<string>("postgresql");
  const [sqlContent, setSqlContent] = useState<string>("");
  const [editableSql, setEditableSql] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  const { widths, updateWidth } = useSidebarStore();
  
  // On mount, generate initial SQL once and store it
  useEffect(() => {
    const initialSql = generateSql(dbType, nodes, edges);
    setAppliedSql(initialSql);
    setSqlContent(initialSql);
    setEditableSql(initialSql);
  }, []); // run only once
  
  // Remove regeneration on dependency changes so that appliedSql is preserved
  
  // Effect for live updates when SQL changes
  useEffect(() => {
    if (isEditing && liveEditMode && editableSql) {
      handleApplySqlChangesInternal(editableSql, true);
    }
  }, [editableSql, liveEditMode, isEditing]);

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
        const criticalErrors = validation.errors.filter(err => 
          err.includes("cannot be empty") || 
          err.includes("must contain at least one CREATE TABLE")
        );
        if (criticalErrors.length > 0) {
          setError(criticalErrors[0]);
          return;
        } else if (!isLiveUpdate) {
          console.warn("SQL potential issues:", validation.errors);
          toast.warning("SQL has potential issues but will be processed anyway");
        }
      }
      
      try {
        const parsedSchema = parseSqlToSchema(processedSql);
        if (parsedSchema) {
          console.log("Parsed schema:", { 
            tables: parsedSchema.nodes.map(n => n.data.label),
            edges: parsedSchema.edges.length,
            sql: processedSql 
          });
          onUpdateSchema(parsedSchema.nodes, parsedSchema.edges);
          if (!isLiveUpdate) {
            // Save the user's SQL exactly as applied
            setAppliedSql(processedSql);
            setSqlContent(processedSql);
            setIsEditing(false);
            toast.success("Schema updated successfully");
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
    >
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive overflow-scroll">
          {error}
        </div>
      )}
      
      <div className="flex-1 h-full bg-muted/30">
        <EditorComponent 
          isEditing={isEditing}
          editableSql={editableSql}
          sqlContent={sqlContent}
          setEditableSql={setEditableSql}
        />
      </div>
    </BaseSidebar>
  );
}