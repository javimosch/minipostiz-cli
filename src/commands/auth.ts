import { getAuth, setAuth, removeAuth, listAuth } from "../db.ts";
import { PLATFORMS, PLATFORM_NAMES } from "../platforms/index.ts";
import { out, err } from "../output.ts";

export async function handleAuth(flags: Record<string, string>) {
  const sub = flags._sub;

  if (sub === "list") {
    const auths = listAuth();
    return out({ platforms: auths.map(a => ({ platform: a.platform, configured_at: a.updated_at })) });
  }

  if (sub === "remove") {
    if (!flags.platform) return err("--platform required", 1);
    removeAuth(flags.platform);
    return out({ removed: true, platform: flags.platform });
  }

  if (sub === "verify") {
    const platform = flags.platform;
    if (!platform) return err("--platform required", 1);
    const p = PLATFORMS[platform];
    if (!p) return err(`Unknown platform: ${platform}. Available: ${PLATFORM_NAMES.join(", ")}`, 1);
    const creds = getAuth(platform);
    if (!creds) return err(`No credentials stored for ${platform}`, 1);
    if (!p.validate) return out({ valid: true, note: "No validation available for this platform" });
    const valid = await p.validate(creds);
    return out({ valid, platform });
  }

  // Default: set auth
  const platform = flags.platform;
  if (!platform) return err("--platform required", 1);

  const p = PLATFORMS[platform];
  if (!p) return err(`Unknown platform: ${platform}. Available: ${PLATFORM_NAMES.join(", ")}`, 1);

  // Collect all non-reserved flags as credentials, skip unreplaced shell template placeholders
  const reserved = new Set(["platform", "_sub", "_cmd", "json", "human", "compact"]);
  const creds: Record<string, string> = {};
  for (const [k, v] of Object.entries(flags)) {
    if (!reserved.has(k) && !/^\{\{.+\}\}$/.test(v)) creds[k] = v;
  }

  // Validate required fields
  const missing = p.requiredAuth.filter(f => !creds[f]);
  if (missing.length > 0) {
    return err(
      `Missing required auth fields for ${p.name}: ${missing.join(", ")}\n` +
      `Required: ${p.requiredAuth.map(f => "--" + f).join(" ")}\n` +
      (p.optionalAuth ? `Optional: ${p.optionalAuth.map(f => "--" + f).join(" ")}` : ""),
      1
    );
  }

  setAuth(platform, creds);
  return out({ success: true, platform, stored: Object.keys(creds) });
}
