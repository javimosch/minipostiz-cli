import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

export const linkedinPlatform: Platform = {
  name: "LinkedIn",
  requiredAuth: ["accessToken"],
  optionalAuth: ["personUrn"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const author = await resolveAuthor(creds);

    const body: any = {
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: payload.message },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": creds.visibility || "PUBLIC" },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `LinkedIn post failed: ${res.status} ${text}` };
    }

    const json: any = await res.json();
    const postId = json.id || res.headers.get("x-restli-id") || "";
    return {
      success: true,
      externalId: postId,
      url: postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined,
      raw: json,
    };
  },

  async validate(creds): Promise<boolean> {
    try { await resolveAuthor(creds); return true; } catch { return false; }
  },
};

async function resolveAuthor(creds: Record<string, string>): Promise<string> {
  if (creds.personUrn) {
    return creds.personUrn.startsWith("urn:") ? creds.personUrn : `urn:li:person:${creds.personUrn}`;
  }
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${creds.accessToken}` },
  });
  if (res.ok) {
    const ui: any = await res.json();
    if (ui.sub) return `urn:li:person:${ui.sub}`;
  }
  throw new Error(
    "Cannot resolve LinkedIn author. Add --personUrn: minipostiz auth --platform linkedin --accessToken TOKEN --personUrn urn:li:person:YOUR_ID"
  );
}
