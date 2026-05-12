import type { Platform, PostPayload, PostResult } from "./index.ts";

async function getRedditToken(creds: Record<string, string>): Promise<string> {
  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "password",
    username: creds.username,
    password: creds.password,
  });

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "minipostiz-cli/0.1.0",
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Reddit auth failed: ${await res.text()}`);
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
    const lines = payload.message.split("\n");
    const title = creds.title || lines[0].replace(/^#+\s*/, "").trim() || "Post";
    const text = lines.slice(1).join("\n").trim() || payload.message;
    const subreddit = creds.subreddit.replace(/^r\//, "");

    const body = new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: subreddit,
      title,
      text,
    });

    const res = await fetch("https://oauth.reddit.com/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "minipostiz-cli/0.1.0",
      },
      body: body.toString(),
    });

    const json: any = await res.json();
    const data = json?.json?.data;
    if (json?.json?.errors?.length > 0) {
      return { success: false, error: json.json.errors.map((e: any[]) => e[1]).join(", "), raw: json };
    }

    return {
      success: true,
      externalId: data?.id,
      url: data?.url,
      raw: json,
    };
  },

  async validate(creds): Promise<boolean> {
    try { await getRedditToken(creds); return true; } catch { return false; }
  },
};
