import { mapToBaseType } from "./sqlGenerators";
import { useSchemaStore } from "@/hooks/use-schema";

// Helper functions for name normalization and relationship identification
function createRelationshipId(sourceTable: string, sourceColumn: string, targetTable: string, targetColumn: string): string {
  return `${sourceTable.toLowerCase()}:${sourceColumn.toLowerCase()}->${targetTable.toLowerCase()}:${targetColumn.toLowerCase()}`;
}

function normalizeIdentifier(identifier: string): string {
  return identifier.toLowerCase().replace(/^["'`]|["'`]$/g, '');
}

function normalizeTableName(name: string): string {
  return name.replace(/^["'`]|["'`]$/g, '').toLowerCase();
}

export const parseSqlToSchema = (sql: string): { nodes: any[], edges: any[], enumTypes?: any[] } | null => {
  try {
    // Initialize schema components
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    const tableMap: Record<string, string> = {};
    const tableNameToNodeIdMap: Record<string, string> = {};
    const rowMap: Record<string, Record<string, string>> = {};
    const enumTypes: any[] = [];
    const enumNodeMap: Record<string, string> = {};
    
    // Tracking sets to avoid duplicates
    const processedRelationships = new Set<string>();
    const processedConstraints = new Set<string>();
    const pendingForeignKeys: Array<{
      sourceNodeId: string;
      sourceColumn: string;
      targetTable: string;
      targetColumn: string;
      relationshipId: string;
      sourceTable: string;
      constraintName?: string;
    }> = [];
    
    // Load existing schema data for preservation
    const existingNodesMap = new Map();
    const allNodes = useSchemaStore.getState().schema.nodes;
    
    // Build node mapping for lookups
    allNodes.forEach(node => {
      if (node.type === 'databaseSchema' || !node.type) {
        existingNodesMap.set(node.data.label.toLowerCase(), node);
        tableNameToNodeIdMap[node.data.label.toLowerCase()] = node.id;
      }
    });

    // Map enum nodes
    const existingEnumMap = new Map();
    allNodes.forEach(node => {
      if (node.type === 'enumType') {
        existingEnumMap.set(node.data.name.toLowerCase(), node);
      }
    });

    // Build edge mappings for preservation
    const allEdges = useSchemaStore.getState().schema.edges;
    const existingEdgesMap = new Map();
    const relationshipToEdgeMap = new Map();
    
    allEdges.forEach(edge => {
      // Basic ID-based mapping
      existingEdgesMap.set(`${edge.source}:${edge.sourceHandle}:${edge.target}:${edge.targetHandle}`, edge);
      
      // Relationship-based mapping (more stable across node ID changes)
      const sourceColumn = edge.data?.sourceColumn || 
                         (edge.sourceHandle?.startsWith('source-') ? edge.sourceHandle.substring(7) : null);
      const targetColumn = edge.data?.targetColumn || 
                         (edge.targetHandle?.startsWith('target-') ? edge.targetHandle.substring(7) : null);
      
      const sourceNode = allNodes.find(n => n.id === edge.source);
      const targetNode = allNodes.find(n => n.id === edge.target);
      
      if (sourceNode?.data?.label && targetNode?.data?.label && sourceColumn && targetColumn) {
        const relationshipKey = `${sourceNode.data.label.toLowerCase()}:${sourceColumn.toLowerCase()}->${targetNode.data.label.toLowerCase()}:${targetColumn.toLowerCase()}`;
        relationshipToEdgeMap.set(relationshipKey, edge);
      }
    });

    // STEP 1: Parse ENUM type definitions
    let enumIndex = 0;
    const enumRegex = /CREATE\s+TYPE\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s+AS\s+ENUM\s*\(\s*((?:'[^']*'(?:\s*,\s*'[^']*')*)\s*)\)/gi;
    let enumMatch;

    while ((enumMatch = enumRegex.exec(sql)) !== null) {
      const enumName = enumMatch[1].replace(/^["'`]|["'`]$/g, '');
      const valuesString = enumMatch[2];
      
      // Extract enum values
      const values: string[] = [];
      const valueRegex = /'([^']*)'/g;
      let valueMatch;
      while ((valueMatch = valueRegex.exec(valuesString)) !== null) {
        values.push(valueMatch[1]);
      }
      
      enumTypes.push({
        name: enumName,
        values: values
      });
      
      // Create enum node with preserved position if it exists
      const nodeId = `enum-node-${Date.now()}-${enumIndex}`;
      enumNodeMap[enumName.toLowerCase()] = nodeId;
      
      const existingEnum = existingEnumMap.get(enumName.toLowerCase());
      const enumPosition = existingEnum ? existingEnum.position : { x: 100 + enumIndex * 250, y: 100 };
      
      newNodes.push({
        id: nodeId,
        type: 'enumType',
        position: enumPosition,
        data: { name: enumName, values: values }
      });
      
      enumIndex++;
    }
    
    // STEP 2: Parse table definitions
    let tableIndex = 0;
    let foundTables = false;
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\S+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
    let tableMatch;
    
    while ((tableMatch = tableRegex.exec(sql)) !== null) {
      foundTables = true;
      const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3] || tableMatch[4];
      const tableContent = tableMatch[5];
      if (!tableName || !tableContent) continue;
      
      const originalName = tableName;
      const normalizedName = normalizeTableName(tableName);
      const nodeId = `sql-node-${Date.now()}-${tableIndex}`;
      tableMap[normalizedName] = nodeId;
      tableMap[originalName] = nodeId;
      rowMap[normalizedName] = {};
      
      // Process rows in table definition
      const rows: any[] = [];
      const rowNames = new Set();
      const rowLines = tableContent.split(/,(?![^(]*\))/).map(line => line.trim()).filter(line => line.length > 0);
      
      for (const rowLine of rowLines) {
        // Handle foreign key constraints
        if (/FOREIGN\s+KEY/i.test(rowLine)) {
          const fkMatch = /FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(rowLine);
          if (fkMatch) {
            const constraint = {
              sourceColumn: fkMatch[1].trim().replace(/^["'`]|["'`]$/g, ''),
              targetTable: fkMatch[2].trim().replace(/^["'`]|["'`]$/g, ''),
              targetColumn: fkMatch[3].trim().replace(/^["'`]|["'`]$/g, '')
            };
            
            pendingForeignKeys.push({
              sourceNodeId: nodeId,
              sourceColumn: constraint.sourceColumn,
              targetTable: constraint.targetTable,
              targetColumn: constraint.targetColumn,
              relationshipId: createRelationshipId(tableName, constraint.sourceColumn, constraint.targetTable, constraint.targetColumn),
              sourceTable: tableName
            });
          }
          continue;
        }
        
        // Skip other non-column constraints
        if (/^\s*(?:PRIMARY\s+KEY|UNIQUE|CHECK|CONSTRAINT)/i.test(rowLine)) continue;
        
        // Parse column definition
        const rowRegex = /^\s*(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\s*\([^)]*\))?)(?:\s+(.*))?$/i;
        const rowMatch = rowLine.match(rowRegex);
        
        if (!rowMatch) continue;
        
        let rowName = rowMatch[1] || rowMatch[2] || rowMatch[3] || rowMatch[4];
        rowName = rowName.replace(/^["'`]|["'`]$/g, '');
        let rowType = rowMatch[5].trim();
        const constraintText = rowMatch[6] || '';
        const constraints: string[] = [];
        
        // Handle special types and constraints
        if (rowType.toUpperCase() === 'INTEGER' || rowType.toUpperCase() === 'INT') {
          rowType = rowType.toLowerCase();
        }
        if (rowType.toUpperCase() === 'SERIAL') {
          rowType = 'serial';
          constraints.push('primary');
        }
        
        // Process enum type references
        let isEnum = false;
        let enumTypeName = '';
        
        if (rowType.startsWith('enum_')) {
          isEnum = true;
          enumTypeName = rowType.substring(5);
        } else {
          const matchingEnum = enumTypes.find(et => et.name.toLowerCase() === rowType.toLowerCase());
          if (matchingEnum) {
            isEnum = true;
            enumTypeName = matchingEnum.name;
            rowType = `enum_${enumTypeName.toLowerCase()}`;
          }
        }
        
        // Extract constraints and default value
        let defaultValue = null;
        if (constraintText.toUpperCase().includes('PRIMARY KEY')) constraints.push('primary');
        if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
        if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
        
        const defaultMatch = /DEFAULT\s+(.*?)(?:\s+|$)/i.exec(constraintText);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].trim();
          if ((defaultValue.startsWith("'") && defaultValue.endsWith("'")) ||
              (defaultValue.startsWith('"') && defaultValue.endsWith('"'))) {
            defaultValue = defaultValue.substring(1, defaultValue.length - 1);
          }
        }
        
        // Check for inline foreign key references
        let foreignKey = null;
        const directRefMatch = /\bREFERENCES\s+(?:`|"|')?([^`"'(]+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/i.exec(constraintText);
        
        if (directRefMatch) {
          const targetTable = directRefMatch[1].trim().replace(/^["'`]|["'`]$/g, '');
          const targetColumn = directRefMatch[2] ? directRefMatch[2].trim().replace(/^["'`]|["'`]$/g, '') : 'id';
          
          foreignKey = { table: targetTable, row: targetColumn };
          
          pendingForeignKeys.push({
            sourceNodeId: nodeId,
            sourceColumn: rowName,
            targetTable,
            targetColumn,
            relationshipId: createRelationshipId(tableName, rowName, targetTable, targetColumn),
            sourceTable: tableName
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
        
        // Add row to table schema
        rows.push({
          title: rowName,
          type: rowType,
          constraints,
          id: rowId,
          default: defaultValue,
          foreignKey
        });
        
        // Create enum connection if applicable
        if (isEnum) {
          const enumNodeId = enumNodeMap[enumTypeName.toLowerCase()];
          if (enumNodeId) {
            newEdges.push({
              id: `enum-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              source: enumNodeId,
              target: nodeId,
              sourceHandle: `enum-source-${enumTypeName}`,
              targetHandle: `target-${rowName}`,
              type: 'smoothstep',
              animated: true,
              label: 'enum type',
              style: { stroke: '#a855f7' },
              data: { connectionType: 'enum' }
            });
          }
        }
      }
      
      // Create table node if it has rows
      if (rows.length > 0) {
        const existingNode = existingNodesMap.get(normalizedName);
        const position = existingNode 
          ? existingNode.position 
          : { x: 100 + (tableIndex % 3) * 300, y: 100 + Math.floor(tableIndex / 3) * 200 };
        
        const color = existingNode?.data?.color;
        
        newNodes.push({
          id: nodeId,
          type: 'databaseSchema',
          position,
          data: { 
            label: originalName,
            schema: rows,
            ...(color && { color })
          }
        });
        
        tableIndex++;
      }
    }
    
    // STEP 3: Parse ALTER TABLE constraints
    const alterTableRegex = /ALTER\s+TABLE\s+(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\S+))\s+ADD\s+(?:CONSTRAINT\s+(?:`|"|')?([^`"'\s]+)(?:`|"|')?\s+)?FOREIGN\s+KEY\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)\s+REFERENCES\s+(?:`|"|')?([^`"']+)(?:`|"|')?\s*\(\s*(?:`|"|')?([^`"',\)]+)(?:`|"|')?\s*\)/gi;
    let alterMatch;

    while ((alterMatch = alterTableRegex.exec(sql)) !== null) {
      const sourceTable = alterMatch[1] || alterMatch[2] || alterMatch[3] || alterMatch[4];
      if (!sourceTable) continue;
      
      const constraintName = alterMatch[5]?.replace(/^["'`]|["'`]$/g, '');
      const sourceColumn = alterMatch[6]?.replace(/^["'`]|["'`]$/g, '');
      const targetTable = alterMatch[7]?.replace(/^["'`]|["'`]$/g, '');
      const targetColumn = alterMatch[8]?.replace(/^["'`]|["'`]$/g, '');
      
      if (!sourceColumn || !targetTable || !targetColumn) continue;
      
      // Create relationship ID and check for duplicates
      const relationshipId = createRelationshipId(sourceTable, sourceColumn, targetTable, targetColumn);
      
      // Skip if constraint name or relationship already processed
      if (constraintName && processedConstraints.has(constraintName.toLowerCase())) continue;
      if (processedRelationships.has(relationshipId)) continue;
      
      processedRelationships.add(relationshipId);
      if (constraintName) processedConstraints.add(constraintName.toLowerCase());
      
      // Add to pending foreign keys
      const sourceNodeId = findTableInMap(tableMap, sourceTable);
      if (sourceNodeId) {
        pendingForeignKeys.push({
          sourceNodeId,
          sourceColumn,
          targetTable,
          targetColumn,
          relationshipId,
          sourceTable,
          constraintName
        });
      }
    }
    
    // STEP 4: Process all pending foreign keys to create edges
    const processedEdgeMap = new Map();
    
    // Deduplicate foreign keys
    const uniqueForeignKeys = new Map<string, typeof pendingForeignKeys[0]>();
    pendingForeignKeys.forEach(fk => uniqueForeignKeys.set(fk.relationshipId, fk));
    
    // Create edges
    for (const fk of uniqueForeignKeys.values()) {
      const targetNodeId = findTableInMap(tableMap, fk.targetTable);
      if (!targetNodeId || !fk.sourceColumn || !fk.targetColumn) continue;
      
      // Create relationship key for lookup
      const relationshipKey = `${fk.sourceTable.toLowerCase()}:${fk.sourceColumn.toLowerCase()}->${fk.targetTable.toLowerCase()}:${fk.targetColumn.toLowerCase()}`;
      
      // Skip duplicates
      if (processedEdgeMap.has(relationshipKey)) continue;

      try {
        // Check if relationship already exists
        const existingEdge = relationshipToEdgeMap.get(relationshipKey);
        
        let edge;
        if (existingEdge) {
          // Preserve existing edge properties
          edge = createEdgeFromExisting(existingEdge, fk.sourceNodeId, targetNodeId, fk.sourceColumn, fk.targetColumn);
        } else {
          // Check for edge with matching node IDs as fallback
          const sourceHandle = `source-${fk.sourceColumn}`;
          const targetHandle = `target-${fk.targetColumn}`;
          
          // Try various key combinations
          const possibleKeys = [
            `${fk.sourceNodeId}:${sourceHandle}:${targetNodeId}:${targetHandle}`,
          ];
          
          // Check old node IDs too
          const oldSourceNodeId = tableNameToNodeIdMap[fk.sourceTable.toLowerCase()];
          const oldTargetNodeId = tableNameToNodeIdMap[fk.targetTable.toLowerCase()];
          
          if (oldSourceNodeId && oldTargetNodeId) {
            possibleKeys.push(`${oldSourceNodeId}:${sourceHandle}:${oldTargetNodeId}:${targetHandle}`);
          }
          
          // Check for existing edge with any of these keys
          let foundEdge = null;
          for (const key of possibleKeys) {
            if (existingEdgesMap.has(key)) {
              foundEdge = existingEdgesMap.get(key);
              break;
            }
          }
          
          edge = foundEdge 
            ? createEdgeFromExisting(foundEdge, fk.sourceNodeId, targetNodeId, fk.sourceColumn, fk.targetColumn)
            : createEdge(fk.sourceNodeId, targetNodeId, fk.sourceColumn, fk.targetColumn);
        }
        
        processedEdgeMap.set(relationshipKey, edge);
        newEdges.push(edge);
      } catch (err) {
        console.error(`Error creating edge:`, err);
      }
    }

    // Basic validation
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

// Helper to find a table in the tableMap
function findTableInMap(tableMap: Record<string, string>, tableName: string): string | undefined {
  // Try exact match
  if (tableMap[tableName]) return tableMap[tableName];
  
  // Try normalized name
  const normalizedName = normalizeTableName(tableName);
  if (tableMap[normalizedName]) return tableMap[normalizedName];
  
  // Try with underscores instead of spaces
  const underscoreName = normalizedName.replace(/\s+/g, '_');
  if (tableMap[underscoreName]) return tableMap[underscoreName];
  
  // Check all keys with case-insensitive comparison
  for (const key in tableMap) {
    if (normalizeTableName(key) === normalizedName) return tableMap[key];
  }
  
  return undefined;
}

// Create edge from existing edge, preserving properties
function createEdgeFromExisting(
  existingEdge: any,
  sourceNodeId: string,
  targetNodeId: string,
  sourceColumn: string,
  targetColumn: string
): any {
  // Deep copy to avoid reference issues
  const newEdge = JSON.parse(JSON.stringify(existingEdge));
  
  // Update only connection points
  newEdge.id = `edge-${sourceNodeId}-${sourceColumn}-${targetNodeId}-${targetColumn}`;
  newEdge.source = sourceNodeId;
  newEdge.target = targetNodeId;
  newEdge.sourceHandle = `source-${sourceColumn}`;
  newEdge.targetHandle = `target-${targetColumn}`;
  
  // Ensure data contains column information
  if (!newEdge.data) newEdge.data = {};
  newEdge.data.sourceColumn = sourceColumn;
  newEdge.data.targetColumn = targetColumn;
  
  return newEdge;
}

// Create new edge with default properties
function createEdge(sourceNodeId: string, targetNodeId: string, sourceColumn: string, targetColumn: string) {
  const sourceHandle = sourceColumn ? `source-${sourceColumn}` : null; 
  const targetHandle = targetColumn ? `target-${targetColumn}` : null;
  const stableId = `edge-${sourceNodeId}-${sourceColumn}-${targetNodeId}-${targetColumn}`;
  
  return {
    id: stableId,
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle,
    targetHandle,
    type: 'smoothstep', 
    animated: false,
    label: `${sourceColumn} → ${targetColumn}`,
    data: { 
      relationshipType: 'oneToMany',
      sourceColumn,
      targetColumn,
      displayType: 'smoothstep'
    }
  };
}
