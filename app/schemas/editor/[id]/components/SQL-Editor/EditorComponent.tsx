"use client";
import React, { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { useSqlEditorStore } from "../../store/sql-editor-store";

interface EditorComponentProps {
  isEditing: boolean;
  sqlCode: string;
  onChange?: (sql: string) => void;
  isAiEditing?: boolean; // Keep for backward compatibility
  successAnimation?: boolean; // Keep for backward compatibility
  debug?: boolean;
}

const EditorComponent = ({
  isEditing,
  sqlCode,
  onChange,
  debug = true,
}: EditorComponentProps) => {
  // Get state directly from the store
  const isAiEditing = useSqlEditorStore((state) => state.isAiEditing);
  const successAnimation = useSqlEditorStore((state) => state.successAnimation);

  const [showSuccess, setShowSuccess] = useState(false);

  // Debug logging for important state changes
  useEffect(() => {
    if (debug) {
      console.log(`[SQL Editor Debug] isAiEditing changed to: ${isAiEditing}`);
    }
  }, [isAiEditing, debug]);

  // Handle success animation
  useEffect(() => {
    if (successAnimation) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [successAnimation]);

  const editorConfig = {
    lineNumbers: true,
    highlightSpecialChars: true,
    foldGutter: true,
    syntaxHighlighting: true,
    bracketMatching: true,
  };

  const editConfig = {
    ...editorConfig,
    highlightActiveLineGutter: true,
    dropCursor: true,
    allowMultipleSelections: true,
    indentOnInput: true,
    closeBrackets: true,
    autocompletion: true,
    rectangularSelection: true,
    crosshairCursor: true,
    highlightSelectionMatches: true,
    indentUnit: 2,
  };

  return (
    <div className="relative h-full">
      <CodeMirror
        value={sqlCode}
        onChange={isEditing ? onChange : undefined}
        readOnly={!isEditing}
        height="100%"
        theme={vscodeDark}
        extensions={[sql()]}
        basicSetup={isEditing ? editConfig : editorConfig}
        className={`h-full min-h-[500px] ${
          isAiEditing ? "ai-editing-border" : ""
        } ${showSuccess ? "success-border" : ""}`}
      />
    </div>
  );
};

export default EditorComponent;
