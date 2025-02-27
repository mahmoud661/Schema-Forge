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
  
  // Check for common SQL syntax issues
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const stmt of statements) {
    // Check for incomplete CREATE TABLE statements
    if (stmt.toUpperCase().includes('CREATE TABLE') && !stmt.includes('(')) {
      errors.push("Incomplete CREATE TABLE statement missing column definitions");
    }
    
    // Check for missing commas in column definitions
    if (stmt.toUpperCase().includes('CREATE TABLE') && stmt.includes('(')) {
      const columnsSection = stmt.substring(stmt.indexOf('(') + 1, stmt.lastIndexOf(')'));
      const lines = columnsSection.split('\n').filter(line => 
        line.trim() && !line.trim().startsWith('--')
      );
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line.endsWith(',') && 
            !line.startsWith('PRIMARY KEY') && 
            !line.startsWith('FOREIGN KEY') && 
            !line.startsWith('CONSTRAINT')) {
          errors.push(`Possible missing comma after column definition: "${line}"`);
          break; // Just report the first occurrence
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
  fixedSql = fixedSql.replace(tableNameRegex, 'CREATE TABLE $1" (');
  
  // Fix missing commas between column definitions
  const missingCommaRegex = /(\w+\s+\w+(?:\(\d+\))?(?:\s+(?:NOT NULL|PRIMARY KEY|UNIQUE))?)(\s*\n\s*)(\w+\s+\w+)/gi;
  fixedSql = fixedSql.replace(missingCommaRegex, '$1,$2$3');
  
  return fixedSql;
}
