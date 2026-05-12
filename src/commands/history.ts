import { listPosts, getPost } from "../db.ts";
import { out, err } from "../output.ts";

export async function handleHistory(flags: Record<string, string>) {
  const sub = flags._sub;

  if (sub === "get") {
    const id = Number(flags.id);
    if (!id) return err("--id required", 1);
    const post = getPost(id);
    if (!post) return err(`Post ${id} not found`, 1);
    return out(post);
  }

  const posts = listPosts({
    platform: flags.platform,
    limit: Number(flags.limit) || 20,
    status: flags.status,
  });

  return out({
    posts,
    count: posts.length,
    filter: { platform: flags.platform || "all", status: flags.status || "all" },
  });
}
