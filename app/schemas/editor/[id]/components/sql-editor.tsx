"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, X } from "lucide-react";
import { SchemaNode } from "../types";
import { toast } from "sonner";
import { validateSqlSyntax, fixCommonSqlIssues } from "./sql-validation";
import { useDebounce } from "use-debounce";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { BaseSidebar } from "@/components/ui/sidebar";
import { useSidebarStore } from "../store/sidebar-store";

interface SqlEditorProps {
  nodes: SchemaNode[];
  edges: any[];
  onUpdateSchema: (nodes: SchemaNode[], edges: any[]) => void;
}

export function SqlEditor({ nodes, edges, onUpdateSchema }: SqlEditorProps) {
  const [dbType, setDbType] = useState<string>("postgresql");
  const [sqlContent, setSqlContent] = useState<string>("");
  const [editableSql, setEditableSql] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [liveEditMode, setLiveEditMode] = useState<boolean>(false);
  const { widths, updateWidth } = useSidebarStore();
  
  // Debounce the SQL changes for live updates
  const [debouncedSql] = useDebounce(editableSql, 1000);
  
  useEffect(() => {
    // Generate SQL based on nodes and edges
    const generatedSql = generateSql(dbType, nodes, edges);
    setSqlContent(generatedSql);
    if (!isEditing) {
      setEditableSql(generatedSql);
    }
  }, [nodes, edges, dbType, isEditing]);
  
  // Effect for live updates when SQL changes
  useEffect(() => {
    if (isEditing && liveEditMode && debouncedSql) {
      handleApplySqlChangesInternal(debouncedSql, true);
    }
  }, [debouncedSql, liveEditMode, isEditing]);

  const generateSql = (type: string, schemaNodes: SchemaNode[], schemaEdges: any[]): string => {
    let sql = "";
    
    // Add SQL header comment
    sql += `-- Generated ${new Date().toLocaleString()} for ${type.toUpperCase()}\n`;
    sql += `-- Edit this SQL and apply changes to update your schema\n\n`;
    
    // Create tables
    schemaNodes.forEach(node => {
      if (type === "postgresql") {
        sql += generatePostgresTable(node);
      } else if (type === "mysql") {
        sql += generateMySqlTable(node);
      } else if (type === "sqlite") {
        sql += generateSqliteTable(node);
      }
      sql += "\n\n";
    });
    
    // Create foreign keys
    if (schemaEdges.length > 0) {
      sql += "-- Foreign Key Constraints\n";
      schemaEdges.forEach(edge => {
        const sourceNode = schemaNodes.find(n => n.id === edge.source);
        const targetNode = schemaNodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          // Extract column names from the handles
          const sourceColumn = edge.sourceHandle?.split('-')[1] || 'id';
          const targetColumn = edge.targetHandle?.split('-')[1] || 'id';
          
          const sourceTableName = getQuotedTableName(sourceNode.data.label);
          const targetTableName = getQuotedTableName(targetNode.data.label);
          
          if (type === "postgresql" || type === "mysql") {
            sql += `ALTER TABLE ${sourceTableName} ADD CONSTRAINT fk_${sourceNode.data.label.toLowerCase().replace(/\s/g, '_')}_${targetNode.data.label.toLowerCase().replace(/\s/g, '_')} `;
            sql += `FOREIGN KEY ("${sourceColumn}") REFERENCES ${targetTableName}("${targetColumn}");\n`;
          } else if (type === "sqlite") {
            // SQLite doesn't support ALTER TABLE ADD CONSTRAINT
            sql += `-- For SQLite, foreign keys would be defined in the CREATE TABLE statement\n`;
          }
        }
      });
    }
    
    return sql;
  };
  
  // Helper function to properly quote table names with spaces
  const getQuotedTableName = (tableName: string): string => {
    return tableName.includes(' ') ? `"${tableName}"` : `"${tableName.toLowerCase()}"`;
  };
  
  const generatePostgresTable = (node: SchemaNode) => {
    const tableName = getQuotedTableName(node.data.label);
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    node.data.schema.forEach((column, index) => {
      // Quote column names if they contain spaces
      const columnName = column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`;
      sql += `  ${columnName} ${column.type}`;
      
      if (column.constraints) {
        if (column.constraints.includes('primary')) {
          sql += ' PRIMARY KEY';
        }
        if (column.constraints.includes('notnull')) {
          sql += ' NOT NULL';
        }
        if (column.constraints.includes('unique')) {
          sql += ' UNIQUE';
        }
      }
      
      if (index < node.data.schema.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });
    
    sql += ');';
    
    // Add indexes
    node.data.schema.forEach(column => {
      if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
        sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase().replace(/\s/g, '_')}_${column.title.replace(/\s/g, '_')} ON ${tableName} (${column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`});`;
      }
    });
    
    return sql;
  };
  
  // MySQL and SQLite table generation functions remain similar but with quoting
  const generateMySqlTable = (node: SchemaNode) => {
    const tableName = getQuotedTableName(node.data.label);
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    node.data.schema.forEach((column, index) => {
      // Map PostgreSQL types to MySQL types
      let mysqlType = column.type;
      if (column.type === 'uuid') mysqlType = 'VARCHAR(36)';
      if (column.type === 'text') mysqlType = 'TEXT';
      if (column.type === 'int4') mysqlType = 'INT';
      if (column.type === 'timestamp') mysqlType = 'DATETIME';
      
      // Quote column names if they contain spaces
      const columnName = column.title.includes(' ') ? `"${column.title}"` : column.title;
      sql += `  ${columnName} ${mysqlType}`;
      
      if (column.constraints) {
        if (column.constraints.includes('primary')) {
          sql += ' PRIMARY KEY';
        }
        if (column.constraints.includes('notnull')) {
          sql += ' NOT NULL';
        }
        if (column.constraints.includes('unique')) {
          sql += ' UNIQUE';
        }
      }
      
      if (index < node.data.schema.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });
    
    sql += ') ENGINE=InnoDB;';
    
    // Add indexes
    node.data.schema.forEach(column => {
      if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
        sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
      }
    });
    
    return sql;
  };
  
  const generateSqliteTable = (node: SchemaNode) => {
    const tableName = getQuotedTableName(node.data.label);
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    node.data.schema.forEach((column, index) => {
      // Map PostgreSQL types to SQLite types
      let sqliteType = column.type;
      if (column.type === 'uuid') sqliteType = 'TEXT';
      if (column.type === 'int4') sqliteType = 'INTEGER';
      if (column.type === 'timestamp') sqliteType = 'DATETIME';
      if (column.type === 'money') sqliteType = 'REAL';
      
      // Quote column names if they contain spaces
      const columnName = column.title.includes(' ') ? `"${column.title}"` : column.title;
      sql += `  ${columnName} ${sqliteType}`;
      
      if (column.constraints) {
        if (column.constraints.includes('primary')) {
          sql += ' PRIMARY KEY';
        }
        if (column.constraints.includes('notnull')) {
          sql += ' NOT NULL';
        }
        if (column.constraints.includes('unique')) {
          sql += ' UNIQUE';
        }
      }
      
      if (index < node.data.schema.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });
    
    sql += ');';
    
    // Add indexes
    node.data.schema.forEach(column => {
      if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
        sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
      }
    });
    
    return sql;
  };

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

  const handleApplySqlChangesInternal = (sql: string, isLiveUpdate = false) => {
    try {
      setError(null);
      if (!sql.trim()) {
        setError("SQL cannot be empty");
        return;
      }
      
      // Only auto-fix common issues when not in live mode to avoid unnecessary reformatting
      let processedSql = sql;
      if (!isLiveUpdate) {
        // Store original SQL for comparison
        const originalSql = sql;
        const fixedSql = fixCommonSqlIssues(sql);
        
        if (fixedSql !== originalSql) {
          console.log("SQL was modified by auto-fix");
          toast.info("Some SQL syntax issues were automatically fixed");
          setEditableSql(fixedSql);
          processedSql = fixedSql;
        }
      }
      
      // Validate SQL before parsing - but don't block on non-critical errors
      const validation = validateSqlSyntax(processedSql);
      if (!validation.isValid) {
        // Only block on critical errors, warn on others
        const criticalErrors = validation.errors.filter(err => 
          err.includes("cannot be empty") || 
          err.includes("must contain at least one CREATE TABLE")
        );
        
        if (criticalErrors.length > 0) {
          setError(criticalErrors[0]);
          return;
        } else if (!isLiveUpdate) {
          // Just warn for non-critical errors in manual mode
          toast.warning("SQL has potential issues but will be processed anyway");
        }
      }
      
      // Parse SQL to schema - wrap in try/catch to handle parsing errors
      try {
        const parsedSchema = parseSqlToSchema(processedSql);
        if (parsedSchema) {
          // Log some debug info before updating schema
          console.log("Parsed schema:", { 
            tables: parsedSchema.nodes.map(n => n.data.label),
            edges: parsedSchema.edges.length,
            sql: processedSql 
          });
          
          // Update the schema with parsed results
          onUpdateSchema(parsedSchema.nodes, parsedSchema.edges);
          
          if (!isLiveUpdate) {
            setIsEditing(false);
            toast.success("Schema updated successfully");
          }
        }
      } catch (parseError) {
        console.error("SQL parsing error:", parseError);
        setError(`SQL parsing failed: ${parseError.message}`);
        if (!isLiveUpdate) {
          toast.error(`Failed to parse SQL: ${parseError.message}`);
        }
        return;
      }
    } catch (error) {
      console.error("SQL application error:", error);
      setError(error.message || "An error occurred while processing SQL");
      if (!isLiveUpdate) {
        toast.error("Failed to update schema");
      }
    }
  };

  // Improved SQL parsing function with better regex for edge handling
  const parseSqlToSchema = (sql: string): { nodes: SchemaNode[], edges: any[] } | null => {
    try {
      const newNodes: SchemaNode[] = [];
      const newEdges: any[] = [];
      const tableMap: Record<string, string> = {}; // Maps table names to node IDs
      
      // Extract CREATE TABLE statements - improved regex to better handle quoted names
      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
      
      let tableMatch;
      let tableIndex = 0;
      let foundTables = false;
      
      // Process each table definition
      while ((tableMatch = tableRegex.exec(sql)) !== null) {
        foundTables = true;
        // The table name can be in any of the capture groups depending on the quote style used
        const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3] || tableMatch[4];
        const tableContent = tableMatch[5];
        
        if (!tableName || !tableContent) continue;
        
        // Check for duplicate table names
        const normalizedName = tableName.toLowerCase();
        const nodeId = `sql-node-${Date.now()}-${tableIndex}`;
        
        // Store table name to node ID mapping
        tableMap[normalizedName] = nodeId;
        
        // Process columns
        const columns = [];
        // Split by commas, but be smarter about it to handle cases with commas in type definitions
        const columnLines = tableContent
          .split(/,(?![^(]*\))/) // Split by commas not inside parentheses
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Track column names to prevent duplicates
        const columnNames = new Set();
        
        // Store foreign key constraints to process later
        const foreignKeys = [];
        
        for (const columnLine of columnLines) {
          // Check for standalone PRIMARY KEY constraint
          if (columnLine.toUpperCase().includes('PRIMARY KEY')) {
            const pkMatch = /PRIMARY\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(columnLine);
            if (pkMatch) {
              const pkColumnName = pkMatch[1].trim();
              // Find this column and add primary constraint
              const existingColumn = columns.find(col => col.title.toLowerCase() === pkColumnName.toLowerCase());
              if (existingColumn) {
                if (!existingColumn.constraints) existingColumn.constraints = [];
                if (!existingColumn.constraints.includes('primary')) {
                  existingColumn.constraints.push('primary');
                }
              }
              continue;
            }
          }
          
          // Check for standalone FOREIGN KEY constraint
          if (columnLine.toUpperCase().includes('FOREIGN KEY')) {
            // FOREIGN KEY (column_name) REFERENCES table_name(ref_column)
            const fkMatch = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(columnLine);
            if (fkMatch) {
              foreignKeys.push({
                sourceColumn: fkMatch[1].trim(),
                targetTable: fkMatch[2].trim(),
                targetColumn: fkMatch[3].trim()
              });
              continue;
            }
          }
          
          // Skip other constraint lines that don't define columns
          if (columnLine.toUpperCase().startsWith('CONSTRAINT')) {
            continue;
          }
          
          // More flexible column parsing regex
          const columnRegex = /^(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
          const columnMatch = columnLine.match(columnRegex);
          
          if (columnMatch) {
            // Column name can be in any of these capture groups depending on quoting
            let columnName = columnMatch[1] || columnMatch[2] || columnMatch[3] || columnMatch[4];
            let columnType = columnMatch[5];
            const constraintText = columnMatch[6] || '';
            const constraints = [];
            
            // Handle SERIAL type which implies PRIMARY KEY
            if (columnType.toUpperCase() === 'SERIAL') {
              columnType = 'int4';
              constraints.push('primary');
            }
            
            if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
            if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
            if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
            
            // Check for inline foreign key reference
            const inlineFkMatch = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(constraintText);
            if (inlineFkMatch) {
              foreignKeys.push({
                sourceColumn: columnName,
                targetTable: inlineFkMatch[1].trim(),
                targetColumn: inlineFkMatch[2].trim()
              });
            }
            
            // Ensure no duplicate column names in same table
            if (columnNames.has(columnName.toLowerCase())) {
              // Add suffix to make unique
              let suffix = 1;
              let newName = `${columnName}_${suffix}`;
              while (columnNames.has(newName.toLowerCase())) {
                suffix++;
                newName = `${columnName}_${suffix}`;
              }
              columnName = newName;
            }
            
            columnNames.add(columnName.toLowerCase());
            
            columns.push({
              title: columnName,
              type: mapToBaseType(columnType),
              constraints,
              id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
          }
        }
        
        // Only add the table if we found at least one valid column
        if (columns.length > 0) {
          newNodes.push({
            id: nodeId,
            type: 'databaseSchema',
            position: { x: 100 + (tableIndex % 3) * 300, y: 100 + Math.floor(tableIndex / 3) * 200 },
            data: {
              label: tableName,
              schema: columns
            }
          });
          
          // Process foreign keys for this table
          for (const fk of foreignKeys) {
            const targetNodeId = tableMap[fk.targetTable.toLowerCase()];
            if (targetNodeId) {
              const sourceCol = cleanColumnName(fk.sourceColumn);
              const targetCol = cleanColumnName(fk.targetColumn) || "id";
              newEdges.push({
                id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source: nodeId,
                target: targetNodeId,
                sourceHandle: `source-${sourceCol}`,
                targetHandle: `target-${targetCol}`,
                type: 'smoothstep',
                animated: true,
                label: 'references',
                data: {
                  relationshipType: 'oneToMany'
                }
              });
            }
          }
          
          tableIndex++;
        }
      }
      
      // If no tables were found through regex, check if there's at least one CREATE TABLE statement
      if (!foundTables && sql.toUpperCase().includes('CREATE TABLE')) {
        throw new Error("SQL syntax appears to be invalid. Check for proper table definitions.");
      } else if (newNodes.length === 0) {
        throw new Error("No valid tables found in the SQL. Please check your syntax.");
      }
      
      // Extract ALTER TABLE foreign key constraints - improved regex to handle more formats
      // This regex is more permissive to handle different SQL dialects
      const fkRegex = /ALTER\s+TABLE\s+(?:`|"|')?([^`"'\s]+)(?:`|"|')?\s+ADD\s+(?:CONSTRAINT\s+(?:\w+)\s+)?FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/gi;
      
      let fkMatch;
      while ((fkMatch = fkRegex.exec(sql)) !== null) {
        const sourceTable = fkMatch[1];
        const sourceColumn = fkMatch[2];
        const targetTable = fkMatch[3];
        const targetColumn = fkMatch[4];
        
        // Use the table map to find the node IDs
        const sourceNodeId = tableMap[sourceTable.toLowerCase()];
        const targetNodeId = tableMap[targetTable.toLowerCase()];
          
        if (sourceNodeId && targetNodeId) {
          newEdges.push({
            id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: sourceNodeId,
            target: targetNodeId,
            sourceHandle: `source-${sourceColumn}`,
            targetHandle: `target-${targetColumn}`,
            type: 'smoothstep',
            animated: true,
            label: 'references',
            data: {
              relationshipType: 'oneToMany'
            }
          });
        }
      }
      
      // Process ON DELETE CASCADE and other FK options
      // Check for foreign keys with ON DELETE CASCADE or similar clauses
      const onDeleteRegex = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+ON\s+DELETE\s+CASCADE/gi;
      let onDeleteMatch;
      
      while ((onDeleteMatch = onDeleteRegex.exec(sql)) !== null) {
        // If we found an ON DELETE CASCADE clause, update the corresponding edge if it exists
        const sourceColumn = onDeleteMatch[1].trim();
        const targetTable = onDeleteMatch[2].trim();
        
        // Find the edge that matches this ON DELETE CASCADE clause
        for (const edge of newEdges) {
          const sourceHandle = edge.sourceHandle?.split('-')[1];
          if (sourceHandle === sourceColumn && 
              edge.target === tableMap[targetTable.toLowerCase()]) {
            // Add the ON DELETE CASCADE property to the edge data
            if (!edge.data) edge.data = {};
            edge.data.onDelete = 'CASCADE';
            break;
          }
        }
      }
      
      return { nodes: newNodes, edges: newEdges };
    } catch (error) {
      console.error('Error parsing SQL:', error);
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  };

  // Helper to clean column names (remove quotes) and normalize
  const cleanColumnName = (col: string) => col.replace(/["']/g, '').toLowerCase();

  // Helper function to map complex SQL types to our base types
  const mapToBaseType = (sqlType: string): string => {
    const type = sqlType.toLowerCase().split('(')[0].trim();
    
    // Common mappings
    const typeMap: Record<string, string> = {
      'varchar': 'varchar',
      'character varying': 'varchar',
      'char': 'varchar',
      'text': 'text',
      'int': 'int4',
      'integer': 'int4',
      'smallint': 'int4',
      'bigint': 'int4',
      'serial': 'int4', // SERIAL is mapped to int4 with primary key
      'numeric': 'money',
      'decimal': 'money',
      'money': 'money',
      'timestamp': 'timestamp',
      'timestamptz': 'timestamp',
      'date': 'date',
      'time': 'time',
      'bool': 'boolean',
      'boolean': 'boolean',
      'jsonb': 'jsonb',
      'json': 'jsonb',
      'uuid': 'uuid'
    };
    
    return typeMap[type] || 'varchar';
  };

  const handleApplySqlChanges = () => {
    handleApplySqlChangesInternal(editableSql);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditableSql(sqlContent);
    setError(null);
  };

  // Header actions for the BaseSidebar
  const headerActions = (
    <>
      <Select value={dbType} onValueChange={setDbType}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Database Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="postgresql">PostgreSQL</SelectItem>
          <SelectItem value="mysql">MySQL</SelectItem>
          <SelectItem value="sqlite">SQLite</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <>
            <div className="flex items-center mr-2">
              <input 
                type="checkbox" 
                id="liveEdit" 
                checked={liveEditMode} 
                onChange={(e) => setLiveEditMode(e.target.checked)} 
                className="mr-1"
              />
              <label htmlFor="liveEdit" className="text-xs">Live</label>
            </div>
            <Button variant="outline" size="sm" onClick={cancelEdit}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleApplySqlChanges}>
              Apply
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </>
  );

  return (
    <BaseSidebar 
      title="SQL Editor"
      width={widths.sql}
      onWidthChange={(width) => updateWidth('sql', width)}
      maxWidth={800}
      headerActions={headerActions}
      headerClassName="p-4 flex-col gap-3 sm:flex-row"
    >
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive">
          {error}
        </div>
      )}
      
      <div className="flex-1 h-full bg-muted/30">
        {isEditing ? (
          <CodeMirror
            value={editableSql}
            onChange={setEditableSql}
            height="100%"
            theme={vscodeDark}
            extensions={[sql()]}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightSelectionMatches: true,
              indentUnit: 2,
            }}
            className="h-full min-h-[500px]"
          />
        ) : (
          <CodeMirror
            value={sqlContent}
            readOnly={true}
            height="100%"
            theme={vscodeDark}
            extensions={[sql()]}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: false,
              highlightSpecialChars: true,
              foldGutter: true,
              syntaxHighlighting: true,
              bracketMatching: true,
            }}
            className="h-full min-h-[500px]"
          />
        )}
      </div>
    </BaseSidebar>
  );
}