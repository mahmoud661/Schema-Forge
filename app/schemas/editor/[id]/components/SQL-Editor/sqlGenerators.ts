export const getQuotedTableName = (tableName: string): string => {
  return tableName.includes(' ') ? `"${tableName}"` : `"${tableName.toLowerCase()}"`;
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
  return typeMap[type] || 'varchar';
};

// Table-specific SQL generators
export const generatePostgresTable = (node: any) => {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    const columnName = column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`;
    sql += `  ${columnName} ${column.type}`;
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
      sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase().replace(/\s/g, '_')}_${column.title.replace(/\s/g, '_')} ON ${tableName} (${column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`});`;
    }
  });
  return sql;
};

export const generateMySqlTable = (node: any) => {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    let mysqlType = column.type;
    if (column.type === 'uuid') mysqlType = 'VARCHAR(36)';
    if (column.type === 'text') mysqlType = 'TEXT';
    if (column.type === 'int4') mysqlType = 'INT';
    if (column.type === 'timestamp') mysqlType = 'DATETIME';
    const columnName = column.title.includes(' ') ? `"${column.title}"` : column.title;
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

export const generateSqliteTable = (node: any) => {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  node.data.schema.forEach((column: any, index: number) => {
    let sqliteType = column.type;
    if (column.type === 'uuid') sqliteType = 'TEXT';
    if (column.type === 'int4') sqliteType = 'INTEGER';
    if (column.type === 'timestamp') sqliteType = 'DATETIME';
    if (column.type === 'money') sqliteType = 'REAL';
    const columnName = column.title.includes(' ') ? `"${column.title}"` : column.title;
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
export const generateSql = (type: string, schemaNodes: any[], schemaEdges: any[]): string => {
  let sql = "";
  sql += `-- Generated ${new Date().toLocaleString()} for ${type.toUpperCase()}\n`;
  sql += `-- Edit this SQL and apply changes to update your schema\n\n`;
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
  if (schemaEdges.length > 0) {
    sql += "-- Foreign Key Constraints\n";
    schemaEdges.forEach(edge => {
      // ...existing foreign key processing...
      // For brevity, use same logic as before.
      const sourceNode = schemaNodes.find(n => n.id === edge.source);
      const targetNode = schemaNodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sourceColumn = edge.sourceHandle?.split('-')[1] || 'id';
        const targetColumn = edge.targetHandle?.split('-')[1] || 'id';
        const sourceTableName = getQuotedTableName(sourceNode.data.label);
        const targetTableName = getQuotedTableName(targetNode.data.label);
        if (type === "postgresql" || type === "mysql") {
          sql += `ALTER TABLE ${sourceTableName} ADD CONSTRAINT fk_${sourceNode.data.label.toLowerCase().replace(/\s/g, '_')}_${targetNode.data.label.toLowerCase().replace(/\s/g, '_')} FOREIGN KEY ("${sourceColumn}") REFERENCES ${targetTableName}("${targetColumn}");\n`;
        } else if (type === "sqlite") {
          sql += `-- For SQLite, foreign keys would be defined in the CREATE TABLE statement\n`;
        }
      }
    });
  }
  return sql;
};
