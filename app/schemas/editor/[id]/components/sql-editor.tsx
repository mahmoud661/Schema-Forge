"use client";

import React from "react";
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";
import { useSqlEditor } from "./SQL-Editor/hooks/use-sql-editor";
import { SqlEditorHeader } from "./SQL-Editor/components/sql-editor-header";
import { SqlEditorContent } from "./SQL-Editor/components/sql-editor-content";

// Main SQL Editor Component
export function SqlEditor() {
  const { widths, updateWidth } = useSidebarStore();
  const sqlEditor = useSqlEditor();
  
  return (
    <BaseSidebar 
      title="SQL Editor"
      width={widths.sql}
      onWidthChange={(width) => updateWidth('sql', width)}
      maxWidth={800}
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