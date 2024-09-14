import sqlite from 'sqlite-electron';

// Define your table structure in one place
export const tableStructure = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  timestamp: 'INTEGER',
  company: 'TEXT',
  name: 'TEXT',
  runID: 'TEXT',
  folderPath: 'TEXT',
  content: 'TEXT',
  embeddings: 'TEXT', // Changed from ARRAY to TEXT as we'll store JSON string
};

export async function ensureTableStructure(db: any): Promise<void> {
  const tableExists = await db.fetchOne(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='db'",
  );

  if (!tableExists) {
    // Table doesn't exist, create it
    const columns = Object.entries(tableStructure)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');

    await db.executeQuery(`CREATE TABLE db (${columns})`);
  } else {
    // Table exists, check for differences
    const currentColumns = await getCurrentColumns(db);
    const columnsToAdd = Object.keys(tableStructure).filter(
      (col) => !currentColumns.includes(col),
    );
    const columnsToRemove = currentColumns.filter(
      (col) => !(col in tableStructure) && col !== 'id',
    );

    // Add new columns
    for (const column of columnsToAdd) {
      await addColumn(db, column, tableStructure[column]);
    }

    // Remove obsolete columns
    for (const column of columnsToRemove) {
      await removeColumn(db, column);
    }
  }
}

async function getCurrentColumns(db: any): Promise<string[]> {
  const rows = await db.fetchAll('PRAGMA table_info(db)');
  return rows.map((row) => row.name);
}

async function addColumn(
  db: any,
  columnName: string,
  columnType: string,
): Promise<void> {
  await db.executeQuery(
    `ALTER TABLE db ADD COLUMN ${columnName} ${columnType}`,
  );
}

async function removeColumn(db: any, columnName: string): Promise<void> {
  // SQLite doesn't support dropping columns directly, so we need to recreate the table
  const newColumns = Object.keys(tableStructure)
    .filter((col) => col !== columnName)
    .join(', ');

  await db.executeScript(`
    BEGIN TRANSACTION;
    
    CREATE TABLE db_new (
      ${Object.entries(tableStructure)
        .map(([name, type]) => `${name} ${type}`)
        .join(', ')}
    );

    INSERT INTO db_new SELECT ${newColumns} FROM db;
    DROP TABLE db;
    ALTER TABLE db_new RENAME TO db;

    COMMIT;
  `);
}

export async function addDocuments(documents: object) {
  try {
    const response = await window.electron.ipcRenderer.invoke(
      'add-document-to-vector-db',
      documents,
    );
    console.log('response: ', response);
    return response;
  } catch (error) {
    console.error('Error adding document to vector DB:', error);
    throw error;
  }
}
