#!/usr/bin/env bun
import { handleAuth } from "./commands/auth.ts";
import { handlePublish } from "./commands/publish.ts";
import { handleSchedule } from "./commands/schedule.ts";
import { handleHistory } from "./commands/history.ts";
import { handlePlatforms } from "./commands/platforms.ts";
import { out, err } from "./output.ts";
import { PLATFORM_NAMES } from "./platforms/index.ts";
import { DB_PATH } from "./db.ts";

const rawArgs = process.argv.slice(2);

// Parse flags and positional args
const flags: Record<string, string> = {};
const positional: string[] = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg.startsWith("--")) {
    const key = arg.slice(2);
    const next = rawArgs[i + 1];
    if (next && !next.startsWith("--")) {
      flags[key] = next;
      i++;
    } else {
      flags[key] = "true";
    }
  } else {
    positional.push(arg);
  }
}

const [cmd, sub] = positional;
if (sub) flags._sub = sub;
flags._cmd = cmd;

async function main() {
  switch (cmd) {
    case "auth":
      return handleAuth(flags);

    case "publish":
    case "post":
      return handlePublish(flags);

    case "schedule":
      return handleSchedule(flags);

    case "history":
    case "log":
      return handleHistory(flags);

    case "platforms":
    case "platform":
      return handlePlatforms(flags);

    case "status":
      return out({
        version: "0.1.0",
        db: DB_PATH,
        platforms: PLATFORM_NAMES,
        daemon: await getDaemonStatus(),
      });

    case "daemon":
      return handleDaemon(flags, sub);

    case "help":
    case "--help":
    case "-h":
    case undefined:
      return showHelp();

    default:
      return err(`Unknown command: ${cmd}. Run 'minipostiz help' for usage.`, 1);
  }
}

async function getDaemonStatus() {
  const { join } = await import("path");
  const { homedir } = await import("os");
  const { existsSync, readFileSync } = await import("fs");

  const pidFile = join(homedir(), ".minipostiz", "daemon.pid");
  if (!existsSync(pidFile)) return { running: false };

  const pid = parseInt(readFileSync(pidFile, "utf-8").trim());
  try {
    process.kill(pid, 0);
    return { running: true, pid };
  } catch {
    return { running: false };
  }
}

async function handleDaemon(flags: Record<string, string>, action?: string) {
  const { join } = await import("path");
  const { homedir } = await import("os");
  const { existsSync, readFileSync, unlinkSync } = await import("fs");
  const { spawn } = await import("child_process");

  const dataDir = join(homedir(), ".minipostiz");
  const pidFile = join(dataDir, "daemon.pid");
  const logFile = join(dataDir, "daemon.log");
  const daemonScript = join(import.meta.dir, "daemon.ts");

  const isRunning = async () => {
    if (!existsSync(pidFile)) return false;
    const pid = parseInt(readFileSync(pidFile, "utf-8").trim());
    try { process.kill(pid, 0); return true; } catch { return false; }
  };

  switch (action || flags._sub) {
    case "start": {
      if (await isRunning()) return out({ status: "already_running", ...(await getDaemonStatus()) });
      const child = spawn(process.execPath, ["run", daemonScript], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"],
      });
      child.unref();
      await new Promise(r => setTimeout(r, 500));
      return out({ status: "started", ...(await getDaemonStatus()) });
    }

    case "stop": {
      if (!await isRunning()) return out({ status: "not_running" });
      const pid = parseInt(readFileSync(pidFile, "utf-8").trim());
      process.kill(pid, "SIGTERM");
      try { unlinkSync(pidFile); } catch {}
      return out({ status: "stopped", pid });
    }

    case "restart": {
      const wasRunning = await isRunning();
      if (wasRunning) {
        const pid = parseInt(readFileSync(pidFile, "utf-8").trim());
        process.kill(pid, "SIGTERM");
        await new Promise(r => setTimeout(r, 500));
      }
      const child = spawn(process.execPath, ["run", daemonScript], {
        detached: true,
        stdio: ["ignore", "ignore", "ignore"],
      });
      child.unref();
      await new Promise(r => setTimeout(r, 500));
      return out({ status: "restarted", ...(await getDaemonStatus()) });
    }

    case "status":
    default:
      return out(await getDaemonStatus());
  }
}

function showHelp() {
  const help = {
    tool: "minipostiz-cli",
    version: "0.1.0",
    description: "Offline social media scheduler — agent-first, SQLite-backed, zero cloud deps",
    commands: {
      auth: {
        usage: "minipostiz auth --platform <name> [credentials...]",
        subcommands: {
          list: "minipostiz auth list",
          remove: "minipostiz auth remove --platform <name>",
          verify: "minipostiz auth verify --platform <name>",
        },
        examples: {
          x: "minipostiz auth --platform x --apiKey K --apiSecret S --accessToken T --accessSecret A",
          bluesky: "minipostiz auth --platform bluesky --handle user.bsky.social --password apppassword",
          discord: "minipostiz auth --platform discord --webhookUrl https://discord.com/api/webhooks/...",
          telegram: "minipostiz auth --platform telegram --botToken 123:abc --chatId -1001234567",
          mastodon: "minipostiz auth --platform mastodon --instanceUrl https://mastodon.social --accessToken TOKEN",
          devto: "minipostiz auth --platform devto --apiKey YOUR_KEY",
          linkedin: "minipostiz auth --platform linkedin --accessToken TOKEN --personUrn urn:li:person:ID",
          reddit: "minipostiz auth --platform reddit --clientId ID --clientSecret S --username U --password P --subreddit mySub",
          facebook: "minipostiz auth --platform facebook --pageAccessToken TOKEN --pageId PAGE_ID",
        },
      },
      publish: {
        usage: "minipostiz publish --platform <name|all|p1,p2> --message <text> [--media /path]",
        examples: [
          "minipostiz publish --platform x --message 'Hello Twitter'",
          "minipostiz publish --platform bluesky,mastodon --message 'Cross-post'",
          "minipostiz publish --platform all --message 'Broadcast to all'",
        ],
      },
      schedule: {
        usage: "minipostiz schedule --platform <name> --message <text> --date '2026-06-20 20:30:00'",
        subcommands: {
          list: "minipostiz schedule list [--platform x] [--limit 20]",
          cancel: "minipostiz schedule cancel --id <id>",
        },
      },
      history: {
        usage: "minipostiz history [--platform <name>] [--limit 20] [--status published|failed|all]",
        subcommands: { get: "minipostiz history get --id <id>" },
      },
      platforms: "minipostiz platforms",
      daemon: {
        start: "minipostiz daemon start",
        stop: "minipostiz daemon stop",
        restart: "minipostiz daemon restart",
        status: "minipostiz daemon status",
      },
      status: "minipostiz status",
    },
    platforms: PLATFORM_NAMES,
  };
  out(help);
}

main().catch(e => err(e.message, 1));
