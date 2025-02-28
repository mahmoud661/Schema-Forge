import { SchemaNode } from "../../types";
import { mapSqlTypeToSchemaType } from "./sql-types";

/**
 * Parses SQL to create schema nodes and edges
 */
export function parseSqlToSchema(sql: string): { nodes: SchemaNode[], edges: any[] } {
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
            type: mapSqlTypeToSchemaType(columnType),
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
    
    // Process foreign key constraints from ALTER TABLE statements
    processAlterTableStatements(sql, tableMap, newEdges);
    
    // Process ON DELETE CASCADE and other FK options after all edges are created
    processConstraintOptions(sql, newEdges);
    
    return { nodes: newNodes, edges: newEdges };
  } catch (error) {
    console.error('Error parsing SQL:', error);
    throw new Error(`Failed to parse SQL: ${error.message}`);
  }
}

// Helper to clean column names (remove quotes) and normalize
function cleanColumnName(col: string): string {
  return col.replace(/["'`]/g, '').toLowerCase();
}

// Helper function to process ALTER TABLE statements for foreign keys
function processAlterTableStatements(sql: string, tableMap: Record<string, string>, newEdges: any[]): void {
  // Extract ALTER TABLE foreign key constraints
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
        sourceHandle: `source-${cleanColumnName(sourceColumn)}`,
        targetHandle: `target-${cleanColumnName(targetColumn)}`,
        type: 'smoothstep',
        animated: true,
        label: 'references',
        data: {
          relationshipType: 'oneToMany'
        }
      });
    }
  }
}

// Helper function to process ON DELETE CASCADE and other constraint options
function processConstraintOptions(sql: string, edges: any[]): void {
  // Check for foreign keys with ON DELETE CASCADE or similar clauses
  const onDeleteRegex = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+ON\s+DELETE\s+CASCADE/gi;
  
  let onDeleteMatch;
  while ((onDeleteMatch = onDeleteRegex.exec(sql)) !== null) {
    const sourceColumn = cleanColumnName(onDeleteMatch[1]);
    const targetTable = onDeleteMatch[2].toLowerCase();
    
    // Find matching edges and update their data
    for (const edge of edges) {
      const sourceHandle = edge.sourceHandle?.split('-')[1];
      if (sourceHandle === sourceColumn && 
          edge.target && edge.target.toLowerCase().includes(targetTable)) {
        // Add the ON DELETE CASCADE property to the edge data
        if (!edge.data) edge.data = {};
        edge.data.onDelete = 'CASCADE';
      }
    }
  }
  
  // Check for ON DELETE SET NULL
  const onDeleteNullRegex = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+ON\s+DELETE\s+SET\s+NULL/gi;
  
  while ((onDeleteMatch = onDeleteNullRegex.exec(sql)) !== null) {
    const sourceColumn = cleanColumnName(onDeleteMatch[1]);
    const targetTable = onDeleteMatch[2].toLowerCase();
    
    // Find matching edges and update their data
    for (const edge of edges) {
      const sourceHandle = edge.sourceHandle?.split('-')[1];
      if (sourceHandle === sourceColumn && 
          edge.target && edge.target.toLowerCase().includes(targetTable)) {
        if (!edge.data) edge.data = {};
        edge.data.onDelete = 'SET NULL';
      }
    }
  }
}

/**
 * Parses SQL CREATE TABLE statements to extract table structure
 * @param sql The SQL string to parse
 * @param tableName The table name to look for
 * @returns The table structure or null if not found
 */
export function parseCreateTableStatement(sql: string, tableName: string): { 
  columns: Array<{ name: string, type: string, constraints: string[] }>,
  primaryKey?: string,
  foreignKeys: Array<{ column: string, refTable: string, refColumn: string }>
} | null {
  // Normalize the table name for comparison
  const normalizedTableName = tableName.toLowerCase();
  
  // Match CREATE TABLE statements for this table
  const tableRegex = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:\`|"|')?${normalizedTableName}(?:\`|"|')?\\s*\\(([\\s\\S]*?)\\)`,
    'i'
  );
  
  const tableMatch = tableRegex.exec(sql);
  if (!tableMatch) return null;
  
  const columnsText = tableMatch[1];
  // Split by commas not inside parentheses
  const columnLines = columnsText
    .split(/,(?![^(]*\))/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Explicitly type the arrays to match the return type
  const result: {
    columns: Array<{ name: string, type: string, constraints: string[] }>,
    primaryKey?: string,
    foreignKeys: Array<{ column: string, refTable: string, refColumn: string }>
  } = {
    columns: [],
    foreignKeys: []
  };
  
  for (const line of columnLines) {
    // Skip pure constraint lines
    if (line.toUpperCase().startsWith('CONSTRAINT')) {
      // Check if it's a foreign key constraint
      const fkMatch = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(line);
      if (fkMatch) {
        result.foreignKeys.push({
          column: fkMatch[1].trim(),
          refTable: fkMatch[2].trim(),
          refColumn: fkMatch[3].trim()
        });
      }
      continue;
    }
    
    // More flexible column parsing regex
    const columnRegex = /^(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
    const columnMatch = line.match(columnRegex);
    
    if (columnMatch) {
      // Column name can be in any of these capture groups depending on quoting
      const columnName = columnMatch[1] || columnMatch[2] || columnMatch[3] || columnMatch[4];
      const columnType = columnMatch[5];
      const constraintText = columnMatch[6] || '';
      const constraints = [];
      
      if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
      if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
      if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
      
      result.columns.push({
        name: columnName,
        type: columnType,
        constraints
      });
    }
  }
  
  return result;
}