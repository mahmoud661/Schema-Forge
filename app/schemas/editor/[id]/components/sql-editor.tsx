"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, X } from "lucide-react";
import { SchemaNode } from "../types";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  
  useEffect(() => {
    // Generate SQL based on nodes and edges
    const generatedSql = generateSql(dbType, nodes, edges);
    setSqlContent(generatedSql);
    if (!isEditing) {
      setEditableSql(generatedSql);
    }
  }, [nodes, edges, dbType, isEditing]);

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
    return tableName.includes(' ') ? `"${tableName}"` : tableName.toLowerCase();
  };
  
  const generatePostgresTable = (node: SchemaNode) => {
    const tableName = getQuotedTableName(node.data.label);
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    
    node.data.schema.forEach((column, index) => {
      // Quote column names if they contain spaces
      const columnName = column.title.includes(' ') ? `"${column.title}"` : column.title;
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
        sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
      }
    });
    
    return sql;
  };
  
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
  
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\S+))\s*\(([\s\S]*?)\);/gi;

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

  // Improved SQL parsing function with better regex and error handling
  const parseSqlToSchema = (sql: string): { nodes: SchemaNode[], edges: any[] } | null => {
    try {
      const newNodes: SchemaNode[] = [];
      const newEdges: any[] = [];
      
      // Extract CREATE TABLE statements
      const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(([\s\S]*?)\);/gi;
      
      let tableMatch;
      let tableIndex = 0;
      
      // Process each table definition
      while ((tableMatch = tableRegex.exec(sql)) !== null) {
        const tableName = tableMatch[1];
        const tableContent = tableMatch[2];
        
        // Process columns with more flexible regex to handle various SQL formats
        const columns = [];
        const columnLines = tableContent.split(',').map(line => line.trim());
        
        for (const columnLine of columnLines) {
          // Skip lines that don't look like column definitions (e.g., constraints)
          if (!columnLine || columnLine.startsWith('CONSTRAINT') || columnLine.startsWith('PRIMARY KEY') || columnLine.startsWith('FOREIGN KEY')) {
            continue;
          }
          
          // Improved column regex that handles quoted names and types with parameters
          const columnRegex = /^["`]?(\w+)["`]?\s+([A-Za-z0-9\(\)]+)(?:\s+(.*))?$/;
          const columnMatch = columnLine.match(columnRegex);
          
          if (columnMatch) {
            const columnName = columnMatch[1];
            const columnType = columnMatch[2];
            const constraintText = columnMatch[3] || '';
            const constraints = [];
            if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
            if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
            if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
            
            columns.push({
              title: columnName,
              type: columnType,
              constraints,
              id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });
          }
        }
        
        if (columns.length === 0) {
          console.warn(`No valid columns found for table ${tableName}`);
          continue;
        }
        
        // Create node for this table
        newNodes.push({
          id: `sql-node-${Date.now()}-${tableIndex}`,
          type: 'databaseSchema',
          position: { x: 100 + (tableIndex % 3) * 300, y: 100 + Math.floor(tableIndex / 3) * 200 },
          data: {
            label: tableName,
            schema: columns
          }
        });
        
        tableIndex++;
      }
      
      // Extract foreign key constraints
      const fkRegex = /ALTER\s+TABLE\s+["`]?(\w+)["`]?\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s+\(["`]?(\w+)["`]?\)\s+REFERENCES\s+["`]?(\w+)["`]?\s*\(["`]?(\w+)["`]?\)/gi;
      
      let fkMatch;
      while ((fkMatch = fkRegex.exec(sql)) !== null) {
        const sourceTable = fkMatch[1];
        const sourceColumn = fkMatch[2];
        const targetTable = fkMatch[3];
        const targetColumn = fkMatch[4];
        
        const sourceNode = newNodes.find(n => n.data.label.toLowerCase() === sourceTable.toLowerCase());
        const targetNode = newNodes.find(n => n.data.label.toLowerCase() === targetTable.toLowerCase());
          
        if (sourceNode && targetNode) {
          newEdges.push({
            id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: sourceNode.id,
            target: targetNode.id,
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
      
      // If we have nodes but parsing didn't find any, there may be a syntax issue
      if (newNodes.length === 0) {
        throw new Error("No valid tables found in the SQL. Please check your syntax.");
      }
      
      return { nodes: newNodes, edges: newEdges };
    } catch (error) {
      console.error('Error parsing SQL:', error);
      throw new Error(`Failed to parse SQL: ${error.message}`);
    }
  };

  const handleApplySqlChanges = () => {
    try {
      setError(null);
      if (!editableSql.trim()) {
        setError("SQL cannot be empty");
        return;
      }
      
      const parsedSchema = parseSqlToSchema(editableSql);
      if (parsedSchema) {
        onUpdateSchema(parsedSchema.nodes, parsedSchema.edges);
        setIsEditing(false);
        toast.success("Schema updated successfully");
      }
    } catch (error) {
      setError(error.message || "An error occurred while parsing SQL");
      toast.error("Failed to update schema");
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditableSql(sqlContent);
    setError(null);
  };

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">SQL Editor</h3>
      </div>
      <div className="p-4 border-b flex justify-between items-center">
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
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplySqlChanges}>
                Apply
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 m-4 rounded-md border border-destructive">
          {error}
        </div>
      )}
      
      <div className="flex-1 overflow-auto p-4 bg-muted/30">
        {isEditing ? (
          <Textarea
            value={editableSql}
            onChange={(e) => setEditableSql(e.target.value)}
            className="font-mono text-sm h-full min-h-[500px] resize-none bg-background p-4 rounded-md shadow-sm border"
          />
        ) : (
          <pre className="font-mono text-sm whitespace-pre-wrap bg-background p-4 rounded-md shadow-sm border">
            {sqlContent}
          </pre>
        )}
      </div>
    </div>
  );
}