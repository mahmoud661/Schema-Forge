import React from "react";
import EditorComponent from "../EditorComponent";

interface SqlEditorContentProps {
  error: string | null;
  isEditing: boolean;
  sqlCode: string;
  editingSqlCode: string;
  setEditingSqlCode: (sql: string) => void;
}

export function SqlEditorContent({
  error,
  isEditing,
  sqlCode,
  editingSqlCode,
  setEditingSqlCode
}: SqlEditorContentProps) {
  return (
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
          sqlCode={isEditing ? editingSqlCode : sqlCode}
          onChange={isEditing ? setEditingSqlCode : undefined}
        />
      </div>
    </div>
  );
}
