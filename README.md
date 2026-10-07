# Suggestions

BigHappySmiley suggestions board — Discord-style forum categories, threads, and replies with real authentication.

## Features

- **Browse** categories and threads without signing in
- **Sign in** with email (Neon Auth). Optional GitHub / BigHappySmiley OAuth when configured
- **Post / reply** requires authentication
- **Admin** category and tag management for allowlisted emails or GitHub logins
- **Workers KV** persistence for forum data and auth sessions

## Stack

- Next.js (App Router) + TypeScript
- Cloudflare Workers via `@opennextjs/cloudflare`
- Auth sessions + users in Workers KV (`SUGGESTIONS_KV`)

## Auth

| Method | Status | Env |
| --- | --- | --- |
| Email (Neon Auth) | Enabled | `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` |
| GitHub OAuth | Optional | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| BigHappySmiley OAuth | Optional | `BHS_OAUTH_*` |

Admins: set `ADMIN_EMAILS` and/or `ADMIN_GITHUB_LOGINS` (comma-separated). Production allowlist includes `hf@bighappysmiley.com`.

Also set `APP_URL` to the public origin (used for OAuth redirects).

Email login uses **Neon Auth** (Managed Better Auth). Verification/reset emails are sent by Neon.

See `.env.example` for the full list.

## Develop

```bash
npm install
cp .env.example .env.local
# fill secrets, then:
npm run dev
```

## Deploy (Cloudflare Workers / OpenNext)

```bash
npm run deploy
```

Set secrets with Wrangler when needed:

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put BHS_OAUTH_CLIENT_SECRET
npx wrangler secret put NEON_AUTH_COOKIE_SECRET
```

Non-secret vars live in `wrangler.jsonc` under `vars` (for example `APP_URL`, `ADMIN_EMAILS`, `NEON_AUTH_BASE_URL`).
