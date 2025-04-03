import React, { useEffect } from "react";
import EditorComponent from "../EditorComponent";
import { useSqlEditorStore } from "../../../store/sql-editor-store";

interface SqlEditorContentProps {
  error: string | null;
  isEditing: boolean;
  sqlCode: string;
  editingSqlCode: string;
  setEditingSqlCode: (sql: string) => void;
  isAiEditing?: boolean; // Keep for backward compatibility
  successAnimation?: boolean; // Keep for backward compatibility
}

export function SqlEditorContent({
  error,
  isEditing,
  sqlCode,
  editingSqlCode,
  setEditingSqlCode,
}: SqlEditorContentProps) {
  // Get state directly from the store
  const isAiEditing = useSqlEditorStore(state => state.isAiEditing);
  const successAnimation = useSqlEditorStore(state => state.successAnimation);
  const clearError = useSqlEditorStore(state => state.clearError);
  
  // Clear error when switching to AI editing mode
  useEffect(() => {
    if (isAiEditing) {
      clearError();
    }
  }, [isAiEditing, clearError]);
  
  // Clear error when SQL code changes
  useEffect(() => {
    if (sqlCode && sqlCode.trim().length > 0) {
      clearError();
    }
  }, [sqlCode, clearError]);
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {error && !isAiEditing && (
        <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive overflow-auto">
          <p className="mb-2 font-medium">{error}</p>
          <details className="text-xs opacity-80">
            <summary>Show troubleshooting info</summary>
            <p className="mt-2">If your foreign keys are not showing up, make sure the table names and column names match exactly (including case).</p>
            <p className="mt-1">The ALTER TABLE statement should look like: ALTER TABLE "Table1" ADD CONSTRAINT name FOREIGN KEY ("column") REFERENCES "Table2"("column");</p>
            <p className="mt-2"><strong>Recommended Settings:</strong></p>
            <ul className="list-disc list-inside ml-2">
              <li>Database Type: PostgreSQL</li>
              <li>Case Sensitive Identifiers: Off</li>
              <li>Use Inline Constraints: On</li>
            </ul>
          </details>
        </div>
      )}
      
      {isAiEditing && !error && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/30 text-violet-700 dark:text-violet-300 p-3 m-4 rounded-md flex items-center gap-2">
          <div className="min-w-0">
            <p className="font-medium">AI is generating SQL schema</p>
            <p className="text-xs text-muted-foreground mt-0.5">The AI is creating SQL code based on your request. Please wait...</p>
          </div>
        </div>
      )}
      
      {!isAiEditing && !error && successAnimation && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-300 p-3 m-4 rounded-md flex items-center gap-2 transition-opacity duration-1000 opacity-100">
          <div className="min-w-0 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Schema Applied Successfully!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The SQL has been parsed and applied to your database schema
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className={`flex-1 h-full bg-muted/30 overflow-hidden ${successAnimation ? 'success-flash' : ''}`}>
        <EditorComponent 
          isEditing={isEditing}
          sqlCode={isEditing ? editingSqlCode : sqlCode}
          onChange={isEditing ? setEditingSqlCode : undefined}
        />
      </div>
    </div>
  );
}
