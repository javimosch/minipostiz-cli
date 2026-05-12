import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

export const discordPlatform: Platform = {
  name: "Discord",
  requiredAuth: ["webhookUrl"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    if (payload.mediaPath) {
      const data = readFileSync(payload.mediaPath);
      const form = new FormData();
      form.append("content", payload.message);
      form.append("file", new Blob([data]), payload.mediaPath.split("/").pop());

      const res = await fetch(creds.webhookUrl, { method: "POST", body: form });
      if (!res.ok) return { success: false, error: `Discord webhook failed: ${res.status} ${await res.text()}` };
      return { success: true };
    }

    const res = await fetch(creds.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload.message }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Discord webhook failed: ${res.status} ${text}` };
    }

    const json = res.status !== 204 ? await res.json() : {};
    return { success: true, externalId: (json as any).id, raw: json };
  },

  async validate(creds): Promise<boolean> {
    const res = await fetch(creds.webhookUrl);
    return res.ok;
  },
};
