---
name: minipostiz-cli-maintainer
description: Agent maintainer guide for minipostiz-cli — covers both plugin locations, sync workflow, build, test, release
type: maintainer
---

# minipostiz-cli — Agent Maintainer Guide

## Two canonical locations (always kept in sync)

| Location | Role |
|----------|------|
| `~/ai/minipostiz-cli/` | Source of truth — standalone repo, npm package |
| `~/ai/supercli/plugins/minipostiz-cli/` | Bundled copy inside supercli — discoverable without internet |

The `plugin.json` and `skills/quickstart/SKILL.md` are duplicated between both. **Always update both.**

---

## Repository remotes

```
~/ai/minipostiz-cli        → git@github.com:javimosch/minipostiz-cli.git  (branch: main)
~/ai/supercli              → git@github.com:javimosch/supercli.git         (branch: master)
```

---

## Sync workflow (after any plugin.json or SKILL.md change)

```bash
# 1. Edit source
vim ~/ai/minipostiz-cli/plugin.json

# 2. Mirror to supercli
cp ~/ai/minipostiz-cli/plugin.json \
   ~/ai/supercli/plugins/minipostiz-cli/plugin.json

cp ~/ai/minipostiz-cli/.agents/skills/maintainer/SKILL.md \
   ~/ai/supercli/plugins/minipostiz-cli/skills/quickstart/SKILL.md

# 3. Commit both repos
cd ~/ai/minipostiz-cli && git add -A && git commit -m "chore: ..." && git push
cd ~/ai/supercli && git add plugins/minipostiz-cli/ && git commit -m "chore: sync minipostiz-cli ..." && git push
```

---

## Build binary

```bash
cd ~/ai/minipostiz-cli
bun build src/main.ts --compile --outfile bin/minipostiz
# binary is gitignored — rebuild after any src/ change
```

Binary symlinked to PATH:
```bash
ln -sf ~/ai/minipostiz-cli/bin/minipostiz ~/.local/bin/minipostiz
```

---

## Reinstall plugin into local supercli after src changes

```bash
cd ~/ai/supercli
node cli/supercli.js plugins install ~/ai/minipostiz-cli --on-conflict replace --json
```

---

## Version bump checklist

1. Edit `version` in `~/ai/minipostiz-cli/package.json`
2. Edit `version` in `~/ai/minipostiz-cli/plugin.json`
3. Sync both files to `~/ai/supercli/plugins/minipostiz-cli/`
4. Rebuild binary
5. Commit + push both repos
6. `npm publish` from `~/ai/minipostiz-cli/`

---

## Adding a new platform

1. Create `~/ai/minipostiz-cli/src/platforms/<name>.ts` implementing the `Platform` interface:
   ```ts
   export const myPlatform: Platform = {
     name: "MyPlatform",
     requiredAuth: ["field1", "field2"],
     async post(creds, payload): Promise<PostResult> { ... },
     async validate(creds): Promise<boolean> { ... },
   }
   ```
2. Export from `src/platforms/index.ts` and add to `PLATFORMS` map
3. Add `auth set-<name>` command to `plugin.json` (with `"unsafe": true`)
4. Rebuild binary
5. Sync plugin.json to supercli
6. Update roadmap: `~/ai/system/minipostiz-adm/docs/roadmap.md`

---

## File map

```
~/ai/minipostiz-cli/
├── src/
│   ├── main.ts                  # CLI entry — command router
│   ├── db.ts                    # SQLite (~/.minipostiz/minipostiz.db)
│   ├── output.ts                # out() / err() — always JSON to stdout/stderr
│   ├── daemon.ts                # Background scheduler (60s tick)
│   ├── commands/
│   │   ├── auth.ts              # auth set/list/remove/verify
│   │   ├── publish.ts           # immediate post
│   │   ├── schedule.ts          # schedule create/list/cancel/run
│   │   ├── history.ts           # post log
│   │   └── platforms.ts        # list supported platforms
│   └── platforms/
│       ├── index.ts             # PLATFORMS registry
│       ├── x.ts                 # X/Twitter — OAuth 1.0a
│       ├── bluesky.ts           # Bluesky — AT Protocol
│       ├── mastodon.ts          # Mastodon — REST
│       ├── discord.ts           # Discord — Webhook
│       ├── telegram.ts          # Telegram — Bot API
│       ├── devto.ts             # Dev.to — REST
│       ├── linkedin.ts          # LinkedIn — ugcPosts v2
│       ├── reddit.ts            # Reddit — OAuth2 password
│       └── facebook.ts         # Facebook — Graph API
├── plugin.json                  # Supercli plugin manifest (22 commands)
├── package.json                 # npm package (bun postinstall builds binary)
├── bin/minipostiz               # Compiled binary (gitignored)
└── .agents/skills/maintainer/SKILL.md   ← this file

~/ai/supercli/plugins/minipostiz-cli/   # MIRROR — keep in sync
├── plugin.json
├── meta.json
├── install-guidance.json
└── skills/quickstart/SKILL.md
```

---

## Smoke test (6 platforms verified)

```bash
minipostiz publish --platform discord  --message "test"   # ✅
minipostiz publish --platform devto    --message "# test\nbody"  # ✅
minipostiz publish --platform bluesky  --message "test"   # ✅
minipostiz publish --platform mastodon --message "test"   # ✅
minipostiz publish --platform telegram --message "test"   # ✅
minipostiz publish --platform linkedin --message "test"   # ✅
```

Pending: `x` (needs Twitter API keys), `reddit` (needs OAuth app), `facebook` (needs page token)

---

## Known platform quirks

| Platform | Notes |
|----------|-------|
| X/Twitter | OAuth 1.0a — all 4 keys required. App needs "Read and Write" permissions |
| LinkedIn | Uses `/v2/ugcPosts` (NOT `/rest/posts` — requires partner approval). `personUrn` auto-resolved via `/v2/userinfo` if token has `openid` scope |
| Dev.to | First line of message becomes article title; rest becomes body |
| Reddit | Password-grant OAuth — use a dedicated "script" app type |
| Discord | Webhook only — no OAuth needed |
| Telegram | Bot must be added to channel/group before posting. chatId ≠ botId |

---

## Data locations

```
~/.minipostiz/minipostiz.db   # SQLite — auth + posts
~/.minipostiz/daemon.pid      # Daemon PID
~/.minipostiz/daemon.log      # Daemon log
```
