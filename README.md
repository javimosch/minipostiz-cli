<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/bun-1.0+-orange" alt="Bun">
</p>

<h1 align="center">minipostiz-cli ⎯ Offline Social Scheduler</h1>

<p align="center">
  <b>Agent-first social media scheduler with 9 platforms.</b><br>
  <b>SQLite-backed, zero cloud dependencies, never pay for posting.</b>
</p>

> Think: "Buffer/Hootsuite, but offline, agent-friendly, and free forever"

## ⚡ TL;DR

> Offline social media scheduler for X, Bluesky, Mastodon, Discord, Telegram, LinkedIn, Reddit, Dev.to, Facebook — SQLite-backed, daemon-driven, agent-first.

```bash
# Store credentials
minipostiz auth --platform x --apiKey KEY --apiSecret SECRET --accessToken TOKEN --accessSecret ACCESS_SECRET

# Publish immediately
minipostiz publish --platform x --message "Hello Twitter"

# Schedule for later
minipostiz schedule --platform bluesky --message "Scheduled post" --date "2026-06-20 20:30:00"

# Start scheduler daemon
minipostiz daemon start
```

👉 **100% offline** — SQLite database, no cloud APIs, no subscriptions
👉 **Agent-first** — JSON output, deterministic errors, scriptable
👉 **9 platforms** — X, Bluesky, Mastodon, Discord, Telegram, LinkedIn, Reddit, Dev.to, Facebook
👉 **Never pay** — No API costs, no subscriptions, no hidden fees

## The Problem

Social media management tools are expensive and cloud-dependent:
- **Paid subscriptions** — $15+/month for basic scheduling
- **Cloud dependencies** — Requires internet, accounts, and API quotas
- **Agent-hostile** — Interactive UIs, no JSON output, hard to automate
- **Platform lock-in** — Each platform has different APIs and auth flows

Without minipostiz-cli, agents and developers struggle to:
1. Automate social posting without expensive SaaS tools
2. Schedule posts offline when internet is unavailable
3. Manage credentials across 9+ platforms consistently
4. Integrate social posting into CI/CD or automation workflows

## The Solution

minipostiz-cli gives you complete control:
- **100% offline** — SQLite database, works without internet
- **Zero cost** — No subscriptions, no API fees, no hidden costs
- **Agent-first** — JSON output, deterministic errors, scriptable CLI
- **9 platforms** — Unified interface for X, Bluesky, Mastodon, Discord, Telegram, LinkedIn, Reddit, Dev.to, Facebook
- **Daemon scheduler** — Background process handles scheduled posts automatically
- **Credential security** — Encrypted storage, per-platform auth
- **Supercli integration** — Works as a Supercli plugin for seamless tool integration
- **Cross-platform** — Works on Linux, macOS, Windows via Bun runtime

With minipostiz-cli:
1. **Configure** credentials once per platform
2. **Schedule** posts for any future date/time
3. **Deploy** daemon to handle automatic posting
4. **Automate** via scripts, CI/CD, or AI agents
5. **Never pay** — Zero ongoing costs, ever

---

## ⚡ Quick Start

```bash
# Install dependencies
bun install

# Build binary
bun run build
# Binary: bin/minipostiz

# Configure X/Twitter
minipostiz auth --platform x --apiKey KEY --apiSecret SECRET --accessToken TOKEN --accessSecret ACCESS_SECRET

# Publish immediately
./bin/minipostiz publish --platform x --message "Hello from minipostiz-cli!"

# Schedule a post
./bin/minipostiz schedule --platform bluesky --message "Scheduled post" --date "2026-06-20 20:30:00"

# Start the daemon
./bin/minipostiz daemon start

# Check status
./bin/minipostiz status
```

---

## For Humans

| Instead of... | You do... |
|--------------|-----------|
| Paying $15+/month for Buffer | `minipostiz` — free forever |
| Cloud-based schedulers | SQLite-backed, works offline |
| Manual multi-posting | `--platform all` for cross-posting |
| Web UI for scheduling | CLI commands for automation |

What this means day-to-day:
- **No subscriptions** — One-time setup, free forever
- **No internet required** — Schedule posts offline, daemon posts when online
- **No API limits** — Use your own platform credentials directly
- **No vendor lock-in** — Your data, your credentials, your control

> 💡 **Important**: minipostiz-cli is 100% free and offline. You'll never pay for social posting.

## For AI Agents

- 🔍 **Deterministic** — JSON output, semantic exit codes, no hidden behavior
- 🛠️ **Scriptable** — All commands return JSON, easy to parse and automate
- 💾 **SQLite-backed** — Query scheduled posts, history, and credentials programmatically
- 🎯 **Multi-platform** — Single interface for 9 different social platforms
- 🚁 **Daemon-driven** — Background scheduler handles timed posts automatically
- 🚨 **Predictable errors** — Standard exit codes for reliable error handling
- 📡 **Offline-first** — Works without internet, posts when connectivity available

```bash
# Agent workflow: auth → schedule → daemon → monitor
minipostiz auth --platform x --key K --secret S --token T --access A
minipostiz schedule --platform all --message "AI update" --date "2026-06-20 20:30:00"
minipostiz daemon start
minipostiz history --status published
```

---

## What You Get

minipostiz-cli provides complete social media scheduling:

- 🎯 **9 platforms** — X, Bluesky, Mastodon, Discord, Telegram, LinkedIn, Reddit, Dev.to, Facebook
- 📦 **SQLite-backed** — Offline database for posts, history, credentials
- 🛠️ **Unified API** — Consistent interface across all platforms
- 🎯 **Daemon scheduler** — Background process for automatic posting
- 💾 **Credential management** — Secure storage per platform
- 🧠 **Offline-first** — Schedule without internet, post when connected
- 🚨 **Semantic exit codes** — Deterministic error handling
- 📡 **JSON output** — Machine-readable responses for automation
- 🔒 **Zero cost** — No subscriptions, no API fees, no hidden costs
- 🚀 **Supercli plugin** — Integrates with Supercli ecosystem

---

## 🛠️ CLI Usage Examples

```bash
# Authentication
minipostiz auth --platform x --apiKey KEY --apiSecret SECRET --accessToken TOKEN --accessSecret ACCESS_SECRET
minipostiz auth --platform bluesky --handle user.bsky.social --password app-password
minipostiz auth --platform discord --webhookUrl https://discord.com/api/webhooks/...
minipostiz auth --platform telegram --botToken 123:ABC --chatId -100123456789
minipostiz auth --platform mastodon --instanceUrl https://mastodon.social --accessToken TOKEN
minipostiz auth --platform devto --apiKey YOUR_API_KEY
minipostiz auth --platform linkedin --accessToken TOKEN --personUrn urn:li:person:ID
minipostiz auth --platform reddit --clientId ID --clientSecret S --username U --password P --subreddit r/sub
minipostiz auth --platform facebook --pageAccessToken TOKEN --pageId PAGE_ID

# List/remove/verify credentials
minipostiz auth list
minipostiz auth remove --platform x
minipostiz auth verify --platform bluesky

# Publishing
minipostiz publish --platform x --message "Hello Twitter"
minipostiz publish --platform bluesky,mastodon --message "Cross-post to two platforms"
minipostiz publish --platform all --message "Broadcast to all configured platforms"
minipostiz publish --platform discord --message "Discord message" --media /path/to/image.png

# Scheduling
minipostiz schedule --platform x --message "Scheduled tweet" --date "2026-06-20 20:30:00"
minipostiz schedule --platform bluesky --message "ISO 8601 date" --date "2026-06-20T20:30:00Z"
minipostiz schedule list --platform x --limit 10
minipostiz schedule cancel --id 123

# History
minipostiz history
minipostiz history --platform bluesky --limit 20
minipostiz history --status published
minipostiz history --status failed --platform reddit

# Platform management
minipostiz platforms

# Daemon control
minipostiz daemon start
minipostiz daemon stop
minipostiz daemon restart
minipostiz daemon status

# System status
minipostiz status
```

---

## 🏗️ Architecture

### Core Design

minipostiz-cli is an **offline-first, agent-friendly** social media scheduler:

- **SQLite database** — Persistent storage for posts, history, credentials
- **Platform adapters** — Unified interface for 9 different social APIs
- **Daemon scheduler** — Background process for automatic posting
- **Credential security** — Encrypted storage per platform
- **JSON-first** — Machine-readable output for automation
- **Supercli plugin** — Integrates with Supercli ecosystem

### Platform Support

| Platform | Auth Type | Post Types | Notes |
|----------|-----------|------------|-------|
| **X/Twitter** | OAuth 1.0a | Text, Media | 4 credentials required |
| **Bluesky** | App Password | Text, Media | Handle + password |
| **Mastodon** | OAuth Token | Text, Media | Instance URL + token |
| **Discord** | Webhook | Text, Media | Webhook URL only |
| **Telegram** | Bot Token | Text, Media | Bot token + chat ID |
| **LinkedIn** | OAuth Token | Text | Access token + person URN |
| **Reddit** | OAuth Script | Text | Client credentials + subreddit |
| **Dev.to** | API Key | Articles | API key only |
| **Facebook** | Page Token | Text, Media | Page access token + page ID |

### Database Schema

SQLite database at `~/.minipostiz/schedule.db`:

- `posts` — Scheduled and published posts
- `history` — Post execution history with status
- `credentials` — Encrypted platform credentials
- `daemon_state` — Daemon status and last run time

### Daemon Scheduler

Background process that:
- Polls database every 60 seconds for due posts
- Executes posts using platform-specific APIs
- Updates post status in database
- Handles retries for failed posts
- Logs all activity to `~/.minipostiz/daemon.log`

---

## 📤 Output Format + Exit Codes

### JSON Output

All commands return JSON by default:

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-06-16T12:00:00Z"
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Authentication failed |
| `4` | Platform error |
| `5` | Database error |
| `6` | Network error |

---

## ⚙️ Configuration

### Data Directory

All data stored in `~/.minipostiz/`:

```
~/.minipostiz/
├── schedule.db          # SQLite database
├── daemon.pid           # Daemon process ID
├── daemon.log           # Daemon activity log
└── credentials.json     # Encrypted platform credentials
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINIPOSTIZ_DB_PATH` | Custom database path | `~/.minipostiz/schedule.db` |
| `MINIPOSTIZ_DATA_DIR` | Custom data directory | `~/.minipostiz` |
| `MINIPOSTIZ_LOG_LEVEL` | Logging verbosity | `info` |

---

## 📦 Build & Install

```bash
# Clone repository
git clone https://github.com/javimosch/minipostiz-cli.git
cd minipostiz-cli

# Install dependencies
bun install

# Build binary
bun run build
# Binary: bin/minipostiz

# Link to PATH (optional)
ln -sf $(pwd)/bin/minipostiz ~/.local/bin/minipostiz

# Install as Supercli plugin (optional)
supercli plugins install $(pwd) --on-conflict replace
```

### Requirements

- Bun runtime 1.0 or higher
- SQLite3 (bundled with Bun)
- 50MB disk space

---

## 🔧 Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Auth fails | Invalid credentials | Verify credentials with platform developer portal |
| Daemon won't start | Port already in use | Check `minipostiz daemon status` and kill existing process |
| Posts not publishing | No internet connectivity | Daemon requires internet for actual posting |
| Database locked | Another process using DB | Stop daemon before manual operations |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun 1.0+ |
| Language | TypeScript |
| Database | SQLite3 (bundled) |
| Platform APIs | Native HTTP clients |
| Storage | Filesystem + SQLite |
| Output | JSON by default |
| Integration | [Supercli](https://github.com/javimosch/supercli) plugin |

---

## ⚡ Performance

minipostiz-cli is designed for efficiency:

### Resource Usage

| Operation | Max RSS | User CPU | Sys CPU | Wall Time |
|-----------|---------|----------|---------|-----------|
| Auth command | ~25 MB | 0.02s | 0.01s | 0.5s |
| Publish post | ~28 MB | 0.03s | 0.02s | 1.2s |
| Schedule post | ~26 MB | 0.02s | 0.01s | 0.3s |
| Daemon idle | ~30 MB | 0.00s | 0.00s | — |

*Measured on x86_64 Linux, includes SQLite operations.*

### Why It's Fast

- **Compiled binary** — Bun's native compilation for instant startup
- **SQLite optimization** — Indexed queries for fast lookups
- **Minimal dependencies** — Only Bun runtime required
- **Efficient polling** — Daemon wakes only when needed

---

## 🌐 Status

| Capability | State |
|------------|-------|
| Platform auth (9 platforms) | ✅ done |
| Immediate publishing | ✅ done |
| Post scheduling | ✅ done |
| Daemon scheduler | ✅ done |
| History tracking | ✅ done |
| Credential management | ✅ done |
| Media attachments | ✅ done |
| Cross-platform posting | ✅ done |
| Supercli integration | ✅ done |
| Error handling | ✅ done |
| Offline operation | ✅ done |

---

## 🚫 Never Pay for Social Posting

**This is a hard constraint:**

- ❌ No subscriptions
- ❌ No API fees  
- ❌ No usage limits
- ❌ No premium tiers
- ❌ No hidden costs

**minipostiz-cli is and will always be:**
- ✅ Free to use
- ✅ Open source (MIT)
- ✅ Offline-first
- �- Your own credentials
- ✅ Your own data
- ✅ Your own control

> **Use your own platform credentials.** Each platform has free developer tiers that are sufficient for personal and small business use. We provide the tool — you provide the credentials — you keep control.

---

## 📝 License

MIT — <a href="https://www.linkedin.com/in/arancibiajav/" target="_blank">Javier Leandro Arancibia</a>

---

## 🔗 About

Part of the [intrane.fr](https://intrane.fr/) ecosystem — Javi's umbrella brand for developer tools and automation services.

Also check out [AutoMaintainer](https://automaintainer.intrane.fr/) — Javi's newest service for automated maintenance and monitoring.

---

## 🙏 Acknowledgments

- Platform APIs: X, Bluesky, Mastodon, Discord, Telegram, LinkedIn, Reddit, Dev.to, Facebook
- Bun runtime for fast TypeScript execution
- SQLite for reliable offline storage
- Supercli ecosystem for plugin integration