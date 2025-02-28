"use client";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface EditorComponentProps {
  isEditing: boolean;
  editableSql: string;
  sqlContent: string;
  setEditableSql: (sql: string) => void;
}

const EditorComponent = ({ isEditing, editableSql, sqlContent, setEditableSql }: EditorComponentProps) => {
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
  return isEditing ? (
    <CodeMirror
      value={editableSql}
      onChange={setEditableSql}
      height="100%"
      theme={vscodeDark}
      extensions={[sql()]}
      basicSetup={editConfig}
      className="h-full min-h-[500px]"
    />
  ) : (
    <CodeMirror
      value={sqlContent}
      readOnly={true}
      height="100%"
      theme={vscodeDark}
      extensions={[sql()]}
      basicSetup={editorConfig}
      className="h-full min-h-[500px]"
    />
  );
};

export default EditorComponent;
