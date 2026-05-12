import type { Platform, PostPayload, PostResult } from "./index.ts";

export const devioPlatform: Platform = {
  name: "Dev.to",
  requiredAuth: ["apiKey"],
  optionalAuth: ["tags", "series"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const lines = payload.message.split("\n");
    const title = lines[0].replace(/^#+\s*/, "").trim() || "Post";
    const body = lines.slice(1).join("\n").trim() || payload.message;

    const article: any = {
      title,
      body_markdown: body,
      published: true,
    };

    if (creds.tags) article.tags = creds.tags.split(",").map((t: string) => t.trim()).slice(0, 4);
    if (creds.series) article.series = creds.series;

    const res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": creds.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ article }),
    });

    const json: any = await res.json();
    if (!res.ok) return { success: false, error: json.error || JSON.stringify(json), raw: json };

    return { success: true, externalId: String(json.id), url: json.url, raw: json };
  },

  async validate(creds): Promise<boolean> {
    const res = await fetch("https://dev.to/api/users/me", { headers: { "api-key": creds.apiKey } });
    return res.ok;
  },
};
