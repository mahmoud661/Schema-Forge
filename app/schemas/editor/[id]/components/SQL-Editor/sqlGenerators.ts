export const getQuotedTableName = (tableName: string, useCaseSensitive: boolean = false): string => {
  if (useCaseSensitive) {
    return `"${tableName.replace(/"/g, '""')}"`;
  }
  return tableName;
};

export const getQuotedColumnName = (columnName: string, useCaseSensitive: boolean = false): string => {
  if (useCaseSensitive) {
    return `"${columnName.replace(/"/g, '""')}"`;
  }
  return columnName;
};

export const mapToBaseType = (sqlType: string): string => {
  const type = sqlType.toLowerCase().split('(')[0].trim();
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
  
  // Check if it's an enum type
  if (type.includes('enum_')) {
    return type;
  }
  
  return typeMap[type] || 'varchar';
};

// Generate ENUM type definitions
export const generateEnumTypes = (enumTypes: any[], useCaseSensitive: boolean = false) => {
  if (!enumTypes || enumTypes.length === 0) {
    return '';
  }
  
  let sql = '-- ENUM Type Definitions\n';
  enumTypes.forEach((enumType) => {
    const typeName = useCaseSensitive ? `"${enumType.name}"` : enumType.name;
    const enumValues = enumType.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
    sql += `CREATE TYPE ${typeName} AS ENUM (${enumValues});\n\n`;
  });
  
  return sql;
};

// Table-specific SQL generators
export const generatePostgresTable = (node: any, useCaseSensitive: boolean = false, useInlineConstraints: boolean = true) => {
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  const foreignKeys: string[] = [];
  
  node.data.schema.forEach((column: any, index: number) => {
    const columnName = getQuotedColumnName(column.title, useCaseSensitive);
    sql += `  ${columnName} ${column.type}`;
    
    // Handle defaults
    if (column.default) {
      sql += ` DEFAULT ${column.default}`;
    }
    
    // Add constraints inline
    if (column.constraints) {
      if (column.constraints.includes('primary')) sql += ' PRIMARY KEY';
      if (column.constraints.includes('notnull')) sql += ' NOT NULL';
      if (column.constraints.includes('unique')) sql += ' UNIQUE';
    }
    
    // Handle foreign keys (only if using inline constraints)
    if (column.foreignKey && useInlineConstraints) {
      const refTable = useCaseSensitive ? 
        `"${column.foreignKey.table.replace(/"/g, '""')}"` : column.foreignKey.table;
      const refColumn = useCaseSensitive ? 
        `"${column.foreignKey.column.replace(/"/g, '""')}"` : column.foreignKey.column;
      
      sql += ` REFERENCES ${refTable}(${refColumn})`;
      if (column.foreignKey.onDelete) {
        sql += ` ON DELETE ${column.foreignKey.onDelete}`;
      }
      if (column.foreignKey.onUpdate) {
        sql += ` ON UPDATE ${column.foreignKey.onUpdate}`;
      }
    } else if (column.foreignKey && !useInlineConstraints) {
      // Store for later ALTER TABLE statements
      foreignKeys.push({
        column: columnName,
        refTable: column.foreignKey.table,
        refColumn: column.foreignKey.column,
        onDelete: column.foreignKey.onDelete,
        onUpdate: column.foreignKey.onUpdate
      });
    }
    
    sql += index < node.data.schema.length - 1 ? ',\n' : '\n';
  });
  
  sql += ');';
  
  // Create indexes for columns marked as index but not primary
  node.data.schema.forEach((column: any) => {
    if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
      const safeTableName = useCaseSensitive ? 
        `"${node.data.label.replace(/"/g, '""')}"` : node.data.label.toLowerCase().replace(/\s/g, '_');
      const safeColName = useCaseSensitive ?
        `"${column.title.replace(/"/g, '""')}"` : column.title.replace(/\s/g, '_');
      
      sql += `\nCREATE INDEX idx_${safeTableName}_${safeColName} ON ${tableName} (${getQuotedColumnName(column.title, useCaseSensitive)});`;
    }
  });
  
  return sql;
};

export const generateMySqlTable = (node: any, useCaseSensitive: boolean = false) => {
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    let mysqlType = column.type;
    if (column.type === 'uuid') mysqlType = 'VARCHAR(36)';
    if (column.type === 'text') mysqlType = 'TEXT';
    if (column.type === 'int4') mysqlType = 'INT';
    if (column.type === 'timestamp') mysqlType = 'DATETIME';
    const columnName = getQuotedColumnName(column.title, useCaseSensitive);
    sql += `  ${columnName} ${mysqlType}`;
    if (column.constraints) {
      if (column.constraints.includes('primary')) sql += ' PRIMARY KEY';
      if (column.constraints.includes('notnull')) sql += ' NOT NULL';
      if (column.constraints.includes('unique')) sql += ' UNIQUE';
    }
    sql += index < node.data.schema.length - 1 ? ',\n' : '\n';
  });
  sql += ') ENGINE=InnoDB;';
  node.data.schema.forEach((column: any) => {
    if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
      sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
    }
  });
  return sql;
};

export const generateSqliteTable = (node: any, useCaseSensitive: boolean = false) => {
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    let sqliteType = column.type;
    if (column.type === 'uuid') sqliteType = 'TEXT';
    if (column.type === 'int4') sqliteType = 'INTEGER';
    if (column.type === 'timestamp') sqliteType = 'DATETIME';
    if (column.type === 'money') sqliteType = 'REAL';
    const columnName = getQuotedColumnName(column.title, useCaseSensitive);
    sql += `  ${columnName} ${sqliteType}`;
    if (column.constraints) {
      if (column.constraints.includes('primary')) sql += ' PRIMARY KEY';
      if (column.constraints.includes('notnull')) sql += ' NOT NULL';
      if (column.constraints.includes('unique')) sql += ' UNIQUE';
    }
    sql += index < node.data.schema.length - 1 ? ',\n' : '\n';
  });
  sql += ');';
  node.data.schema.forEach((column: any) => {
    if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
      sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase()}_${column.title} ON ${node.data.label.toLowerCase()} (${column.title});`;
    }
  });
  return sql;
};

// Main SQL Generator function
export const generateSql = (
  type: string, 
  schemaNodes: any[], 
  schemaEdges: any[],
  enumTypes: any[] = [],
  settings = { caseSensitiveIdentifiers: false, useInlineConstraints: true }
): string => {
  let sql = "";
  sql += `-- Generated ${new Date().toLocaleString()} for ${type.toUpperCase()}\n`;
  sql += `-- Edit this SQL and apply changes to update your schema\n\n`;
  
  // First, generate all ENUM type definitions
  if (enumTypes && enumTypes.length > 0 && type === "postgresql") {
    sql += generateEnumTypes(enumTypes, settings.caseSensitiveIdentifiers);
  }
  
  // Then, generate all table creation statements
  schemaNodes.forEach(node => {
    // Only process database schema nodes, not enum nodes
    if (node.type === "databaseSchema" || !node.type) {
      if (type === "postgresql") {
        sql += generatePostgresTable(node, settings.caseSensitiveIdentifiers, settings.useInlineConstraints);
      } else if (type === "mysql") {
        sql += generateMySqlTable(node, settings.caseSensitiveIdentifiers);
      } else if (type === "sqlite") {
        sql += generateSqliteTable(node, settings.caseSensitiveIdentifiers);
      }
      sql += "\n\n";
    }
  });
  
  // Only add ALTER TABLE statements if not using inline constraints OR for edges between tables
  if (schemaEdges.length > 0) {
    const fkEdges = schemaEdges.filter(edge => {
      // Only include edges where both source and target are database tables (not enums)
      const sourceNode = schemaNodes.find(n => n.id === edge.source);
      const targetNode = schemaNodes.find(n => n.id === edge.target);
      return sourceNode && targetNode && 
            (sourceNode.type === "databaseSchema" || !sourceNode.type) && 
            (targetNode.type === "databaseSchema" || !targetNode.type);
    });
    
    if (fkEdges.length > 0 && !settings.useInlineConstraints) {
      sql += "-- Foreign Key Constraints\n";
      fkEdges.forEach(edge => {
        const sourceNode = schemaNodes.find(n => n.id === edge.source);
        const targetNode = schemaNodes.find(n => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Parse the handle format to get the column name
        const sourceColumn = edge.sourceHandle?.split('-').slice(1).join('-') || 'id';
        const targetColumn = edge.targetHandle?.split('-').slice(1).join('-') || 'id';
        
        const sourceTableName = getQuotedTableName(sourceNode.data.label, settings.caseSensitiveIdentifiers);
        const targetTableName = getQuotedTableName(targetNode.data.label, settings.caseSensitiveIdentifiers);
        const sourceColumnName = getQuotedColumnName(sourceColumn, settings.caseSensitiveIdentifiers);
        const targetColumnName = getQuotedColumnName(targetColumn, settings.caseSensitiveIdentifiers);
        
        // Create a constraint name that's safe for all SQL dialects
        const constraintName = settings.caseSensitiveIdentifiers 
          ? `"fk_${sourceNode.data.label.replace(/\s/g, '_')}_${sourceColumn.replace(/\s/g, '_')}"`
          : `fk_${sourceNode.data.label.toLowerCase().replace(/\s/g, '_')}_${sourceColumn.toLowerCase().replace(/\s/g, '_')}`;
        
        if (type === "postgresql" || type === "mysql") {
          sql += `ALTER TABLE ${sourceTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${sourceColumnName}) REFERENCES ${targetTableName}(${targetColumnName});\n`;
        } else if (type === "sqlite") {
          // SQLite doesn't support ALTER TABLE for foreign keys
          sql += `-- For SQLite, foreign keys should be defined in the CREATE TABLE statement\n`;
          sql += `-- Example: FOREIGN KEY (${sourceColumnName}) REFERENCES ${targetTableName}(${targetColumnName})\n`;
        }
      });
    }
  }
  
  return sql;
};
