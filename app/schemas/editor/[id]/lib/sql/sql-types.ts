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

/**
 * Maps schema editor types to specific SQL dialect types
 * @param schemaType Schema type like int4 or varchar
 * @param dialect SQL dialect (postgresql, mysql, sqlite)
 * @returns The type string for the specified dialect
 */
export function mapSchemaTypeToSqlType(schemaType: string, dialect: string): string {
  const baseType = schemaType.toLowerCase().split('(')[0].trim();
  
  const dialectMaps: Record<string, Record<string, string>> = {
    postgresql: {
      // PostgreSQL uses the same types as our schema
      'int4': 'INTEGER',
      'varchar': 'VARCHAR(255)',
      'text': 'TEXT',
      'money': 'DECIMAL(10,2)',
      'timestamp': 'TIMESTAMP',
      'date': 'DATE',
      'time': 'TIME',
      'boolean': 'BOOLEAN',
      'jsonb': 'JSONB',
      'uuid': 'UUID'
    },
    mysql: {
      'int4': 'INT',
      'varchar': 'VARCHAR(255)',
      'text': 'TEXT',
      'money': 'DECIMAL(10,2)',
      'timestamp': 'DATETIME',
      'date': 'DATE',
      'time': 'TIME',
      'boolean': 'BOOLEAN',
      'jsonb': 'JSON',
      'uuid': 'VARCHAR(36)'
    },
    sqlite: {
      'int4': 'INTEGER',
      'varchar': 'TEXT',
      'text': 'TEXT',
      'money': 'REAL',
      'timestamp': 'DATETIME',
      'date': 'DATE',
      'time': 'TIME',
      'boolean': 'INTEGER',
      'jsonb': 'TEXT',
      'uuid': 'TEXT'
    }
  };
  
  const dialectMap = dialectMaps[dialect] || dialectMaps.postgresql;
  return dialectMap[baseType] || schemaType;
}
