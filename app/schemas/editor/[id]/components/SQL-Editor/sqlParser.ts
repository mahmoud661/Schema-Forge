import { mapToBaseType } from "./sqlGenerators";

export const parseSqlToSchema = (sql: string): { nodes: any[], edges: any[], enumTypes?: any[] } | null => {
  try {
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    const tableMap: Record<string, string> = {};
    const columnMap: Record<string, Record<string, string>> = {}; // table -> column -> nodeId
    const enumTypes: any[] = [];
    
    // First, extract ENUM types
    const enumRegex = /CREATE\s+TYPE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+AS\s+ENUM\s*\(\s*((?:'[^']*'(?:\s*,\s*'[^']*')*)\s*)\)/gi;
    let enumMatch;
    
    while ((enumMatch = enumRegex.exec(sql)) !== null) {
      const enumName = enumMatch[1].replace(/^["'`]|["'`]$/g, '');
      const valuesString = enumMatch[2];
      
      // Extract the enum values from the string
      const valueRegex = /'([^']*)'/g;
      const values: string[] = [];
      let valueMatch;
      while ((valueMatch = valueRegex.exec(valuesString)) !== null) {
        values.push(valueMatch[1]);
      }
      
      enumTypes.push({
        name: enumName,
        values: values
      });
      
      console.log(`Parsed ENUM type: ${enumName} with values: ${values.join(', ')}`);
    }
    
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
    let tableMatch;
    let tableIndex = 0;
    let foundTables = false;
    
    // Next, extract tables and columns
    while ((tableMatch = tableRegex.exec(sql)) !== null) {
      foundTables = true;
      const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3] || tableMatch[4];
      const tableContent = tableMatch[5];
      if (!tableName || !tableContent) continue;
      
      // Store both normalized and original names for proper lookup
      const normalizedName = tableName.toLowerCase();
      const nodeId = `sql-node-${Date.now()}-${tableIndex}`;
      tableMap[normalizedName] = nodeId;
      tableMap[tableName] = nodeId; // Also store with original case
      columnMap[normalizedName] = {};
      
      console.log(`Parsed table: "${tableName}" with ID: ${nodeId}`);
      
      const columns: any[] = [];
      // Split by commas not inside parentheses
      const columnLines = tableContent.split(/,(?![^(]*\))/)
        .map(line => line.trim()).filter(line => line.length > 0);
      const columnNames = new Set();
      const inlineConstraints: any[] = [];
      
      for (const columnLine of columnLines) {
        // Check if line is a foreign key constraint
        if (/FOREIGN\s+KEY/i.test(columnLine)) {
          const fkMatch = /FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(columnLine);
          if (fkMatch) {
            inlineConstraints.push({
              sourceColumn: fkMatch[1].trim().replace(/^["'`]|["'`]$/g, ''),
              targetTable: fkMatch[2].trim().replace(/^["'`]|["'`]$/g, ''),
              targetColumn: fkMatch[3].trim().replace(/^["'`]|["'`]$/g, '')
            });
          }
          continue;
        }
        
        // Skip other constraints
        if (/^\s*(?:PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(columnLine)) {
          continue;
        }
        
        // Parse regular column definitions with enhanced regex for ENUM types and defaults
        const columnRegex = /^\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
        const columnMatch = columnLine.match(columnRegex);
        
        if (columnMatch) {
          let columnName = columnMatch[1] || columnMatch[2] || columnMatch[3] || columnMatch[4];
          // Strip leading/trailing quotes
          columnName = columnName.replace(/^["'`]|["'`]$/g, '');
          let columnType = columnMatch[5];
          const constraintText = columnMatch[6] || '';
          const constraints: string[] = [];
          
          // Check if the type is an ENUM
          const isEnum = enumTypes.some(et => et.name.toLowerCase() === columnType.toLowerCase());
          if (isEnum) {
            // Make a special enum type identifier to handle in the visual editor
            columnType = `enum_${columnType.toLowerCase()}`;
          }
          
          if (columnType.toUpperCase() === 'SERIAL') {
            columnType = 'int4';
            constraints.push('primary');
          }
          
          let defaultValue = null;
          
          // Check for constraints and defaults
          if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
          if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
          if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
          
          // Extract DEFAULT value
          const defaultMatch = /DEFAULT\s+(.*?)(?:\s+|$)/i.exec(constraintText);
          if (defaultMatch) {
            defaultValue = defaultMatch[1].trim();
            // If default value is quoted, clean it up
            if ((defaultValue.startsWith("'") && defaultValue.endsWith("'")) ||
                (defaultValue.startsWith('"') && defaultValue.endsWith('"'))) {
              defaultValue = defaultValue.substring(1, defaultValue.length - 1);
            }
          }
          
          // Check for inline foreign key reference
          const inlineFkMatch = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(constraintText);
          let foreignKey = null;
          
          if (inlineFkMatch) {
            const targetTable = inlineFkMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
            const targetColumn = inlineFkMatch[2].trim().replace(/^["'`]|["'`]$/g, '');
            
            foreignKey = {
              table: targetTable,
              column: targetColumn
            };
            
            // Check for ON DELETE/UPDATE clauses
            const onDeleteMatch = /ON\s+DELETE\s+([A-Z_]+)/i.exec(constraintText);
            if (onDeleteMatch) {
              foreignKey.onDelete = onDeleteMatch[1].toUpperCase();
            }
            
            const onUpdateMatch = /ON\s+UPDATE\s+([A-Z_]+)/i.exec(constraintText);
            if (onUpdateMatch) {
              foreignKey.onUpdate = onUpdateMatch[1].toUpperCase();
            }
            
            inlineConstraints.push({
              sourceColumn: columnName,
              targetTable: targetTable,
              targetColumn: targetColumn
            });
          }
          
          // Handle duplicate column names
          if (columnNames.has(columnName.toLowerCase())) {
            let suffix = 1;
            let newName = `${columnName}_${suffix}`;
            while (columnNames.has(newName.toLowerCase())) {
              suffix++;
              newName = `${columnName}_${suffix}`;
            }
            columnName = newName;
          }
          
          columnNames.add(columnName.toLowerCase());
          const columnId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          columnMap[normalizedName][columnName.toLowerCase()] = columnId;
          
          columns.push({
            title: columnName,
            type: isEnum ? columnType : mapToBaseType(columnType),
            constraints,
            id: columnId,
            default: defaultValue,
            foreignKey
          });
        }
      }
      
      if (columns.length > 0) {
        newNodes.push({
          id: nodeId,
          type: 'databaseSchema',
          position: { x: 100 + (tableIndex % 3) * 300, y: 100 + Math.floor(tableIndex / 3) * 200 },
          data: { label: tableName, schema: columns }
        });
        
        // Process inline foreign key constraints
        for (const constraint of inlineConstraints) {
          const targetNodeId = tableMap[constraint.targetTable] || tableMap[constraint.targetTable.toLowerCase()];
          if (targetNodeId) {
            newEdges.push(createEdge(
              nodeId,
              targetNodeId,
              constraint.sourceColumn,
              constraint.targetColumn
            ));
          }
        }
        
        tableIndex++;
      }
    }
    
    // Second pass: Extract ALTER TABLE foreign key constraints
    // Updated regex to handle quoted table names with spaces
    const alterTableRegex = /ALTER\s+TABLE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+ADD\s+CONSTRAINT\s+\w+\s+FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/gi;
    let alterMatch;
    
    console.log("Parsing ALTER TABLE statements...");
    
    while ((alterMatch = alterTableRegex.exec(sql)) !== null) {
      const sourceTable = alterMatch[1].replace(/^["'`]|["'`]$/g, '');
      const sourceColumn = alterMatch[2].replace(/^["'`]|["'`]$/g, '');
      const targetTable = alterMatch[3].replace(/^["'`]|["'`]$/g, '');
      const targetColumn = alterMatch[4].replace(/^["'`]|["'`]$/g, '');
      
      console.log(`Found FK: ${sourceTable}(${sourceColumn}) -> ${targetTable}(${targetColumn})`);
      
      // Look up table IDs using original casing and normalized casing
      let sourceNodeId = tableMap[sourceTable] || tableMap[sourceTable.toLowerCase()];
      let targetNodeId = tableMap[targetTable] || tableMap[targetTable.toLowerCase()];
      
      if (sourceNodeId && targetNodeId) {
        console.log(`Creating edge: ${sourceNodeId} -> ${targetNodeId}`);
        const newEdge = createEdge(
          sourceNodeId,
          targetNodeId,
          sourceColumn,
          targetColumn
        );
        newEdges.push(newEdge);
        console.log(`Edge created: ${newEdge.id}`);
      } else {
        console.warn(`Could not map tables to nodes: ${sourceTable} -> ${targetTable}`);
        console.warn(`Available table mappings: ${Object.keys(tableMap).join(", ")}`);
      }
    }
    
    // Special debug for troubleshooting
    if (newEdges.length === 0 && sql.toUpperCase().includes("ALTER TABLE")) {
      console.warn("No edges were created, but ALTER TABLE statements exist");
      console.warn("SQL contains:", sql);
    }
    
    if (!foundTables && sql.toUpperCase().includes('CREATE TABLE')) {
      throw new Error("SQL syntax appears to be invalid. Check for proper table definitions.");
    } else if (newNodes.length === 0) {
      throw new Error("No valid tables found in the SQL. Please check your syntax.");
    }
    
    return { nodes: newNodes, edges: newEdges, enumTypes };
  } catch (error: any) {
    console.error('Error parsing SQL:', error);
    throw new Error(`Failed to parse SQL: ${error.message}`);
  }
};

function createEdge(sourceNodeId: string, targetNodeId: string, sourceColumn: string, targetColumn: string) {
  return {
    id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: `source-${sourceColumn}`,
    targetHandle: `target-${targetColumn}`,
    type: 'smoothstep',
    animated: true,
    label: 'references',
    data: { relationshipType: 'oneToMany' }
  };
}
