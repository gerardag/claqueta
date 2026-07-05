import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dataDir = process.env.DATA_DIR ?? "./data";
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "claqueta.db");
const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

const migrationsPath = path.join(process.cwd(), "drizzle");
if (fs.existsSync(migrationsPath)) {
  migrate(db, { migrationsFolder: migrationsPath });
}
