"use client";

import React, { useEffect } from "react";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { useSqlEditor } from "./SQL-Editor/hooks/use-sql-editor";
import { SqlEditorHeader } from "./SQL-Editor/components/sql-editor-header";
import { SqlEditorContent } from "./SQL-Editor/components/sql-editor-content";
import { useSqlEditorStore } from "../store/sql-editor-store";

// Main SQL Editor Component
export function SqlEditor() {
  const { widths, updateWidth } = useSidebarStore();
  const sqlEditor = useSqlEditor();
  
  // Get isAiEditing directly from the store
  const isAiEditing = useSqlEditorStore(state => state.isAiEditing);
  
  // Add debug logging for isAiEditing changes
  useEffect(() => {
    console.log(`[Main SqlEditor] isAiEditing state: ${isAiEditing}`);
  }, [isAiEditing]);
  
  return (
    <BaseSidebar 
      title={isAiEditing ? "SQL Editor (AI Editing)" : "SQL Editor"}
      width={widths.sql}
      onWidthChange={(width) => updateWidth('sql', width)}
      maxWidth={1500}
      headerActions={
        <SqlEditorHeader 
          dbType={sqlEditor.dbType}
          setDbType={sqlEditor.setDbType}
          isEditing={sqlEditor.isEditing}
          setIsEditing={sqlEditor.setIsEditing}
          liveEditMode={sqlEditor.liveEditMode}
          setLiveEditMode={sqlEditor.setLiveEditMode}
          handleDownload={sqlEditor.handleDownload}
          handleApplySqlChanges={sqlEditor.handleApplySqlChanges}
          cancelEdit={sqlEditor.cancelEdit}
          settings={sqlEditor.settings}
          handleToggleCaseSensitive={sqlEditor.handleToggleCaseSensitive}
          handleToggleInlineConstraints={sqlEditor.handleToggleInlineConstraints}
          enumTypes={sqlEditor.enumTypes}
          isAiEditing={isAiEditing}
        />
      }
      headerClassName="p-4"
      collapsible={true}
      position="left"
    >
      <SqlEditorContent 
        error={sqlEditor.error}
        isEditing={sqlEditor.isEditing}
        sqlCode={sqlEditor.sqlCode}
        editingSqlCode={sqlEditor.editingSqlCode}
        setEditingSqlCode={sqlEditor.setEditingSqlCode}
      />
    </BaseSidebar>
  );
}