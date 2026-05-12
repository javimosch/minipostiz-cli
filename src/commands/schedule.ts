import { getAuth, createPost, listPosts, cancelPost, getPendingScheduled, updatePost } from "../db.ts";
import { PLATFORMS, PLATFORM_NAMES } from "../platforms/index.ts";
import { out, err } from "../output.ts";

export async function handleSchedule(flags: Record<string, string>) {
  const sub = flags._sub;

  if (sub === "list") {
    const posts = listPosts({ platform: flags.platform, status: flags.status || "scheduled", limit: Number(flags.limit) || 50 });
    return out({ scheduled: posts, count: posts.length });
  }

  if (sub === "cancel") {
    const id = Number(flags.id);
    if (!id) return err("--id required", 1);
    const ok = cancelPost(id);
    return out({ cancelled: ok, id, message: ok ? "Post cancelled" : "Post not found or not in scheduled state" });
  }

  if (sub === "run") {
    // Run pending scheduled posts immediately (used by daemon)
    const pending = getPendingScheduled();
    const results: any[] = [];
    for (const post of pending) {
      const p = PLATFORMS[post.platform];
      if (!p) { updatePost(post.id, { status: "failed", error: "Unknown platform" }); continue; }
      const creds = getAuth(post.platform);
      if (!creds) { updatePost(post.id, { status: "failed", error: "No credentials" }); continue; }

      try {
        updatePost(post.id, { status: "publishing" });
        const result = await p.post(creds, { message: post.message, mediaPath: post.media_path });
        updatePost(post.id, {
          status: result.success ? "published" : "failed",
          published_at: result.success ? new Date().toISOString() : undefined,
          external_id: result.externalId,
          error: result.success ? undefined : result.error,
        });
        results.push({ id: post.id, platform: post.platform, success: result.success, url: result.url });
      } catch (e: any) {
        updatePost(post.id, { status: "failed", error: e.message });
        results.push({ id: post.id, platform: post.platform, success: false, error: e.message });
      }
    }
    return out({ processed: results.length, results });
  }

  // Default: create scheduled post
  const message = flags.message || flags.text || flags.content;
  if (!message) return err("--message required", 1);

  const platformArg = flags.platform;
  if (!platformArg) return err("--platform required", 1);

  const dateStr = flags.date || flags.at || flags.scheduledAt;
  if (!dateStr) return err("--date required (format: '2026-06-20 20:30:00' or ISO 8601)", 1);

  const scheduledAt = new Date(dateStr);
  if (isNaN(scheduledAt.getTime())) return err(`Invalid date: ${dateStr}`, 1);
  if (scheduledAt <= new Date()) return err("Scheduled date must be in the future", 1);

  const platforms = platformArg.split(",").map((s: string) => s.trim());
  const mediaPath = flags.media || flags.image;

  const created: any[] = [];
  for (const platform of platforms) {
    if (!PLATFORMS[platform]) {
      created.push({ platform, error: `Unknown platform. Available: ${PLATFORM_NAMES.join(", ")}` });
      continue;
    }
    const id = createPost({
      platform,
      message,
      media_path: mediaPath,
      scheduled_at: scheduledAt.toISOString(),
      status: "scheduled",
    });
    created.push({ id, platform, scheduled_at: scheduledAt.toISOString() });
  }

  return out({ success: true, posts: created });
}
