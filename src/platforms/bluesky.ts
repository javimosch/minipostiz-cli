import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";
import { extname } from "path";

const BSKY_API = "https://bsky.social";

async function createSession(creds: Record<string, string>) {
  const host = creds.host || BSKY_API;
  const res = await fetch(`${host}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: creds.handle, password: creds.password }),
  });
  if (!res.ok) throw new Error(`Bluesky auth failed: ${await res.text()}`);
  return res.json() as Promise<{ accessJwt: string; did: string }>;
}

async function uploadBlob(host: string, jwt: string, mediaPath: string): Promise<string> {
  const ext = extname(mediaPath).toLowerCase().slice(1);
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
  const mime = mimeMap[ext] || "image/jpeg";
  const data = readFileSync(mediaPath);

  const res = await fetch(`${host}/xrpc/com.atproto.repo.uploadBlob`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": mime },
    body: data,
  });
  if (!res.ok) throw new Error(`Bluesky blob upload failed: ${await res.text()}`);
  const json: any = await res.json();
  return json.blob;
}

export const blueskyPlatform: Platform = {
  name: "Bluesky",
  requiredAuth: ["handle", "password"],
  optionalAuth: ["host"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const host = creds.host || BSKY_API;
    const session = await createSession(creds);

    const record: any = {
      $type: "app.bsky.feed.post",
      text: payload.message,
      createdAt: new Date().toISOString(),
    };

    if (payload.mediaPath) {
      const blob = await uploadBlob(host, session.accessJwt, payload.mediaPath);
      record.embed = {
        $type: "app.bsky.embed.images",
        images: [{ image: blob, alt: "" }],
      };
    }

    const res = await fetch(`${host}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessJwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        repo: session.did,
        collection: "app.bsky.feed.post",
        record,
      }),
    });

    const json: any = await res.json();
    if (!res.ok) return { success: false, error: json.message || JSON.stringify(json), raw: json };

    const rkey = json.uri?.split("/").pop();
    const handle = creds.handle.replace("@", "");
    return {
      success: true,
      externalId: json.uri,
      url: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined,
      raw: json,
    };
  },

  async validate(creds): Promise<boolean> {
    try { await createSession(creds); return true; } catch { return false; }
  },
};
