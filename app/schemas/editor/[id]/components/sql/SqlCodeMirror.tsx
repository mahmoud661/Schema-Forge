import React from "react";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface SqlCodeMirrorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function SqlCodeMirror({ value, onChange, readOnly = false }: SqlCodeMirrorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      height="100%"
      theme={vscodeDark}
      extensions={[sql()]}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: !readOnly,
        highlightSpecialChars: true,
        foldGutter: true,
        dropCursor: !readOnly,
        allowMultipleSelections: !readOnly,
        indentOnInput: !readOnly,
        syntaxHighlighting: true,
        bracketMatching: true,
        closeBrackets: !readOnly,
        autocompletion: !readOnly,
        rectangularSelection: !readOnly,
        crosshairCursor: !readOnly,
        highlightSelectionMatches: !readOnly,
        indentUnit: 2,
      }}
      className="h-full min-h-[500px]"
    />
  );
}
