import type { Platform, PostPayload, PostResult } from "./index.ts";
import { createHmac } from "crypto";
import { readFileSync } from "fs";

function oauthSign(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  creds: Record<string, string>,
  includeBodyInSig = true
): string {
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const sigParams = includeBodyInSig
    ? { ...bodyParams, ...oauthParams }
    : { ...oauthParams };

  const paramString = Object.keys(sigParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(sigParams[k])}`)
    .join("&");

  const baseString = [method.toUpperCase(), encodeURIComponent(url), encodeURIComponent(paramString)].join("&");
  const signingKey = `${encodeURIComponent(creds.apiSecret)}&${encodeURIComponent(creds.accessSecret)}`;

  oauthParams.oauth_signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  return "OAuth " + Object.entries(oauthParams)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(", ");
}

export const xPlatform: Platform = {
  name: "X (Twitter)",
  requiredAuth: ["apiKey", "apiSecret", "accessToken", "accessSecret"],
  optionalAuth: ["handle"],

  async post(creds, payload: PostPayload): Promise<PostResult> {
    const url = "https://api.twitter.com/2/tweets";
    const body: any = { text: payload.message };

    if (payload.mediaPath) {
      const mediaResult = await uploadMedia(creds, payload.mediaPath);
      if (!mediaResult.success) return mediaResult;
      body.media = { media_ids: [mediaResult.externalId!] };
    }

    // v2 JSON body — body params NOT included in OAuth sig
    const authHeader = oauthSign("POST", url, {}, creds, false);
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json: any = await res.json();
    if (!res.ok) {
      const msg = json.detail || json.title || json.errors?.[0]?.message || JSON.stringify(json);
      // Surface tier restriction clearly
      if (res.status === 403) {
        return { success: false, error: `X API 403: ${msg} — ensure app has Read+Write permissions and account has Basic tier access ($100/mo required for posting)`, raw: json };
      }
      return { success: false, error: msg, raw: json };
    }

    const tweetId = json.data?.id;
    const handle = creds.handle || "";
    return {
      success: true,
      externalId: tweetId,
      url: handle ? `https://x.com/${handle}/status/${tweetId}` : `https://x.com/i/web/status/${tweetId}`,
      raw: json,
    };
  },

  async validate(creds): Promise<boolean> {
    const url = "https://api.twitter.com/2/users/me";
    const authHeader = oauthSign("GET", url, {}, creds, false);
    const res = await fetch(url, { headers: { Authorization: authHeader } });
    return res.ok;
  },
};

async function uploadMedia(creds: Record<string, string>, mediaPath: string): Promise<PostResult> {
  const uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const mediaData = readFileSync(mediaPath);
  const base64 = mediaData.toString("base64");

  // form body with base64 — do NOT include large base64 value in OAuth sig params
  const authHeader = oauthSign("POST", uploadUrl, {}, creds, false);
  const body = new URLSearchParams({ media_data: base64 });

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const json: any = await res.json();
  if (!res.ok) return { success: false, error: `Media upload failed: ${JSON.stringify(json)}` };
  return { success: true, externalId: json.media_id_string };
}
