# SQL Editor Component: In-Depth Technical Guide

## Overview

The SQL Editor is a key component of the schema editor application that provides bidirectional editing capabilities between visual database schema diagrams and SQL code. It allows users to both:

1. Generate SQL from the visual schema design
2. Update the visual schema by editing raw SQL

This document explains the technical architecture, data flow, and integration points of the SQL Editor component.

## Architecture Components

The SQL Editor functionality is organized into several key components:

### 1. UI Components

- **SqlEditor.tsx**: The main container component that orchestrates all SQL functionality
- **SqlHeaderControls.tsx**: Controls for database type selection, editing, and download options
- **SqlCodeMirror.tsx**: The CodeMirror editor wrapper for SQL editing
- **SqlErrorNotice.tsx**: Component for displaying validation errors

### 2. Service Layer

- **sql-parser.ts**: Contains logic for parsing SQL statements into schema nodes and edges
- **sql-generator.ts**: Logic for generating SQL from schema nodes and edges
- **sql-types.ts**: Mapping utilities between SQL types and schema types
- **sql-validation.ts**: Validates SQL syntax and provides error messages

### 3. Integration Points

- **schema-flow.tsx**: The main flow component that coordinates all editor functionality
- **use-sql-editor.ts**: A custom hook that manages SQL editor state and operations
- **use-schema-flow.ts**: A hook that manages the overall schema flow state

## Data Flow

The SQL Editor follows a clear data flow pattern:

### Visual Schema → SQL Generation

1. When the schema (nodes and edges) changes in the visual editor:
   - The `use-sql-editor` hook detects these changes
   - `generateSql()` is called with the current nodes, edges, and selected DB type
   - The SQL representation is created and displayed in the editor

2. SQL generation process:
   - Tables are created from each node
   - Row definitions are built from node schema data
   - Foreign key constraints are derived from edge connections
   - SQL dialect-specific formatting is applied based on the selected database type

### SQL Editing → Visual Schema

1. When users edit SQL and apply changes:
   - The `applySqlChanges()` function is triggered
   - SQL is validated for syntax errors
   - If valid, the SQL is parsed into nodes and edges
   - The schema is updated, which triggers a re-render of the visual representation

2. SQL parsing process:
   - `CREATE TABLE` statements are extracted and parsed into nodes
   - Row definitions are parsed into schema properties
   - Constraints (PRIMARY KEY, FOREIGN KEY, etc.) are identified
   - Relationships between tables are extracted and converted to edges

## SQL Parsing In Detail

The SQL parser (`sql-parser.ts`) uses regex-based parsing with specific handling for:

### Table Extraction

```typescript
const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w"`\[\]]+)\s*\(/gi;
```

This regex accounts for different quoting styles and optional "IF NOT EXISTS" clauses.

### Row Parsing

Columns are extracted by:

- Splitting the table content by commas (carefully handling commas inside parentheses)
- Parsing individual row definitions with type and constraints
- Handling quoted identifiers in various formats

```typescript
const columns = [];
const columnLines = tableContent
  .split(/,(?![^(]*\))/)
  .map(line => line.trim())
  .filter(line => line.length > 0);
```

### Relationship Detection

Foreign key relationships are detected through:

- Standalone `FOREIGN KEY` constraints
- Inline `REFERENCES` clauses in row definitions
- `ALTER TABLE ADD FOREIGN KEY` statements

These are then converted to edges in the visual representation.

## SQL Generation In Detail

The SQL generator (`sql-generator.ts`) creates SQL statements from the schema by:

### Table Generation

For each node in the schema, a `CREATE TABLE` statement is generated with:

- Table name derived from the node label
- Columns generated from the node schema
- Primary key and other constraints based on row properties

### Constraint Generation

- `PRIMARY KEY` constraints are added to columns with the 'primary' constraint
- `FOREIGN KEY` constraints are generated from edges connecting nodes
- Indexes are created for columns marked with the 'index' constraint

### Database-Specific Syntax

```typescript
if (dbType === "postgresql") {
  sql += generatePostgresTable(node);
} else if (dbType === "mysql") {
  sql += generateMySqlTable(node);
} else if (dbType === "sqlite") {
  sql += generateSqliteTable(node);
}
```

Each dialect has specific type mappings and syntax rules.

## Validation and Error Handling

### Syntax Validation

- Checks for basic syntax issues like mismatched parentheses
- Validates table definitions and row syntax
- Detects duplicate table and row names

### Foreign Key Validation

- Verifies that referenced tables exist
- Checks that row references are valid

### Error Display

Validation errors are:

- Stored in the error state
- Displayed in the `SqlErrorNotice` component
- Categorized as critical (blocking) or warning (non-blocking)

## Live Editing Mode

The SQL Editor supports a live editing mode that:

- Automatically applies changes as the user types (with debouncing)
- Provides immediate visual feedback on the schema diagram
- Shows errors without interrupting the workflow

```typescript
useEffect(() => {
  if (isEditing && liveEditMode && debouncedSql) {
    handleApplySqlChangesInternal(debouncedSql, true);
  }
}, [debouncedSql, liveEditMode, isEditing]);
```

## SQL Export Functionality

Users can export the generated SQL with:

```typescript
const handleDownload = () => {
  const blob = new Blob([isEditing ? editableSql : sqlContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `schema_${dbType}_${new Date().toISOString().slice(0, 10)}.sql`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

## Conclusion

The SQL Editor component provides a powerful interface between visual schema design and raw SQL editing. It enables users to leverage the strengths of both approaches:

- **Visual editing** for intuitive relationship modeling and quick changes
- **SQL editing** for precise control and advanced database features

This bidirectional approach ensures that users can work in their preferred style while maintaining a consistent schema representation.
