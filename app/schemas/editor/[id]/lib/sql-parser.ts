import { SchemaNode } from "../types";

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
  
  const result = {
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
          column: fkMatch[1],
          refTable: fkMatch[2],
          refColumn: fkMatch[3]
        });
      }
      continue;
    }
    
    if (line.toUpperCase().startsWith('PRIMARY KEY')) {
      // Extract column name from PRIMARY KEY constraint
      const pkMatch = /PRIMARY\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(line);
      if (pkMatch) {
        result.primaryKey = pkMatch[1];
      }
      continue;
    }
    
    if (line.toUpperCase().startsWith('FOREIGN KEY')) {
      // Extract foreign key info
      const fkMatch = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(line);
      if (fkMatch) {
        result.foreignKeys.push({
          column: fkMatch[1],
          refTable: fkMatch[2],
          refColumn: fkMatch[3]
        });
      }
      continue;
    }
    
    // Parse column definition
    const columnRegex = /^(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
    const columnMatch = columnMatch.match(columnRegex);
    
    if (columnMatch) {
      const name = columnMatch[1] || columnMatch[2] || columnMatch[3] || columnMatch[4];
      const type = columnMatch[5];
      const constraintText = columnMatch[6] || '';
      const constraints = [];
      
      // Parse constraints
      if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
      if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
      if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
      
      // Handle special case for SERIAL type which implies PRIMARY KEY
      if (type.toUpperCase() === 'SERIAL') {
        constraints.push('primary');
      }
      
      // Check for inline foreign key reference
      const inlineFkMatch = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(constraintText);
      if (inlineFkMatch) {
        result.foreignKeys.push({
          column: name,
          refTable: inlineFkMatch[1],
          refColumn: inlineFkMatch[2]
        });
      }
      
      result.columns.push({ name, type, constraints });
    }
  }
  
  return result;
}

/**
 * Extracts all table names from SQL CREATE TABLE statements
 * @param sql The SQL string to parse
 * @returns Array of table names
 */
export function extractTableNames(sql: string): string[] {
  const tableNames = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))/gi;
  let match;
  
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2] || match[3] || match[4];
    if (tableName) tableNames.push(tableName);
  }
  
  return tableNames;
}

/**
 * Maps SQL types to schema editor types
 * @param sqlType SQL type string like INT or VARCHAR(50)
 * @returns Mapped type for the schema editor
 */
export function mapSqlTypeToSchemaType(sqlType: string): string {
  const baseType = sqlType.toLowerCase().split('(')[0].trim();
  
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
    'serial': 'int4',
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
  
  return typeMap[baseType] || 'varchar';
}
