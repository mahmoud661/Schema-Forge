import { mapToBaseType } from "./sqlGenerators";
import { useSchemaStore } from "@/hooks/use-schema";

export const parseSqlToSchema = (sql: string): { nodes: any[], edges: any[], enumTypes?: any[] } | null => {
  try {
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    const tableMap: Record<string, string> = {};
    const rowMap: Record<string, Record<string, string>> = {}; // table -> row -> nodeId
    const enumTypes: any[] = [];
    const enumNodeMap: Record<string, string> = {}; // enumName -> nodeId
    
    // First, extract ENUM types
    const enumRegex = /CREATE\s+TYPE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+AS\s+ENUM\s*\(\s*((?:'[^']*'(?:\s*,\s*'[^']*')*)\s*)\)/gi;
    let enumMatch;
    let enumIndex = 0;
    
    // Get existing nodes for position/color preservation
    const existingNodesMap = new Map();
    useSchemaStore.getState().schema.nodes.forEach(node => {
      if (node.type === 'databaseSchema' || !node.type) {
        existingNodesMap.set(node.data.label.toLowerCase(), node);
      }
    });

    // Map for enum nodes
    const existingEnumMap = new Map();
    useSchemaStore.getState().schema.nodes.forEach(node => {
      if (node.type === 'enumType') {
        existingEnumMap.set(node.data.name.toLowerCase(), node);
      }
    });

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
      
      // Create an enum node for the visual flow
      const nodeId = `enum-node-${Date.now()}-${enumIndex}`;
      enumNodeMap[enumName.toLowerCase()] = nodeId;
      
      // Check if enum already exists to preserve position
      const existingEnum = existingEnumMap.get(enumName.toLowerCase());
      const enumPosition = existingEnum 
        ? existingEnum.position 
        : { x: 100 + enumIndex * 250, y: 100 };
      
      // Add the enum node to the newNodes array with preserved position
      newNodes.push({
        id: nodeId,
        type: 'enumType',
        position: enumPosition,
        data: { name: enumName, values: values }
      });
      
      enumIndex++;
      console.log(`Parsed ENUM type: ${enumName} with values: ${values.join(', ')}`);
    }
    
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
    let tableMatch;
    let tableIndex = 0;
    let foundTables = false;
    
    // Next, extract tables and rows
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
      rowMap[normalizedName] = {};
      
      console.log(`Parsed table: "${tableName}" with ID: ${nodeId}`);
      
      const rows: any[] = [];
      // Split by commas not inside parentheses
      const rowLines = tableContent.split(/,(?![^(]*\))/)
        .map(line => line.trim()).filter(line => line.length > 0);
      const rowNames = new Set();
      const inlineConstraints: any[] = [];
      
      for (const rowLine of rowLines) {
        // Check if line is a foreign key constraint
        if (/FOREIGN\s+KEY/i.test(rowLine)) {
          const fkMatch = /FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(rowLine);
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
        if (/^\s*(?:PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(rowLine)) {
          continue;
        }
        
        // Parse regular row definitions with enhanced regex for ENUM types and defaults
        const rowRegex = /^\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
        const rowMatch = rowLine.match(rowRegex);
        
        if (rowMatch) {
          let rowName = rowMatch[1] || rowMatch[2] || rowMatch[3] || rowMatch[4];
          // Strip leading/trailing quotes
          rowName = rowName.replace(/^["'`]|["'`]$/g, '');
          let rowType = rowMatch[5];
          const constraintText = rowMatch[6] || '';
          const constraints: string[] = [];
          
          // Check if the type is an ENUM or references an enum
          let isEnum = false;
          let enumTypeName = '';
          
          // Check both for exact enum type name and for enum_prefix format
          if (rowType.startsWith('enum_')) {
            // Format: enum_typename
            isEnum = true;
            enumTypeName = rowType.substring(5); // Remove 'enum_' prefix
          } else {
            // Check if the type directly matches an enum name (case-insensitive)
            const matchingEnum = enumTypes.find(et => 
              et.name.toLowerCase() === rowType.toLowerCase()
            );
            
            if (matchingEnum) {
              isEnum = true;
              enumTypeName = matchingEnum.name;
              // Convert to standard format for consistency
              rowType = `enum_${enumTypeName.toLowerCase()}`;
            }
          }
          
          if (rowType.toUpperCase() === 'SERIAL') {
            rowType = 'int4';
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
          
          // Check for inline foreign key reference - IMPROVED to handle more cases
          // More comprehensive regex to catch inline REFERENCES pattern
          let inlineFkMatch = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(constraintText);
          
          // If not found with the first pattern, try an alternative that handles different SQL styles
          if (!inlineFkMatch) {
            // Handle formats like: INT REFERENCES users(id) and UUID REFERENCES users(id) ON DELETE CASCADE
            inlineFkMatch = /\b(?:INT|INTEGER|SERIAL|UUID|VARCHAR|TEXT|TIMESTAMP|BOOLEAN|JSONB)\b.*?REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(rowLine);
          }
          
          // If still not found, try a more generic approach that doesn't require type prefix
          if (!inlineFkMatch) {
            // This is a more generic pattern that might catch other variations
            inlineFkMatch = /\bREFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(rowLine);
          }
          
          // Improved regex pattern for inline foreign key detection
          // First try the exact "REFERENCES" pattern
          inlineFkMatch = /\bREFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(constraintText);
          
          if (!inlineFkMatch) {
            // Try with quoted table name
            inlineFkMatch = /\bREFERENCES\s+"([^"]+)"\s*\(\s*"?([^",\)]+)"?\s*\)/i.exec(constraintText);
          }
          
          if (!inlineFkMatch) {
            // Try with single quoted name
            inlineFkMatch = /\bREFERENCES\s+'([^']+)'\s*\(\s*'?([^',\)]+)'?\s*\)/i.exec(constraintText);
          }
          
          if (!inlineFkMatch) {
            // Try most generic form 
            inlineFkMatch = /\bREFERENCES\s+([\w\s]+)\s*\(\s*([\w\s]+)\s*\)/i.exec(constraintText);
          }
          
          let foreignKey = null;
          
          if (inlineFkMatch) {
            const targetTable = inlineFkMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
            const targetColumn = inlineFkMatch[2] ? inlineFkMatch[2].trim().replace(/^["'`]|["'`]$/g, '') : 'id';
            
            foreignKey = {
              table: targetTable,
              row: targetColumn
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
              sourceColumn: rowName,
              targetTable: targetTable,
              targetColumn: targetColumn
            });
            
            console.log(`Added inline foreign key constraint: ${rowName} -> ${targetTable}(${targetColumn})`);
          }
          
          // Handle duplicate row names
          if (rowNames.has(rowName.toLowerCase())) {
            let suffix = 1;
            let newName = `${rowName}_${suffix}`;
            while (rowNames.has(newName.toLowerCase())) {
              suffix++;
              newName = `${rowName}_${suffix}`;
            }
            rowName = newName;
          }
          
          rowNames.add(rowName.toLowerCase());
          const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          rowMap[normalizedName][rowName.toLowerCase()] = rowId;
          
          rows.push({
            title: rowName,
            type: rowType,  // Keep the enum_prefixed format
            constraints,
            id: rowId,
            default: defaultValue,
            foreignKey
          });
          
          // If this is an enum row, create an edge connection to the enum node
          if (isEnum) {
            const enumNodeId = enumNodeMap[enumTypeName.toLowerCase()];
            if (enumNodeId) {
              // Create edge from enum node to this row
              newEdges.push({
                id: `enum-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source: enumNodeId,
                target: nodeId,  // The table node
                sourceHandle: `enum-source-${enumTypeName}`,
                targetHandle: `target-${rowName}`,
                type: 'smoothstep',
                animated: true,
                label: 'enum type',
                style: { stroke: '#a855f7' },  // Purple color for enum connections
                data: { connectionType: 'enum' }
              });
            }
          }
        }
      }
      
      if (rows.length > 0) {
        // Check if this table already exists to preserve position and color
        const existingNode = existingNodesMap.get(normalizedName);
        
        // If node exists, use its position and color; otherwise use defaults
        const position = existingNode 
          ? existingNode.position 
          : { x: 100 + (tableIndex % 3) * 300, y: 100 + Math.floor(tableIndex / 3) * 200 };
        
        // Preserve color if it exists
        const color = existingNode?.data?.color;
        
        newNodes.push({
          id: nodeId,
          type: 'databaseSchema',
          position: position,
          data: { 
            label: tableName, 
            schema: rows,
            // Only include color if it was previously set
            ...(color && { color })
          }
        });
        
        // Process inline foreign key constraints - ENHANCED for better tracking
        for (const constraint of inlineConstraints) {
          const targetNodeId = tableMap[constraint.targetTable] || tableMap[constraint.targetTable.toLowerCase()];
          if (targetNodeId) {
            const edge = createEdge(
              nodeId,
              targetNodeId,
              constraint.sourceColumn,
              constraint.targetColumn
            );
            newEdges.push(edge);
            console.log(`Created inline FK edge: ${nodeId} -> ${targetNodeId} (${constraint.sourceColumn} -> ${constraint.targetColumn})`);
          } else {
            console.warn(`Missing target table mapping for FK: ${constraint.targetTable}`);
          }
        }
        
        tableIndex++;
      }
    }
    
    // Second pass: Extract ALTER TABLE foreign key constraints - FIXED REGEX PATTERN
    console.log("Parsing ALTER TABLE statements with improved pattern...");
    
    // Improved regex that better handles quoted identifiers and whitespace
    const alterTableRegex = /ALTER\s+TABLE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+ADD\s+(?:CONSTRAINT\s+(?:`|"|')?\w+(?:`|"|')?\s+)?FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/gi;
    let alterMatch;

    while ((alterMatch = alterTableRegex.exec(sql)) !== null) {
      const sourceTable = alterMatch[1].replace(/^["'`]|["'`]$/g, '');
      const sourceColumn = alterMatch[2].replace(/^["'`]|["'`]$/g, '');
      const targetTable = alterMatch[3].replace(/^["'`]|["'`]$/g, '');
      const targetColumn = alterMatch[4].replace(/^["'`]|["'`]$/g, '');
      
      console.log(`Found FK: ${sourceTable}(${sourceColumn}) -> ${targetTable}(${targetColumn})`);
      
      // Debug log all available tables
      console.log("Available tables:", Object.keys(tableMap).join(", "));
      
      // Look up table IDs using original casing and normalized casing
      let sourceNodeId = tableMap[sourceTable] || tableMap[sourceTable.toLowerCase()];
      let targetNodeId = tableMap[targetTable] || tableMap[targetTable.toLowerCase()];
      
      console.log(`Source node ID: ${sourceNodeId}, Target node ID: ${targetNodeId}`);
      
      if (sourceNodeId && targetNodeId) {
        console.log(`Creating edge: ${sourceNodeId} -> ${targetNodeId}`);
        
        // Create the edge with proper handle formatting
        const newEdge = {
          id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: `source-${sourceColumn}`,
          targetHandle: `target-${targetColumn}`,
          type: 'smoothstep',
          animated: true,
          label: `${sourceColumn} → ${targetColumn}`,
          data: { 
            relationshipType: 'oneToMany',
            sourceColumn,
            targetColumn
          }
        };
        
        newEdges.push(newEdge);
        console.log(`Edge created: ${newEdge.id}`);
      } else {
        console.warn(`Could not map tables to nodes: ${sourceTable} -> ${targetTable}`);
      }
    }
    
    // Comprehensive debug to ensure ALTER statements are processed
    if (newEdges.length === 0 && sql.toUpperCase().includes("ALTER TABLE")) {
      console.warn("No edges were created, but ALTER TABLE statements exist");
      
      // Extract just the ALTER statements for debugging
      const alterStatements = sql.match(/ALTER\s+TABLE\s+.*?;/gi) || [];
      console.warn(`Found ${alterStatements.length} ALTER statements:`, alterStatements);
      
      // Check table mappings
      console.warn("Table mappings:", tableMap);
    }
    
    if (!foundTables && sql.toUpperCase().includes('CREATE TABLE')) {
      throw new Error("SQL syntax appears to be invalid. Check for proper table definitions.");
    } else if (newNodes.length === 0) {
      throw new Error("No valid tables found in the SQL. Please check your syntax.");
    }
    
    // Before returning, log the complete list of edges for debugging
    console.log(`Created ${newEdges.length} edges:`, newEdges.map(e => 
      `${e.source}(${e.sourceHandle}) -> ${e.target}(${e.targetHandle})`
    ));
    
    return { nodes: newNodes, edges: newEdges, enumTypes };
  } catch (error: any) {
    console.error('Error parsing SQL:', error);
    throw new Error(`Failed to parse SQL: ${error.message}`);
  }
};

// Replace createEdge with a more robust implementation
function createEdge(sourceNodeId: string, targetNodeId: string, sourceColumn: string, targetColumn: string) {
  // Ensure we're creating a valid edge
  console.log(`Creating edge: ${sourceNodeId}:${sourceColumn} -> ${targetNodeId}:${targetColumn}`);
  
  return {
    id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    source: sourceNodeId,
    target: targetNodeId, 
    sourceHandle: `source-${sourceColumn}`,
    targetHandle: `target-${targetColumn}`,
    type: 'smoothstep',
    animated: true,
    label: `${sourceColumn} → ${targetColumn}`,
    data: { 
      relationshipType: 'oneToMany',
      sourceColumn,
      targetColumn
    }
  };
}
