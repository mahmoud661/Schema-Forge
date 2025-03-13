"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSqlEditor as useOriginalSqlEditor } from './use-sql-editor';

// Create a context for the SQL editor state
const SqlEditorContext = createContext<ReturnType<typeof useOriginalSqlEditor> | undefined>(undefined);

// Provider component
export function SqlEditorProvider({ children }: { children: ReactNode }) {
  const sqlEditorState = useOriginalSqlEditor();
  
  // Debug useEffect to monitor isAiEditing changes
  React.useEffect(() => {
    console.log(`[SqlEditorProvider] isAiEditing changed to: ${sqlEditorState.isAiEditing}`);
  }, [sqlEditorState.isAiEditing]);

  return (
    <SqlEditorContext.Provider value={sqlEditorState}>
      {children}
    </SqlEditorContext.Provider>
  );
}

// Hook to use the SQL editor context
export function useSharedSqlEditor() {
  const context = useContext(SqlEditorContext);
  if (context === undefined) {
    throw new Error('useSharedSqlEditor must be used within a SqlEditorProvider');
  }
  return context;
}
