import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

const FB_VERSION = "v21.0";

export const facebookPlatform: Platform = {
  name: "Facebook",
  requiredAuth: ["pageAccessToken", "pageId"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const base = `https://graph.facebook.com/${FB_VERSION}/${creds.pageId}`;
    const headers: Record<string, string> = { Authorization: `Bearer ${creds.pageAccessToken}` };

    if (payload.mediaPath) {
      const data = readFileSync(payload.mediaPath);
      const form = new FormData();
      form.append("source", new Blob([data]), payload.mediaPath.split("/").pop());
      form.append("message", payload.message);

      const res = await fetch(`${base}/photos`, { method: "POST", headers, body: form });
      const json: any = await res.json();
      if (json.error) return { success: false, error: json.error.message, raw: json };

      const postId = json.post_id || json.id;
      return { success: true, externalId: postId, url: postId ? buildPostUrl(creds.pageId, postId) : undefined, raw: json };
    }

    const res = await fetch(`${base}/feed`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message: payload.message }),
    });

    const json: any = await res.json();
    if (json.error) return { success: false, error: `${json.error.message} (code ${json.error.code})`, raw: json };

    const postId = json.id;
    return { success: true, externalId: postId, url: postId ? buildPostUrl(creds.pageId, postId) : undefined, raw: json };
  },

  async validate(creds): Promise<boolean> {
    const res = await fetch(
      `https://graph.facebook.com/${FB_VERSION}/${creds.pageId}?fields=id,name`,
      { headers: { Authorization: `Bearer ${creds.pageAccessToken}` } }
    );
    return res.ok;
  },
};

// Facebook post IDs are "pageId_postId" — URL is /permalink/postId
function buildPostUrl(pageId: string, fullPostId: string): string {
  const parts = fullPostId.split("_");
  const postSuffix = parts.length > 1 ? parts[parts.length - 1] : fullPostId;
  return `https://www.facebook.com/${pageId}/posts/${postSuffix}`;
}
