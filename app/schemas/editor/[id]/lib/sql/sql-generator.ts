import { SchemaNode } from "../../types";
import { mapSchemaTypeToSqlType } from "./sql-types";

/**
 * Generates SQL CREATE TABLE statements from schema nodes and edges
 */
export function generateSql(dbType: string, nodes: SchemaNode[], edges: any[]): string {
  let sql = "";
  
  // Add SQL header comment
  sql += `-- Generated ${new Date().toLocaleString()} for ${dbType.toUpperCase()}\n`;
  sql += `-- Edit this SQL and apply changes to update your schema\n\n`;
  
  // Create tables
  nodes.forEach(node => {
    if (dbType === "postgresql") {
      sql += generatePostgresTable(node);
    } else if (dbType === "mysql") {
      sql += generateMySqlTable(node);
    } else if (dbType === "sqlite") {
      sql += generateSqliteTable(node);
    }
    sql += "\n\n";
  });
  
  // Create foreign keys
  if (edges.length > 0) {
    sql += "-- Foreign Key Constraints\n";
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Extract column names from the handles
        const sourceColumn = edge.sourceHandle?.split('-')[1] || 'id';
        const targetColumn = edge.targetHandle?.split('-')[1] || 'id';
        
        const sourceTableName = getQuotedTableName(sourceNode.data.label);
        const targetTableName = getQuotedTableName(targetNode.data.label);
        
        if (dbType === "postgresql" || dbType === "mysql") {
          sql += `ALTER TABLE ${sourceTableName} ADD CONSTRAINT fk_${sourceNode.data.label.toLowerCase().replace(/\s/g, '_')}_${targetNode.data.label.toLowerCase().replace(/\s/g, '_')} `;
          sql += `FOREIGN KEY ("${sourceColumn}") REFERENCES ${targetTableName}("${targetColumn}")`;
          
          // Add ON DELETE CASCADE if specified
          if (edge.data?.onDelete === 'CASCADE') {
            sql += ` ON DELETE CASCADE`;
          }
          
          sql += `;\n`;
        } else if (dbType === "sqlite") {
          // SQLite doesn't support ALTER TABLE ADD CONSTRAINT
          sql += `-- For SQLite, foreign keys would be defined in the CREATE TABLE statement\n`;
        }
      }
    });
  }
  
  return sql;
}

// Helper function to properly quote table names with spaces
function getQuotedTableName(tableName: string): string {
  return tableName.includes(' ') ? `"${tableName}"` : `"${tableName.toLowerCase()}"`;
}

function generatePostgresTable(node: SchemaNode): string {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  node.data.schema.forEach((column, index) => {
    // Quote column names if they contain spaces
    const columnName = column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`;
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
      sql += `\nCREATE INDEX idx_${node.data.label.toLowerCase().replace(/\s/g, '_')}_${column.title.replace(/\s/g, '_')} ON ${tableName} (${column.title.includes(' ') ? `"${column.title}"` : `"${column.title}"`});`;
    }
  });
  
  return sql;
}

function generateMySqlTable(node: SchemaNode): string {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  node.data.schema.forEach((column, index) => {
    // Map PostgreSQL types to MySQL types
    let mysqlType = mapSchemaTypeToSqlType(column.type, 'mysql');
    
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
}

function generateSqliteTable(node: SchemaNode): string {
  const tableName = getQuotedTableName(node.data.label);
  let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
  
  node.data.schema.forEach((column, index) => {
    // Map PostgreSQL types to SQLite types
    let sqliteType = mapSchemaTypeToSqlType(column.type, 'sqlite');
    
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
}
