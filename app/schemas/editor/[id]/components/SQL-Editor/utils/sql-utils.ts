/**
 * Ensures table names with spaces are properly quoted in SQL statements
 */
export const ensureTableNamesAreQuoted = (sql: string): string => {
  // Match CREATE TABLE statements with unquoted table names that contain spaces
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+\s+\w+)(?!\s*["'`])\s*\(/gi;
  let result = sql.replace(createTableRegex, 'CREATE TABLE "$1" (');
  
  // Match ALTER TABLE statements with unquoted table names that contain spaces
  const alterTableRegex = /ALTER\s+TABLE\s+(\w+\s+\w+)(?!\s*["'`])\s+/gi;
  result = result.replace(alterTableRegex, 'ALTER TABLE "$1" ');
  
  // Match REFERENCES clauses with unquoted table names that contain spaces
  const referencesRegex = /REFERENCES\s+(\w+\s+\w+)(?!\s*["'`])\s*\(/gi;
  result = result.replace(referencesRegex, 'REFERENCES "$1" (');
  
  return result;
};

/**
 * Removes duplicate ALTER TABLE statements from SQL
 */
export const removeDuplicateAlterTableStatements = (sql: string): string => {
  // Track unique constraints by their full definition
  const uniqueConstraints = new Set();
  
  // Split the SQL into sections - this keeps non-ALTER TABLE parts untouched
  const sections = sql.split(/(-- [^\n]+)/);
  
  // Process each section
  const processedSections = sections.map(section => {
    // Only process Foreign Key Constraints sections
    if (!section.includes("Foreign Key Constraints")) {
      return section;
    }
    
    // Split into lines to process individual ALTER TABLE statements
    const lines = section.split('\n');
    const uniqueLines = [];
    
    for (const line of lines) {
      // Extract constraint name from ALTER TABLE statement
      const constraintMatch = /ADD\s+CONSTRAINT\s+(?:"|\`|')?([^"'`\s]+)(?:"|\`|')?/i.exec(line);
      
      if (constraintMatch && line.trim().startsWith('ALTER TABLE')) {
        // Use the full ALTER TABLE statement for uniqueness checking
        // This catches cases where the same constraint name is used for different definitions
        const constraintStatement = line.trim();
        
        if (!uniqueConstraints.has(constraintStatement)) {
          uniqueConstraints.add(constraintStatement);
          uniqueLines.push(line);
        } else {
          console.log(`Removed duplicate ALTER TABLE statement: ${constraintStatement}`);
        }
      } else {
        // Keep non-ALTER TABLE lines (comments, blank lines, etc.)
        uniqueLines.push(line);
      }
    }
    
    return uniqueLines.join('\n');
  });
  
  return processedSections.join('');
};

// Default settings to use if schema settings are undefined
export const defaultSettings = {
  caseSensitiveIdentifiers: false,
  useInlineConstraints: true
};
