"use client";
import React, { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface EditorComponentProps {
  isEditing: boolean;
  sqlCode: string;
  onChange?: (sql: string) => void;
  isAiEditing?: boolean;
  successAnimation?: boolean; // Add success animation
}

const EditorComponent = ({ 
  isEditing, 
  sqlCode, 
  onChange, 
  isAiEditing = false,
  successAnimation = false
}: EditorComponentProps) => {
  const [showSuccess, setShowSuccess] = useState(false);

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
      {isAiEditing && (
        <div className="absolute top-0 right-0 z-10 bg-violet-600/95 text-white px-3 py-1 rounded-bl-md flex items-center gap-1.5 text-xs font-medium">
          <span className="inline-block h-2 w-2 bg-white rounded-full animate-pulse"></span>
          AI is editing SQL...
        </div>
      )}
      
      {showSuccess && (
        <div className="absolute top-0 right-0 z-10 bg-green-600/95 text-white px-3 py-1 rounded-bl-md flex items-center gap-1.5 text-xs font-medium animate-fadeIn">
          <span className="inline-block h-2 w-2 bg-white rounded-full"></span>
          Schema Applied Successfully!
        </div>
      )}
      
      <CodeMirror
        value={sqlCode}
        onChange={isEditing ? onChange : undefined}
        readOnly={!isEditing}
        height="100%"
        theme={vscodeDark}
        extensions={[sql()]}
        basicSetup={isEditing ? editConfig : editorConfig}
        className={`h-full min-h-[500px] ${isAiEditing ? 'ai-editing-border' : ''} ${showSuccess ? 'success-border' : ''}`}
      />
    </div>
  );
};

export default EditorComponent;
