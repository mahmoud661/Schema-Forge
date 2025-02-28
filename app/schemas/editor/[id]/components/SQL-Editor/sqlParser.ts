import { mapToBaseType } from "./sqlGenerators";

export const parseSqlToSchema = (sql: string): { nodes: any[], edges: any[] } | null => {
  try {
    const newNodes: any[] = [];
    const newEdges: any[] = [];
    const tableMap: Record<string, string> = {};
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s*\(\s*([\s\S]*?)(?:\s*\)\s*;)/gi;
    let tableMatch;
    let tableIndex = 0;
    let foundTables = false;
    while ((tableMatch = tableRegex.exec(sql)) !== null) {
      foundTables = true;
      const tableName = tableMatch[1] || tableMatch[2] || tableMatch[3] || tableMatch[4];
      const tableContent = tableMatch[5];
      if (!tableName || !tableContent) continue;
      const normalizedName = tableName.toLowerCase();
      const nodeId = `sql-node-${Date.now()}-${tableIndex}`;
      tableMap[normalizedName] = nodeId;
      const columns: any[] = [];
      const columnLines = tableContent.split(/,(?![^(]*\))/)
        .map(line => line.trim()).filter(line => line.length > 0);
      const columnNames = new Set();
      const foreignKeys: any[] = [];
      for (const columnLine of columnLines) {
        // For table-level primary key constraints (standalone lines)
        if (columnLine.trim().toUpperCase().startsWith('PRIMARY KEY')) {
          const pkMatch = /PRIMARY\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(columnLine);
          if (pkMatch) {
            const pkColumnName = pkMatch[1].trim();
            const existingColumn = columns.find(col => col.title.toLowerCase() === pkColumnName.toLowerCase());
            if (existingColumn) {
              if (!existingColumn.constraints) existingColumn.constraints = [];
              if (!existingColumn.constraints.includes('primary')) {
                existingColumn.constraints.push('primary');
              }
            }
          }
          continue; // Skip the table-level constraint line
        }
        // Inline column definitions will fall through (even if they include 'PRIMARY KEY')
        if (columnLine.toUpperCase().includes('FOREIGN KEY')) {
          const fkMatch = /FOREIGN\s+KEY\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)\s+REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(columnLine);
          if (fkMatch) {
            foreignKeys.push({
              sourceColumn: fkMatch[1].trim(),
              targetTable: fkMatch[2].trim(),
              targetColumn: fkMatch[3].trim()
            });
            continue;
          }
        }
        if (columnLine.toUpperCase().startsWith('CONSTRAINT')) continue;
        const columnRegex = /^(?:`([^`]+)`|"([^"]+)"|'([^']+)'|(\w+))\s+([A-Za-z0-9_]+(?:\([^)]*\))?)(?:\s+(.*))?$/i;
        const columnMatch = columnLine.match(columnRegex);
        if (columnMatch) {
          let columnName = columnMatch[1] || columnMatch[2] || columnMatch[3] || columnMatch[4];
          // Strip leading/trailing quotes if present
          columnName = columnName.replace(/^["'`]/, '').replace(/["'`]$/, '');
          let columnType = columnMatch[5];
          const constraintText = columnMatch[6] || '';
          const constraints: string[] = [];
          if (columnType.toUpperCase() === 'SERIAL') {
            columnType = 'int4';
            constraints.push('primary');
          }
          // Inline primary key check without skipping the column
          if (constraintText.toUpperCase().includes('PRIMARY KEY')) {
            constraints.push('primary');
          }
          if (constraintText.toUpperCase().includes('NOT NULL')) constraints.push('notnull');
          if (constraintText.toUpperCase().includes('UNIQUE')) constraints.push('unique');
          const inlineFkMatch = /REFERENCES\s+(?:`|"|')?([^`"'\s(]+)(?:`|"|')?\s*\((?:`|"|')?([^`"',\)]+)(?:`|"|')?\)/i.exec(constraintText);
          if (inlineFkMatch) {
            foreignKeys.push({
              sourceColumn: columnName,
              targetTable: inlineFkMatch[1].trim(),
              targetColumn: inlineFkMatch[2].trim()
            });
          }
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
          columns.push({
            title: columnName,
            type: mapToBaseType(columnType),
            constraints,
            id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
        for (const fk of foreignKeys) {
          const targetNodeId = tableMap[fk.targetTable.toLowerCase()];
          if (targetNodeId) {
            const sourceCol = columnNames.has(fk.sourceColumn) ? fk.sourceColumn : fk.sourceColumn;
            const targetCol = fk.targetColumn || "id";
            newEdges.push({
              id: `sql-edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              source: nodeId,
              target: targetNodeId,
              sourceHandle: `source-${sourceCol}`,
              targetHandle: `target-${targetCol}`,
              type: 'smoothstep',
              animated: true,
              label: 'references',
              data: { relationshipType: 'oneToMany' }
            });
          }
        }
        tableIndex++;
      }
    }
    if (!foundTables && sql.toUpperCase().includes('CREATE TABLE')) {
      throw new Error("SQL syntax appears to be invalid. Check for proper table definitions.");
    } else if (newNodes.length === 0) {
      throw new Error("No valid tables found in the SQL. Please check your syntax.");
    }
    // ...existing ALTER TABLE and ON DELETE processing...
    return { nodes: newNodes, edges: newEdges };
  } catch (error: any) {
    console.error('Error parsing SQL:', error);
    throw new Error(`Failed to parse SQL: ${error.message}`);
  }
};
