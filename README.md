# Suggestions

Internal suggestions board modeled on Discord forum channels, with real authentication.

## Features

- **Browse** categories and threads without signing in
- **Sign in** with GitHub, BigHappySmiley (OAuth), or email magic link
- **BigHappySmiley Community** login is shown as coming soon (disabled)
- **Post / reply** requires authentication
- **Admin** category/tag management for allowlisted emails or GitHub logins
- **Workers KV** persistence for forum data and auth sessions

## Stack

- Next.js (App Router) + TypeScript
- Cloudflare Workers via `@opennextjs/cloudflare`
- Auth sessions + users in Workers KV (`SUGGESTIONS_KV`)

## Auth model

| Method | Status | Env |
| --- | --- | --- |
| GitHub OAuth | Working when configured | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |
| BigHappySmiley OAuth | Working when IdP env is set | `BHS_OAUTH_*` |
| Email (Neon Auth) | Working when Neon Auth env is set | `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET` |
| BigHappySmiley Community | Coming soon (UI disabled) | — |

Admins: set `ADMIN_EMAILS` and/or `ADMIN_GITHUB_LOGINS` (comma-separated). Until those are set, nobody is treated as admin.

Also set `APP_URL` to the public origin (used for OAuth redirects).

Email login uses **Neon Auth** (Managed Better Auth). Verification/reset emails are sent by Neon (`auth@mail.myneon.app` on shared SMTP). No Resend required.

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
# temporary preview without account login:
npx opennextjs-cloudflare build && npx wrangler deploy --temporary
```

Set secrets with Wrangler (production):

```bash
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put BHS_OAUTH_CLIENT_SECRET
npx wrangler secret put NEON_AUTH_COOKIE_SECRET
# …and remaining secrets from .env.example
```

Non-secret vars can live in `wrangler.jsonc` under `vars` (for example `APP_URL`, `ADMIN_EMAILS`, `NEON_AUTH_BASE_URL`, OAuth client IDs).

### Bind Wrangler to your Cloudflare account

```bash
npx wrangler login --device --browser=false
```

Open the printed URL (or https://dash.cloudflare.com/oauth2/device/verify), enter the code, approve — then `npm run deploy` targets your account (no `--temporary`).
