#!/usr/bin/env bun
/**
 * minipostiz daemon - checks every minute for scheduled posts due to be published
 */
import { getPendingScheduled, updatePost, getAuth } from "./db.ts";
import { PLATFORMS } from "./platforms/index.ts";
import { join } from "path";
import { homedir } from "os";
import { writeFileSync, readFileSync, existsSync } from "fs";

const DATA_DIR = join(homedir(), ".minipostiz");
const PID_FILE = join(DATA_DIR, "daemon.pid");
const LOG_FILE = join(DATA_DIR, "daemon.log");
const CHECK_INTERVAL_MS = 60_000; // 1 minute

function log(msg: string) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try { writeFileSync(LOG_FILE, line, { flag: "a" }); } catch {}
}

async function processPending() {
  const pending = getPendingScheduled();
  if (pending.length === 0) return;

  log(`Processing ${pending.length} scheduled post(s)`);

  for (const post of pending) {
    const p = PLATFORMS[post.platform];
    if (!p) {
      updatePost(post.id, { status: "failed", error: "Unknown platform" });
      log(`[${post.id}] FAIL: unknown platform ${post.platform}`);
      continue;
    }

    const creds = getAuth(post.platform);
    if (!creds) {
      updatePost(post.id, { status: "failed", error: "No credentials stored" });
      log(`[${post.id}] FAIL: no credentials for ${post.platform}`);
      continue;
    }

    try {
      updatePost(post.id, { status: "publishing" });
      const result = await p.post(creds, { message: post.message, mediaPath: post.media_path });

      updatePost(post.id, {
        status: result.success ? "published" : "failed",
        published_at: result.success ? new Date().toISOString() : undefined,
        external_id: result.externalId,
        error: result.success ? undefined : result.error,
      });

      log(`[${post.id}] ${result.success ? "OK" : "FAIL"}: ${post.platform} - ${result.url || result.error || ""}`);
    } catch (e: any) {
      updatePost(post.id, { status: "failed", error: e.message });
      log(`[${post.id}] ERROR: ${post.platform} - ${e.message}`);
    }
  }
}

async function main() {
  writeFileSync(PID_FILE, process.pid.toString());
  log(`minipostiz daemon started (PID ${process.pid})`);

  process.on("SIGTERM", () => { log("Daemon stopping (SIGTERM)"); process.exit(0); });
  process.on("SIGINT", () => { log("Daemon stopping (SIGINT)"); process.exit(0); });

  // Run immediately on start, then on interval
  await processPending();

  setInterval(processPending, CHECK_INTERVAL_MS);

  log(`Checking every ${CHECK_INTERVAL_MS / 1000}s for scheduled posts`);
}

main().catch(e => { log(`FATAL: ${e.message}`); process.exit(1); });
