import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

export function initDatabase(filename: string): Database.Database {
  const parentDir = dirname(filename);
  mkdirSync(parentDir, { recursive: true });
  db = new Database(filename);

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      mnt TEXT PRIMARY KEY,
      name TEXT,
      telephony TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS phonebooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mnt TEXT NOT NULL,
      number TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'phone',
      language TEXT DEFAULT 'unknown',
      hidden INTEGER DEFAULT 0,
      FOREIGN KEY(mnt) REFERENCES users(mnt) ON DELETE CASCADE
    );
  `;

  db.exec(schema);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
