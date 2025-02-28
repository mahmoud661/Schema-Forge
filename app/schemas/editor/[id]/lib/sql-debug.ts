/**
 * Utilities for SQL debugging and troubleshooting
 */

/**
 * Logs details about a SQL statement to help with debugging
 * @param sql The SQL statement to analyze
 * @param label Optional label for the log
 */
export function debugSqlStatement(sql: string, label = "SQL Debug"): void {
  console.group(label);
  console.log("SQL:", sql);
  
  // Log table definitions
  const tables = extractTableDefinitions(sql);
  console.log(`Tables found (${tables.length}):`, tables.map(t => t.name));
  
  // Log foreign key relationships
  const fks = extractForeignKeys(sql);
  console.log(`Foreign keys found (${fks.length}):`, fks);
  
  console.groupEnd();
}

/**
 * Extracts table definitions from SQL
 */
function extractTableDefinitions(sql: string): Array<{name: string, columns: string[]}> {
  const tables = [];
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
  
  let match;
  while ((match = tableRegex.exec(sql)) !== null) {
    const tableName = match[1] || match[2] || match[3] || match[4];
    const tableContent = match[5];
    
    if (!tableName || !tableContent) continue;
    
    // Extract column names
    const columns = [];
    const columnRegex = /(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+[A-Za-z0-9_]+/gi;
    
    let colMatch;
    while ((colMatch = columnRegex.exec(tableContent)) !== null) {
      const colName = colMatch[1] || colMatch[2] || colMatch[3] || colMatch[4];
      if (colName) columns.push(colName);
    }
    
    tables.push({ name: tableName, columns });
  }
  
  return tables;
}

/**
 * Extracts foreign key relationships from SQL
 */
function extractForeignKeys(sql: string): Array<{source: string, sourceCol: string, target: string, targetCol: string}> {
  const fks = [];
  
  // First check for inline foreign keys in CREATE TABLE
  const inlineFkRegex = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/gi;
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))/i;
  
  // Extract table sections and check each for FKs
  const tableSections = sql.split(/CREATE\s+TABLE/i);
  
  for (let i = 1; i < tableSections.length; i++) {
    const section = "CREATE TABLE" + tableSections[i];
    const tableMatch = tableRegex.exec(section);
    
    if (tableMatch) {
      const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3] || tableMatch[4];
      
      let fkMatch;
      while ((fkMatch = inlineFkRegex.exec(section)) !== null) {
        const sourceCol = fkMatch[1];
        const targetTable = fkMatch[2];
        const targetCol = fkMatch[3];
        
        fks.push({
          source: tableName,
          sourceCol,
          target: targetTable,
          targetCol
        });
      }
    }
  }
  
  // Then check for ALTER TABLE foreign keys
  const alterFkRegex = /ALTER\s+TABLE\s+(?:`|"|')?([^`"'\s]+)(?:`|"|')?\s+ADD\s+(?:CONSTRAINT\s+(?:\w+)\s+)?FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\