import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

export const facebookPlatform: Platform = {
  name: "Facebook",
  requiredAuth: ["pageAccessToken", "pageId"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const base = `https://graph.facebook.com/v19.0/${creds.pageId}`;

    if (payload.mediaPath) {
      const data = readFileSync(payload.mediaPath);
      const form = new FormData();
      form.append("source", new Blob([data]), payload.mediaPath.split("/").pop());
      form.append("message", payload.message);
      form.append("access_token", creds.pageAccessToken);

      const res = await fetch(`${base}/photos`, { method: "POST", body: form });
      const json: any = await res.json();
      if (json.error) return { success: false, error: json.error.message, raw: json };

      return { success: true, externalId: json.post_id || json.id, raw: json };
    }

    const res = await fetch(`${base}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: payload.message, access_token: creds.pageAccessToken }),
    });

    const json: any = await res.json();
    if (json.error) return { success: false, error: json.error.message, raw: json };

    return {
      success: true,
      externalId: json.id,
      url: json.id ? `https://www.facebook.com/${json.id}` : undefined,
      raw: json,
    };
  },

  async validate(creds): Promise<boolean> {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${creds.pageId}?access_token=${creds.pageAccessToken}&fields=id,name`
    );
    return res.ok;
  },
};
