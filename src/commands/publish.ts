import { getAuth, createPost, updatePost } from "../db.ts";
import { PLATFORMS, PLATFORM_NAMES } from "../platforms/index.ts";
import { out, err } from "../output.ts";

export async function handlePublish(flags: Record<string, string>) {
  const message = flags.message || flags.text || flags.content;
  if (!message) return err("--message required", 1);

  const platformArg = flags.platform;
  if (!platformArg) return err("--platform required (or 'all' for all configured platforms)", 1);

  const mediaPath = flags.media || flags.image || flags.file;

  // Resolve target platforms
  let targets: string[];
  if (platformArg === "all") {
    const { listAuth } = await import("../db.ts");
    targets = listAuth().map(a => a.platform);
    if (targets.length === 0) return err("No platforms configured. Use: minipostiz auth --platform <name> ...", 1);
  } else {
    targets = platformArg.split(",").map((s: string) => s.trim());
  }

  const results: Record<string, any> = {};

  for (const platform of targets) {
    const p = PLATFORMS[platform];
    if (!p) {
      results[platform] = { success: false, error: `Unknown platform. Available: ${PLATFORM_NAMES.join(", ")}` };
      continue;
    }

    const creds = getAuth(platform);
    if (!creds) {
      results[platform] = { success: false, error: `Not authenticated. Run: minipostiz auth --platform ${platform} ...` };
      continue;
    }

    const postId = createPost({ platform, message, media_path: mediaPath, status: "publishing" });

    try {
      const result = await p.post(creds, { message, mediaPath });
      updatePost(postId, {
        status: result.success ? "published" : "failed",
        published_at: result.success ? new Date().toISOString() : undefined,
        external_id: result.externalId,
        error: result.success ? undefined : result.error,
      });
      results[platform] = {
        success: result.success,
        id: postId,
        externalId: result.externalId,
        url: result.url,
        ...(result.error ? { error: result.error } : {}),
      };
    } catch (e: any) {
      updatePost(postId, { status: "failed", error: e.message });
      results[platform] = { success: false, id: postId, error: e.message };
    }
  }

  const allOk = Object.values(results).every((r: any) => r.success);
  return out({ success: allOk, results });
}
