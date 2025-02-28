/**
 * Validates a SQL string for common syntax issues
 * @param sql The SQL string to validate
 * @returns An object with validation results
 */
export function validateSqlSyntax(sql: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Empty check
  if (!sql || !sql.trim()) {
    errors.push("SQL cannot be empty");
    return { isValid: false, errors };
  }
  
  // Check for CREATE TABLE statements
  if (!sql.toUpperCase().includes('CREATE TABLE')) {
    errors.push("SQL must contain at least one CREATE TABLE statement");
    return { isValid: false, errors };
  }
  
  // Basic parenthesis matching
  const openParens = (sql.match(/\(/g) || []).length;
  const closeParens = (sql.match(/\)/g) || []).length;
  
  if (openParens !== closeParens) {
    errors.push(`Mismatched parentheses: ${openParens} opening vs ${closeParens} closing`);
  }
  
  // Extract statements, being careful to handle potential nested semicolons in comments or strings
  // This is a simplification; a full SQL parser would do better
  const statements = [];
  let currentStatement = '';
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = i < sql.length - 1 ? sql[i + 1] : '';
    
    // Handle quotes (single and double)
    if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    
    // Only split on semicolons outside of quotes
    if (char === ';' && !inQuote) {
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      currentStatement = '';
    } else {
      currentStatement += char;
    }
    
    // Add the last statement if we reach the end
    if (i === sql.length - 1 && currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
  }
  
  // Track table names to detect duplicates
  const tableNames = new Set<string>();
  
  for (const stmt of statements) {
    // Check for incomplete CREATE TABLE statements
    if (stmt.toUpperCase().includes('CREATE TABLE') && !stmt.includes('(')) {
      errors.push("Incomplete CREATE TABLE statement missing column definitions");
    }
    
    // Check for table name duplicates
    const tableNameMatch = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))/i.exec(stmt);
    if (tableNameMatch) {
      const tableName = (tableNameMatch[1] || tableNameMatch[2] || tableNameMatch[3] || tableNameMatch[4])?.toLowerCase();
      if (tableName && tableNames.has(tableName)) {
        errors.push(`Duplicate table name: ${tableName}`);
      }
      if (tableName) {
        tableNames.add(tableName);
      }
    }
    
    // Check for missing commas in column definitions
    if (stmt.toUpperCase().includes('CREATE TABLE') && stmt.includes('(')) {
      const columnsSection = stmt.substring(stmt.indexOf('(') + 1, stmt.lastIndexOf(')'));
      const lines = columnsSection.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('--')
      );
      
      // Track column names to detect duplicates within a table
      const columnNames = new Set<string>();
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip constraint lines when checking for missing commas
        const isConstraintLine = line.toUpperCase().startsWith('PRIMARY KEY') || 
                                line.toUpperCase().startsWith('FOREIGN KEY') || 
                                line.toUpperCase().startsWith('CONSTRAINT');
        
        // Check for missing commas
        if (i < lines.length - 1 && 
            !line.endsWith(',') && 
            !isConstraintLine &&
            !lines[i + 1].trim().startsWith('PRIMARY KEY') &&
            !lines[i + 1].trim().startsWith('FOREIGN KEY') &&
            !lines[i + 1].trim().startsWith('CONSTRAINT')) {
          errors.push(`Possible missing comma after column definition: "${line}"`);
        }
        
        // Check for duplicate column names
        const columnNameMatch = /^(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+/i.exec(line);
        if (columnNameMatch) {
          const colName = (columnNameMatch[1] || columnNameMatch[2] || columnNameMatch[3] || columnNameMatch[4])?.toLowerCase();
          if (colName && columnNames.has(colName)) {
            errors.push(`Duplicate column name "${colName}" in table definition`);
          }
          if (colName) {
            columnNames.add(colName);
          }
        }
      }
    }
  }
  
  // Validate table references for FOREIGN KEY constraints
  // This needs to be a second pass after all table names are collected
  for (const stmt of statements) {
    // Only check for FKs once all table names are known
    if (stmt.toUpperCase().includes('FOREIGN KEY') && stmt.toUpperCase().includes('REFERENCES')) {
      // Extract all references to other tables
      const refMatches = stmt.match(/REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?/gi);
      
      if (refMatches) {
        for (const refMatch of refMatches) {
          const referencedTable = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?/i.exec(refMatch)?.[1]?.toLowerCase();
          
          // We already tracked all table names, so check if this reference exists
          if (referencedTable && !tableNames.has(referencedTable)) {
            // Only warn, don't block - there may be valid reasons for this
            errors.push(`Warning: Foreign key references table "${referencedTable}" which is not defined in this SQL`);
          }
        }
      }
    }
  }
  
  // Validate ALTER TABLE statements reference existing tables
  const alterStatements = statements.filter(stmt => stmt.toUpperCase().startsWith('ALTER TABLE'));
  
  for (const alter of alterStatements) {
    const tableMatch = /ALTER\s+TABLE\s+(?:`|"|')?([^`"'\s]+)(?:`|"|')?/i.exec(alter);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      if (!tableNames.has(tableName)) {
        // Only warn, don't block
        errors.push(`Warning: ALTER TABLE references table "${tableName}" which is not defined in this SQL`);
      }
    }
    
    // Check for foreign key references to non-existent tables in ALTER TABLE statements
    if (alter.toUpperCase().includes('FOREIGN KEY') && alter.toUpperCase().includes('REFERENCES')) {
      const refMatches = alter.match(/REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?/gi);
      
      if (refMatches) {
        for (const refMatch of refMatches) {
          const referencedTable = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?/i.exec(refMatch)?.[1]?.toLowerCase();
          
          if (referencedTable && !tableNames.has(referencedTable)) {
            // Only warn, don't block
            errors.push(`Warning: Foreign key in ALTER TABLE references table "${referencedTable}" which is not defined in this SQL`);
          }
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Quick-fixes common SQL syntax issues
 * @param sql The SQL string to fix
 * @returns The fixed SQL string
 */
export function fixCommonSqlIssues(sql: string): string {
  let fixedSql = sql;
  
  // Fix table names with spaces by adding quotes if missing
  const tableNameRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+\s+\w+)(?!\s*`|"|')\s*\(/gi;
  fixedSql = fixedSql.replace(tableNameRegex, 'CREATE TABLE "$1" (');
  
  // Fix missing commas between column definitions
  const missingCommaRegex = /(\w+\s+\w+(?:\(\d+\))?(?:\s+(?:NOT NULL|PRIMARY KEY|UNIQUE))?)(\s*\n\s*)(\w+\s+\w+)/gi;
  fixedSql = fixedSql.replace(missingCommaRegex, '$1,$2$3');
  
  // Removed extraneous replacement for adding quotes to column names
  
  // Make sure quoted columns have closing quotes
  const missingCloseQuoteRegex = /\("(\w+)(?!")(\s+\w+)/g;
  fixedSql = fixedSql.replace(missingCloseQuoteRegex, '("$1"$2');
  
  // Ensure proper PRIMARY KEY syntax
  const improperPkRegex = /PRIMARY KEY\s+(\w+)/gi;
  fixedSql = fixedSql.replace(improperPkRegex, 'PRIMARY KEY ($1)');
  
  // Ensure FOREIGN KEY constraints have proper syntax
  const improperFkRegex = /FOREIGN KEY\s+(\w+)/gi;
  fixedSql = fixedSql.replace(improperFkRegex, 'FOREIGN KEY ($1)');
  
  return fixedSql;
}

/**
 * Creates a unique name based on existing names
 * @param baseName The desired base name
 * @param existingNames Set of existing names to avoid duplicates with
 * @returns A unique name that doesn't exist in existingNames
 */
export function createUniqueName(baseName: string, existingNames: Set<string>): string {
  // Check if the name already exists
  if (!existingNames.has(baseName.toLowerCase())) {
    return baseName;
  }
  
  // If it exists, add a suffix
  let counter = 1;
  let uniqueName = `${baseName}_${counter}`;
  
  while (existingNames.has(uniqueName.toLowerCase())) {
    counter++;
    uniqueName = `${baseName}_${counter}`;
  }
  
  return uniqueName;
}
