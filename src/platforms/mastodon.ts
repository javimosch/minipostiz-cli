import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

export const mastodonPlatform: Platform = {
  name: "Mastodon",
  requiredAuth: ["instanceUrl", "accessToken"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const base = creds.instanceUrl.replace(/\/$/, "");
    const body: any = { status: payload.message, visibility: creds.visibility || "public" };

    if (payload.mediaPath) {
      const mediaId = await uploadMedia(base, creds.accessToken, payload.mediaPath);
      if (mediaId) body.media_ids = [mediaId];
    }

    const res = await fetch(`${base}/api/v1/statuses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json: any = await res.json();
    if (!res.ok) return { success: false, error: json.error || JSON.stringify(json), raw: json };

    return { success: true, externalId: json.id, url: json.url, raw: json };
  },

  async validate(creds): Promise<boolean> {
    const base = creds.instanceUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/api/v1/accounts/verify_credentials`, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });
    return res.ok;
  },
};

async function uploadMedia(base: string, token: string, mediaPath: string): Promise<string | null> {
  const data = readFileSync(mediaPath);
  const form = new FormData();
  form.append("file", new Blob([data]), mediaPath.split("/").pop());

  const res = await fetch(`${base}/api/v2/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  return json.id;
}
