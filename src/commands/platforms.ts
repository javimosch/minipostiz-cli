import { PLATFORMS, PLATFORM_NAMES } from "../platforms/index.ts";
import { listAuth } from "../db.ts";
import { out } from "../output.ts";

export async function handlePlatforms(flags: Record<string, string>) {
  const configured = new Set(listAuth().map(a => a.platform));

  const list = PLATFORM_NAMES.map(name => {
    const p = PLATFORMS[name];
    return {
      name,
      label: p.name,
      configured: configured.has(name),
      requiredAuth: p.requiredAuth,
      optionalAuth: p.optionalAuth || [],
    };
  });

  return out({ platforms: list, total: list.length, configured: list.filter(p => p.configured).length });
}
