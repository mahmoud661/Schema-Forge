"use client";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface EditorComponentProps {
  isEditing: boolean;
  sqlCode: string;
  onChange?: (sql: string) => void;
}

const EditorComponent = ({ isEditing, sqlCode, onChange }: EditorComponentProps) => {
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
    <CodeMirror
      value={sqlCode}
      onChange={isEditing ? onChange : undefined}
      readOnly={!isEditing}
      height="100%"
      theme={vscodeDark}
      extensions={[sql()]}
      basicSetup={isEditing ? editConfig : editorConfig}
      className="h-full min-h-[500px]"
    />
  );
};

export default EditorComponent;
