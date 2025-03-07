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
    
    // Store all pending foreign key constraints to process after all tables are created
    const pendingForeignKeys: Array<{
      sourceNodeId: string;
      sourceColumn: string;
      targetTable: string;
      targetColumn: string;
    }> = [];
    
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

    // Get existing edges for preservation
    const existingEdgesMap = new Map();
    useSchemaStore.getState().schema.edges.forEach(edge => {
      // Create a stable key for the edge relationship
      const key = `${edge.source}:${edge.sourceHandle}:${edge.target}:${edge.targetHandle}`;
      existingEdgesMap.set(key, edge);
    });

    // First extract ENUM types
    const enumRegex = /CREATE\s+TYPE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+AS\s+ENUM\s*\(\s*((?:'[^']*'(?:\s*,\s*'[^']*')*)\s*)\)/gi;
    let enumMatch;
    let enumIndex = 0;

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
    
    // FIRST PASS: Extract all table definitions
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
    let tableMatch;
    let tableIndex = 0;
    let foundTables = false;
    
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
      
      // Process rows and collect inline constraints
      for (const rowLine of rowLines) {
        // Check if line is a foreign key constraint
        if (/FOREIGN\s+KEY/i.test(rowLine)) {
          const fkMatch = /FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(rowLine);
          if (fkMatch) {
            const constraint = {
              sourceColumn: fkMatch[1].trim().replace(/^["'`]|["'`]$/g, ''),
              targetTable: fkMatch[2].trim().replace(/^["'`]|["'`]$/g, ''),
              targetColumn: fkMatch[3].trim().replace(/^["'`]|["'`]$/g, '')
            };
            inlineConstraints.push(constraint);
            
            // Also add to the pending foreign keys list
            pendingForeignKeys.push({
              sourceNodeId: nodeId,
              sourceColumn: constraint.sourceColumn,
              targetTable: constraint.targetTable,
              targetColumn: constraint.targetColumn
            });
            
            console.log(`Added FK constraint: ${constraint.sourceColumn} -> ${constraint.targetTable}(${constraint.targetColumn})`);
          }
          continue;
        }
        
        // Skip other constraints that are not columns
        if (/^\s*(?:PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(rowLine)) {
          continue;
        }
        
        // IMPROVED: More robust regex for parsing row definitions including inline REFERENCES
        // Match either quoted identifiers or bare words followed by type and constraints
        const rowRegex = /^\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
        const rowMatch = rowLine.match(rowRegex);
        
        if (rowMatch) {
          let rowName = rowMatch[1] || rowMatch[2] || rowMatch[3] || rowMatch[4];
          rowName = rowName.replace(/^["'`]|["'`]$/g, '');
          let rowType = rowMatch[5];
          const constraintText = rowMatch[6] || '';
          const constraints: string[] = [];
          
          // Check for enum type
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
          
          // Process constraints
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
          
          // Define foreignKey variable
          let foreignKey = null;
          
          // IMPROVED: Check for inline REFERENCES constraint in column definition
          // This specifically targets patterns like: "id" uuid NOT NULL REFERENCES "New Table_1"("id")
          
          // First try specific format from the example
          const directRefMatch = /\bREFERENCES\s+(?:`|"|')?([^`"'(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(constraintText);
          
          if (directRefMatch) {
            const targetTable = directRefMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
            const targetColumn = directRefMatch[2] ? directRefMatch[2].trim().replace(/^["'`]|["'`]$/g, '') : 'id';
            
            console.log(`Found inline reference in column: ${rowName} -> ${targetTable}(${targetColumn})`);
            
            foreignKey = {
              table: targetTable,
              row: targetColumn
            };
            
            // Add to pending foreign keys for processing in second pass
            pendingForeignKeys.push({
              sourceNodeId: nodeId,
              sourceColumn: rowName,
              targetTable: targetTable, 
              targetColumn: targetColumn
            });
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
            type: rowType,
            constraints,
            id: rowId,
            default: defaultValue,
            foreignKey
          });
          
          // Process enum connections
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
        
        // Store inline constraints for the second pass
        for (const constraint of inlineConstraints) {
          pendingForeignKeys.push({
            sourceNodeId: nodeId,
            sourceColumn: constraint.sourceColumn,
            targetTable: constraint.targetTable,
            targetColumn: constraint.targetColumn
          });
        }
        
        tableIndex++;
      }
    }
    
    // SECOND PASS: Extract ALTER TABLE foreign key constraints
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
        
        // Create the edge with proper handle formatting and preserve properties
        const newEdge = createEdge(
          sourceNodeId,
          targetNodeId,
          sourceColumn,
          targetColumn,
          existingEdgesMap // Pass existing edges map to preserve properties
        );
        
        newEdges.push(newEdge);
        console.log(`Edge created: ${newEdge.id}`);
      } else {
        console.warn(`Could not map tables to nodes: ${sourceTable} -> ${targetTable}`);
      }
    }
    
    // FINAL PASS: Process all pending foreign keys now that all tables are created
    console.log(`Processing ${pendingForeignKeys.length} pending foreign key relationships`);
    
    for (const fk of pendingForeignKeys) {
      // Look up target node ID using both original and lowercase table names
      const targetNodeId = tableMap[fk.targetTable] || tableMap[fk.targetTable.toLowerCase()];
      
      if (targetNodeId) {
        const edge = createEdge(
          fk.sourceNodeId,
          targetNodeId,
          fk.sourceColumn,
          fk.targetColumn,
          existingEdgesMap // Pass existing edges map to preserve properties
        );
        newEdges.push(edge);
        console.log(`Created edge: ${fk.sourceNodeId} -> ${targetNodeId} (${fk.sourceColumn} -> ${fk.targetColumn})`);
      } else {
        console.warn(`Missing target table mapping for FK: ${fk.targetTable}`);
        console.warn(`Available tables in map:`, Object.keys(tableMap).join(', '));
        console.warn(`Looking for table: ${fk.targetTable} (lowercase: ${fk.targetTable.toLowerCase()})`);
      }
    }

    // Final validation checks
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

// Keep the improved createEdge function
function createEdge(sourceNodeId: string, targetNodeId: string, sourceColumn: string, targetColumn: string, existingEdgesMap?: Map<string, any>) {
  const sourceHandle = `source-${sourceColumn}`;
  const targetHandle = `target-${targetColumn}`;
  const relationshipKey = `${sourceNodeId}:${sourceHandle}:${targetNodeId}:${targetHandle}`;
  
  // For bi-directional checking, also create the reverse key
  const reverseKey = `${targetNodeId}:target-${targetColumn}:${sourceNodeId}:source-${sourceColumn}`;
  
  console.log(`Creating edge with key: ${relationshipKey}`);
  
  // Generate consistent ID based on the relationship - this ensures edges remain stable
  const stableId = `edge-${sourceNodeId}-${sourceColumn}-${targetNodeId}-${targetColumn}`;
  
  // Check if this edge already exists in either direction
  const existingEdge = existingEdgesMap?.get(relationshipKey) || existingEdgesMap?.get(reverseKey);
  
  if (existingEdge) {
    console.log(`Found existing edge, preserving properties: ${existingEdge.id}`);
    return {
      ...existingEdge,
      // Ensure these core properties are correctly set
      id: stableId, // Use stable ID for consistency 
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
    };
  }
  
  // Create a new edge
  return {
    id: stableId,
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: sourceHandle,
    targetHandle: targetHandle,
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
