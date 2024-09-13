import { Database } from 'sqlite3';

// Define your table structure in one place
export const tableStructure = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  timestamp: 'INTEGER',
  company: 'TEXT',
  name: 'TEXT',
  runID: 'TEXT',
  folderPath: 'TEXT',
  content: 'TEXT',
  embeddings: 'ARRAY',
};

export async function ensureTableStructure(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='db'",
      [],
      async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          // Table doesn't exist, create it
          const columns = Object.entries(tableStructure)
            .map(([name, type]) => `${name} ${type}`)
            .join(', ');

          db.run(`CREATE TABLE db (${columns})`, (err) => {
            if (err) reject(err);
            else resolve();
          });
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

          resolve();
        }
      },
    );
  });
}

async function getCurrentColumns(db: Database): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all('PRAGMA table_info(db)', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((row) => row.name));
    });
  });
}

async function addColumn(
  db: Database,
  columnName: string,
  columnType: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `ALTER TABLE db ADD COLUMN ${columnName} ${columnType}`,
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
}

async function removeColumn(db: Database, columnName: string): Promise<void> {
  // SQLite doesn't support dropping columns directly, so we need to recreate the table
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const newColumns = Object.keys(tableStructure)
        .filter((col) => col !== columnName)
        .join(', ');

      db.run(`
        CREATE TABLE db_new (
          ${Object.entries(tableStructure)
            .map(([name, type]) => `${name} ${type}`)
            .join(', ')}
        )
      `);

      db.run(`INSERT INTO db_new SELECT ${newColumns} FROM db`);
      db.run('DROP TABLE db');
      db.run('ALTER TABLE db_new RENAME TO db');

      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
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