export interface PostPayload {
  message: string;
  mediaPath?: string;
}

export interface PostResult {
  success: boolean;
  externalId?: string;
  url?: string;
  error?: string;
  raw?: any;
}

export interface Platform {
  name: string;
  requiredAuth: string[];
  optionalAuth?: string[];
  post(creds: Record<string, string>, payload: PostPayload): Promise<PostResult>;
  validate?(creds: Record<string, string>): Promise<boolean>;
}

export { xPlatform } from "./x.ts";
export { blueskyPlatform } from "./bluesky.ts";
export { mastodonPlatform } from "./mastodon.ts";
export { discordPlatform } from "./discord.ts";
export { telegramPlatform } from "./telegram.ts";
export { devioPlatform } from "./devto.ts";
export { linkedinPlatform } from "./linkedin.ts";
export { redditPlatform } from "./reddit.ts";
export { facebookPlatform } from "./facebook.ts";

import { xPlatform } from "./x.ts";
import { blueskyPlatform } from "./bluesky.ts";
import { mastodonPlatform } from "./mastodon.ts";
import { discordPlatform } from "./discord.ts";
import { telegramPlatform } from "./telegram.ts";
import { devioPlatform } from "./devto.ts";
import { linkedinPlatform } from "./linkedin.ts";
import { redditPlatform } from "./reddit.ts";
import { facebookPlatform } from "./facebook.ts";

export const PLATFORMS: Record<string, Platform> = {
  x: xPlatform,
  twitter: xPlatform,
  bluesky: blueskyPlatform,
  mastodon: mastodonPlatform,
  discord: discordPlatform,
  telegram: telegramPlatform,
  devto: devioPlatform,
  linkedin: linkedinPlatform,
  reddit: redditPlatform,
  facebook: facebookPlatform,
};

export const PLATFORM_NAMES = Object.keys(PLATFORMS).filter(k => k !== "twitter");
