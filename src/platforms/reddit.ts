import type { Platform, PostPayload, PostResult } from "./index.ts";

const UA = (username: string) => `linux:minipostiz-cli:v0.1.0 (by /u/${username})`;

async function getRedditToken(creds: Record<string, string>): Promise<string> {
  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "password", username: creds.username, password: creds.password });

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA(creds.username),
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Reddit auth failed (${res.status}): ${await res.text()}`);
  const json: any = await res.json();
  if (json.error) throw new Error(`Reddit auth error: ${json.error}`);
  return json.access_token;
}

export const redditPlatform: Platform = {
  name: "Reddit",
  requiredAuth: ["clientId", "clientSecret", "username", "password", "subreddit"],
  optionalAuth: ["title"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const token = await getRedditToken(creds);
    const subreddit = creds.subreddit.replace(/^r\//, "");

    // Derive title and body: first line = title, rest = body
    // If single line, use it as title only (Reddit requires separate title + body)
    const lines = payload.message.split("\n").map(l => l.trim()).filter(Boolean);
    const title = creds.title || lines[0].replace(/^#+\s*/, "").trim() || "Post";
    const text = lines.length > 1 ? lines.slice(1).join("\n\n").trim() : "";

    const body = new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: subreddit,
      title,
      text,
      resubmit: "true",
    });

    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA(creds.username),
      },
      body: body.toString(),
    });

    const json: any = await res.json();
    if (!res.ok) return { success: false, error: `Reddit submit failed (${res.status}): ${JSON.stringify(json)}`, raw: json };

    const errors = json?.json?.errors;
    if (errors?.length > 0) {
      return { success: false, error: errors.map((e: any[]) => e[1]).join(", "), raw: json };
    }

    const data = json?.json?.data;
    return { success: true, externalId: data?.id, url: data?.url, raw: json };
  },

  async validate(creds): Promise<boolean> {
    try { await getRedditToken(creds); return true; } catch { return false; }
  },
};
