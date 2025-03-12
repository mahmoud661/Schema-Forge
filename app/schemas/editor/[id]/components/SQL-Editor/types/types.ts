export interface SqlEditorSettings {
  caseSensitiveIdentifiers: boolean;
  useInlineConstraints: boolean;
}

export interface SqlEditorState {
  appliedSql: string;
  dbType: string;
  sqlContent: string;
  editableSql: string;
  isEditing: boolean;
  error: string | null;
  liveEditMode: boolean;
}
