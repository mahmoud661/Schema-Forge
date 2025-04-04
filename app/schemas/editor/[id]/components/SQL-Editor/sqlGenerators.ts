export const getQuotedTableName = (tableName: string, useCaseSensitive: boolean = false, dbType: string = "postgresql"): string => {
  // Always quote tables with spaces
  const hasSpaces = tableName.includes(' ');
  
  if (hasSpaces || useCaseSensitive) {
    // Use appropriate quoting based on database type
    if (dbType === "mysql") {
      return `\`${tableName.replace(/`/g, '``')}\``;
    } else {
      return `"${tableName.replace(/"/g, '""')}"`;
    }
  }
  
  return tableName;
};

export const getQuotedColumnName = (rowName: string, useCaseSensitive: boolean = false, dbType: string = "postgresql"): string => {
  // Always quote columns with spaces
  const hasSpaces = rowName.includes(' ');
  
  if (hasSpaces || useCaseSensitive) {
    // Use appropriate quoting based on database type
    if (dbType === "mysql") {
      return `\`${rowName.replace(/`/g, '``')}\``;
    } else {
      return `"${rowName.replace(/"/g, '""')}"`;
    }
  }
  
  return rowName;
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
    interface EnumType {
      name: string;
      values: string[];
    }
    const enumValues: string = (enumType as EnumType).values.map((v: string): string => `'${v.replace(/'/g, "''")}'`).join(', ');
    sql += `CREATE TYPE ${typeName} AS ENUM (${enumValues});\n\n`;
  });
  
  return sql;
};

// Table-specific SQL generators
export const generatePostgresTable = (node: any, useCaseSensitive: boolean = false, useInlineConstraints: boolean = true) => {
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  const foreignKeys: any[] = [];
  const tableConstraints: string[] = [];
  
  node.data.schema.forEach((column: any, index: number) => {
    const rowName = getQuotedColumnName(column.title, useCaseSensitive);
    
    // Use the full type string as is - it may already include parameters like varchar(255)
    sql += `  ${rowName} ${column.type}`;
    
    // Handle defaults
    if (column.default) {
      sql += ` DEFAULT ${column.default}`;
    }
    
    // Handle constraints that don't conflict with foreign keys
    if (column.constraints) {
      // Add NOT NULL constraint inline
      if (column.constraints.includes('notnull')) sql += ' NOT NULL';
      
      // Add UNIQUE constraint inline if it's not also a foreign key
      if (column.constraints.includes('unique') && (!column.foreignKey || !useInlineConstraints)) 
        sql += ' UNIQUE';
      
      // For PRIMARY KEY, handle differently if it's also a foreign key
      const isPrimaryKey = column.constraints.includes('primary');
      const hasForeignKey = column.foreignKey && useInlineConstraints;

      // If this is both a primary key and a foreign key, define PRIMARY KEY as table constraint
      if (isPrimaryKey && hasForeignKey) {
        tableConstraints.push(`  PRIMARY KEY (${rowName})`);
      } else if (isPrimaryKey) {
        sql += ' PRIMARY KEY';
      }
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
        column: rowName,
        refTable: column.foreignKey.table,
        refColumn: column.foreignKey.column,
        onDelete: column.foreignKey.onDelete,
        onUpdate: column.foreignKey.onUpdate
      });
    }
    
    // Only add comma if this isn't the last column or if we have table constraints
    if (index < node.data.schema.length - 1 || tableConstraints.length > 0) {
      sql += ',\n';
    } else {
      sql += '\n';
    }
  });
  
  // Add any table-level constraints
  if (tableConstraints.length > 0) {
    sql += tableConstraints.join(',\n') + '\n';
  }
  
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
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive, "mysql");
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    let mysqlType = column.type;
    
    // Fix type mappings for MySQL
    if (column.type === 'uuid') mysqlType = 'VARCHAR(36)';
    if (column.type === 'text') mysqlType = 'TEXT';
    if (column.type === 'int4') mysqlType = 'INT';
    if (column.type === 'serial') mysqlType = 'INT AUTO_INCREMENT';
    if (column.type === 'timestamp') mysqlType = 'DATETIME';
    
    const rowName = getQuotedColumnName(column.title, useCaseSensitive, "mysql");
    sql += `  ${rowName} ${mysqlType}`;
    
    // Handle defaults
    if (column.default) {
      if (column.default.toUpperCase() === 'CURRENT_TIMESTAMP') {
        sql += ` DEFAULT CURRENT_TIMESTAMP`;
      } else {
        sql += ` DEFAULT ${column.default}`;
      }
    }
    
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
      const safeTableName = useCaseSensitive ? 
        `\`${node.data.label.replace(/`/g, '``')}\`` : node.data.label.toLowerCase().replace(/\s/g, '_');
      const safeColName = useCaseSensitive ?
        `\`${column.title.replace(/`/g, '``')}\`` : column.title.replace(/\s/g, '_');
      
      sql += `\nCREATE INDEX idx_${safeTableName}_${safeColName} ON ${tableName} (${getQuotedColumnName(column.title, useCaseSensitive, "mysql")});`;
    }
  });
  return sql;
};

export const generateSqliteTable = (node: any, useCaseSensitive: boolean = false, useInlineConstraints: boolean = true) => {
  const tableName = getQuotedTableName(node.data.label, useCaseSensitive);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  const foreignKeys: string[] = [];
  
  node.data.schema.forEach((column: any, index: number) => {
    let sqliteType = column.type;
    
    // Fix type mappings for SQLite
    if (column.type === 'uuid') sqliteType = 'TEXT';
    if (column.type === 'int4') sqliteType = 'INTEGER';
    if (column.type === 'serial') sqliteType = column.constraints?.includes('primary') ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INTEGER';
    if (column.type === 'timestamp') sqliteType = 'DATETIME';
    if (column.type === 'money' || column.type.includes('decimal')) sqliteType = 'REAL';
    
    const rowName = getQuotedColumnName(column.title, useCaseSensitive);
    sql += `  ${rowName} ${sqliteType}`;
    
    // Don't add PRIMARY KEY again if we're using AUTOINCREMENT
    const isPrimary = column.constraints?.includes('primary');
    const skipPrimaryKey = sqliteType.includes('PRIMARY KEY');
    
    // Handle constraints
    if (column.constraints) {
      if (isPrimary && !skipPrimaryKey) sql += ' PRIMARY KEY';
      if (column.constraints.includes('notnull')) sql += ' NOT NULL';
      if (column.constraints.includes('unique')) sql += ' UNIQUE';
    }
    
    // Handle defaults
    if (column.default) {
      if (column.default.toUpperCase() === 'CURRENT_TIMESTAMP') {
        sql += ` DEFAULT CURRENT_TIMESTAMP`;
      } else {
        sql += ` DEFAULT ${column.default}`;
      }
    }
    
    // Handle foreign keys for SQLite (must be inline)
    if (column.foreignKey && useInlineConstraints) {
      const refTable = getQuotedTableName(column.foreignKey.table, useCaseSensitive);
      const refColumn = getQuotedColumnName(column.foreignKey.column, useCaseSensitive);
      foreignKeys.push(`  FOREIGN KEY (${rowName}) REFERENCES ${refTable}(${refColumn})`);
    }
    
    // Only add comma if this isn't the last column or if we have foreign keys
    if (index < node.data.schema.length - 1 || foreignKeys.length > 0) {
      sql += ',\n';
    } else {
      sql += '\n';
    }
  });
  
  // Add foreign key constraints
  if (foreignKeys.length > 0) {
    sql += foreignKeys.join(',\n') + '\n';
  }
  
  sql += ');';
  
  // Create indexes for SQLite
  node.data.schema.forEach((column: any) => {
    if (column.constraints && column.constraints.includes('index') && !column.constraints.includes('primary')) {
      const safeTableName = node.data.label.toLowerCase().replace(/\s/g, '_');
      const safeColName = column.title.replace(/\s/g, '_');
      
      sql += `\nCREATE INDEX idx_${safeTableName}_${safeColName} ON ${tableName} (${getQuotedColumnName(column.title, useCaseSensitive)});`;
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
  settings = { caseSensitiveIdentifiers: true, useInlineConstraints: false }
): string => {
  let sql = "";
  sql += `-- Generated ${new Date().toLocaleString()} for ${type.toUpperCase()}\n`;
  sql += `-- Edit this SQL and apply changes to update your schema\n\n`;
  
  // First, generate all ENUM type definitions
  if (enumTypes && enumTypes.length > 0 && type === "postgresql") {
    sql += generateEnumTypes(enumTypes, settings.caseSensitiveIdentifiers);
  }
  
  // Process edges to collect information about foreign keys for inline format
  const inlineForeignKeys: Record<string, Record<string, any>> = {};
  
  // Track relationships to avoid duplicates
  const processedRelationships = new Set<string>();
  
  // Track constraint names to avoid duplicates
  const processedConstraints = new Set<string>();
  
  // Create a consistent relationship ID that's case-insensitive for better matching
  const getConsistentRelationshipId = (sourceTable: string, sourceColumn: string, targetTable: string, targetColumn: string) => {
    return `${sourceTable.toLowerCase()}:${sourceColumn.toLowerCase()}->${targetTable.toLowerCase()}:${targetColumn.toLowerCase()}`;
  };
  
  if (settings.useInlineConstraints) {
    schemaEdges.forEach(edge => {
      // Skip enum edges
      if (edge.data?.connectionType === 'enum') return;
      
      const sourceNode = schemaNodes.find(n => n.id === edge.source);
      const targetNode = schemaNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      // Extract column names
      const sourceHandle = edge.sourceHandle || '';
      const targetHandle = edge.targetHandle || '';
      const sourceColumn = sourceHandle.startsWith('source-') 
        ? sourceHandle.substring('source-'.length) 
        : (edge.data?.sourceColumn || 'id');
      const targetColumn = targetHandle.startsWith('target-') 
        ? targetHandle.substring('target-'.length) 
        : (edge.data?.targetColumn || 'id');
        
      // Create the foreign key info for this table-column
      if (!inlineForeignKeys[sourceNode.id]) {
        inlineForeignKeys[sourceNode.id] = {};
      }
      
      inlineForeignKeys[sourceNode.id][sourceColumn] = {
        table: targetNode.data.label,
        column: targetColumn,
        onDelete: edge.data?.onDelete,
        onUpdate: edge.data?.onUpdate
      };
    });
  }

  // Then, generate all table creation statements
  schemaNodes.forEach(node => {
    // Only process database schema nodes, not enum nodes
    if (node.type === "databaseSchema" || !node.type) {
      // If using inline constraints, add the foreign keys to the node data
      if (settings.useInlineConstraints && inlineForeignKeys[node.id]) {
        const nodeWithFKs = { ...node };
        
        nodeWithFKs.data = { ...nodeWithFKs.data };
        nodeWithFKs.data.schema = [...nodeWithFKs.data.schema].map(column => {
          if (inlineForeignKeys[node.id][column.title]) {
            return { 
              ...column, 
              foreignKey: inlineForeignKeys[node.id][column.title]
            };
          }
          return column;
        });
        
        // Generate SQL with the enhanced node data
        if (type === "postgresql") {
          sql += generatePostgresTable(nodeWithFKs, settings.caseSensitiveIdentifiers, true);
        } else if (type === "mysql") {
          sql += generateMySqlTable(nodeWithFKs, settings.caseSensitiveIdentifiers);
        } else if (type === "sqlite") {
          sql += generateSqliteTable(nodeWithFKs, settings.caseSensitiveIdentifiers, true);
        }
      } else {
        // Standard mode without inline FKs
        if (type === "postgresql") {
          sql += generatePostgresTable(node, settings.caseSensitiveIdentifiers, false);
        } else if (type === "mysql") {
          sql += generateMySqlTable(node, settings.caseSensitiveIdentifiers);
        } else if (type === "sqlite") {
          sql += generateSqliteTable(node, settings.caseSensitiveIdentifiers, true); // Always use inline for SQLite
        }
      }
      
      sql += "\n\n";
    }
  });

  // Add ALTER TABLE statements for edges between tables - but only if NOT using inline constraints
  if (schemaEdges.length > 0 && !settings.useInlineConstraints && type !== "sqlite") {
    const fkEdges = schemaEdges.filter(edge => {
      // Only include edges where both source and target are database tables (not enums)
      const sourceNode = schemaNodes.find(n => n.id === edge.source);
      const targetNode = schemaNodes.find(n => n.id === edge.target);
      return sourceNode && targetNode && 
            (sourceNode.type === "databaseSchema" || !sourceNode.type) && 
            (targetNode.type === "databaseSchema" || !targetNode.type) &&
            (!edge.data || edge.data.connectionType !== 'enum'); // Exclude enum connections
    });
    
    if (fkEdges.length > 0) {
      sql += "-- Foreign Key Constraints\n";
      
      // Track which ALTER TABLE statements we've already added to avoid duplicates
      const uniqueAlterStatements = new Set<string>();
      
      // Process each edge for ALTER TABLE statements
      fkEdges.forEach(edge => {
        const sourceNode = schemaNodes.find(n => n.id === edge.source);
        const targetNode = schemaNodes.find(n => n.id === edge.target);
        
        if (!sourceNode || !targetNode) return;
        
        // Extract column names from handles - improved to handle renamed columns
        const sourceHandle = edge.sourceHandle || '';
        const targetHandle = edge.targetHandle || '';
        
        // Use the data property first if available, otherwise extract from handle
        const sourceColumn = edge.data?.sourceColumn || 
                            (sourceHandle.startsWith('source-') 
                              ? sourceHandle.substring('source-'.length) 
                              : 'id');
          
        const targetColumn = edge.data?.targetColumn || 
                            (targetHandle.startsWith('target-') 
                              ? targetHandle.substring('target-'.length) 
                              : 'id');
        
        // Create a consistent relationship ID
        const relationshipId = getConsistentRelationshipId(
          sourceNode.data.label,
          sourceColumn,
          targetNode.data.label,
          targetColumn
        );
        
        // Skip if we've already processed this relationship
        if (processedRelationships.has(relationshipId)) {
          return;
        }
        processedRelationships.add(relationshipId);
        
        // Always quote table names with spaces, regardless of case sensitivity setting
        const sourceTableName = getQuotedTableName(sourceNode.data.label, settings.caseSensitiveIdentifiers, type);
        const targetTableName = getQuotedTableName(targetNode.data.label, settings.caseSensitiveIdentifiers, type);
        
        // Ensure column names are properly quoted, especially if they contain spaces
        const sourceColumnName = getQuotedColumnName(sourceColumn, settings.caseSensitiveIdentifiers, type);
        const targetColumnName = getQuotedColumnName(targetColumn, settings.caseSensitiveIdentifiers, type);
        
        // Create a unique constraint name based on sanitized table and column names
        const safeSourceTable = sourceNode.data.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const safeSourceColumn = sourceColumn.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        const constraintName = type === "mysql" 
          ? `\`fk_${safeSourceTable}_${safeSourceColumn}\``
          : `"fk_${safeSourceTable}_${safeSourceColumn}"`;
        
        // Create the ALTER TABLE statement
        let alterStatement = '';
        if (type === "postgresql" || type === "mysql") {
          alterStatement = `ALTER TABLE ${sourceTableName} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${sourceColumnName}) REFERENCES ${targetTableName}(${targetColumnName});`;
        }
        
        // Only add if we haven't added this exact statement already
        if (!uniqueAlterStatements.has(alterStatement)) {
          sql += alterStatement + "\n";
          uniqueAlterStatements.add(alterStatement);
        }
      });
    }
  }
  
  return sql;
};

function getFormattedIdentifier(identifier: string, caseSensitive: boolean): string {
  // If case sensitive, always quote identifiers
  if (caseSensitive) {
    return `"${identifier}"`;
  }
  
  // If case insensitive, quote only if needed (contains special chars or spaces)
  const needsQuoting = /[\s\W]/.test(identifier);
  return needsQuoting ? `"${identifier}"` : identifier;
}
