"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../../store/sidebar-store";
import { SchemaNode } from "../../types";
import { useSqlEditor } from "../../hooks/use-sql-editor";
import { SqlHeaderControls } from "./SqlHeaderControls";
import { SqlCodeMirror } from "./SqlCodeMirror";
import { SqlErrorNotice } from "./SqlErrorNotice";

interface SqlEditorProps {
  nodes: SchemaNode[];
  edges: any[];
  onUpdateSchema: (nodes: SchemaNode[], edges: any[]) => void;
}

export function SqlEditor({ nodes, edges, onUpdateSchema }: SqlEditorProps) {
  const { widths, updateWidth } = useSidebarStore();
  
  const {
    dbType,
    setDbType,
    sqlContent,
    editableSql,
    setEditableSql,
    isEditing,
    setIsEditing,
    error,
    setError,
    liveEditMode,
    setLiveEditMode,
    downloadSql,
    applySqlChanges,
    cancelEdit,
    toggleEditMode
  } = useSqlEditor({ 
    nodes, 
    edges, 
    onUpdateSchema,
    onSuccess: () => toast.success("Schema updated successfully"),
    onError: (message) => toast.error(message || "Failed to update schema")
  });

  return (
    <BaseSidebar 
      title="SQL Editor"
      width={widths.sql}
      onWidthChange={(width) => updateWidth('sql', width)}
      maxWidth={800}
      headerActions={
        <SqlHeaderControls
          dbType={dbType}
          onDbTypeChange={setDbType}
          isEditing={isEditing}
          onEdit={toggleEditMode}
          onApply={applySqlChanges}
          onCancel={cancelEdit}
          onDownload={downloadSql}
          liveEditMode={liveEditMode}
          onLiveEditModeChange={setLiveEditMode}
        />
      }
      headerClassName="p-4 flex-col gap-3 sm:flex-row"
    >
      {error && <SqlErrorNotice error={error} />}
      
      <div className="flex-1 h-full bg-muted/30">
        <SqlCodeMirror 
          value={isEditing ? editableSql : sqlContent}
          onChange={isEditing ? setEditableSql : undefined}
          readOnly={!isEditing}
        />
      </div>
    </BaseSidebar>
  );
}
