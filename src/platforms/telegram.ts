import type { Platform, PostPayload, PostResult } from "./index.ts";
import { readFileSync } from "fs";

export const telegramPlatform: Platform = {
  name: "Telegram",
  requiredAuth: ["botToken", "chatId"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const base = `https://api.telegram.org/bot${creds.botToken}`;

    if (payload.mediaPath) {
      const data = readFileSync(payload.mediaPath);
      const form = new FormData();
      form.append("chat_id", creds.chatId);
      form.append("caption", payload.message);
      form.append("photo", new Blob([data]), payload.mediaPath.split("/").pop());

      const res = await fetch(`${base}/sendPhoto`, { method: "POST", body: form });
      const json: any = await res.json();
      if (!json.ok) return { success: false, error: json.description || JSON.stringify(json), raw: json };
      return { success: true, externalId: String(json.result?.message_id), raw: json };
    }

    const res = await fetch(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: creds.chatId, text: payload.message, parse_mode: "HTML" }),
    });

    const json: any = await res.json();
    if (!json.ok) return { success: false, error: json.description || JSON.stringify(json), raw: json };

    return { success: true, externalId: String(json.result?.message_id), raw: json };
  },

  async validate(creds): Promise<boolean> {
    const res = await fetch(`https://api.telegram.org/bot${creds.botToken}/getMe`);
    const json: any = await res.json();
    return json.ok === true;
  },
};
