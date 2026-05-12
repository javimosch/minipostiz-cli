import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const DATA_DIR = join(homedir(), ".minipostiz");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = join(DATA_DIR, "minipostiz.db");

let _db: Database | null = null;

export function getDb(): Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.exec("PRAGMA journal_mode=WAL");
  migrate(_db);
  return _db;
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth (
      platform TEXT PRIMARY KEY,
      credentials TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      message TEXT NOT NULL,
      media_path TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_at TEXT,
      published_at TEXT,
      error TEXT,
      external_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduler_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function getAuth(platform: string): Record<string, string> | null {
  const db = getDb();
  const row = db.query("SELECT credentials FROM auth WHERE platform = ?").get(platform) as { credentials: string } | null;
  if (!row) return null;
  try { return JSON.parse(row.credentials); } catch { return null; }
}

export function setAuth(platform: string, creds: Record<string, string>) {
  const db = getDb();
  db.run(
    "INSERT OR REPLACE INTO auth (platform, credentials, updated_at) VALUES (?, ?, datetime('now'))",
    [platform, JSON.stringify(creds)]
  );
}

export function removeAuth(platform: string) {
  getDb().run("DELETE FROM auth WHERE platform = ?", [platform]);
}

export function listAuth(): { platform: string; updated_at: string }[] {
  return getDb().query("SELECT platform, updated_at FROM auth ORDER BY platform").all() as any;
}

export function createPost(data: {
  platform: string;
  message: string;
  media_path?: string;
  scheduled_at?: string;
  status?: string;
}): number {
  const db = getDb();
  const result = db.run(
    "INSERT INTO posts (platform, message, media_path, scheduled_at, status) VALUES (?, ?, ?, ?, ?)",
    [data.platform, data.message, data.media_path ?? null, data.scheduled_at ?? null, data.status ?? "pending"]
  );
  return result.lastInsertRowid as number;
}

export function updatePost(id: number, data: Partial<{
  status: string;
  published_at: string;
  error: string;
  external_id: string;
}>) {
  const db = getDb();
  const fields = Object.entries(data).map(([k]) => `${k} = ?`).join(", ");
  const values = [...Object.values(data), id];
  db.run(`UPDATE posts SET ${fields} WHERE id = ?`, values);
}

export function getPendingScheduled(): any[] {
  return getDb().query(
    "SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= datetime('now') ORDER BY scheduled_at ASC"
  ).all();
}

export function listPosts(opts: { platform?: string; limit?: number; status?: string } = {}): any[] {
  const db = getDb();
  let q = "SELECT * FROM posts WHERE 1=1";
  const params: any[] = [];
  if (opts.platform) { q += " AND platform = ?"; params.push(opts.platform); }
  if (opts.status) { q += " AND status = ?"; params.push(opts.status); }
  q += " ORDER BY created_at DESC LIMIT ?";
  params.push(opts.limit ?? 50);
  return db.query(q).all(...params) as any[];
}

export function getPost(id: number): any {
  return getDb().query("SELECT * FROM posts WHERE id = ?").get(id);
}

export function cancelPost(id: number): boolean {
  const post = getPost(id);
  if (!post || post.status !== "scheduled") return false;
  getDb().run("UPDATE posts SET status = 'cancelled' WHERE id = ?", [id]);
  return true;
}
