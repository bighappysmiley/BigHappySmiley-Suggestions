# Suggestions

Internal suggestions board modeled on Discord forum channels.

## Features

- **Categories** — forum boards admins create and manage
- **Suggestion threads** — title, tags, author, reply count, last activity, pins
- **New suggestion** — create a post inside a category
- **Thread view** — original post plus replies
- **Admin** — create/delete categories and manage per-category tags

## Stack

- Next.js (App Router) + TypeScript
- Cloudflare Workers via `@opennextjs/cloudflare`
- Data: Workers KV in production (`SUGGESTIONS_KV`); local `data/store.json` / in-memory fallback for `next dev`

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Cloudflare)

Full Next.js (SSR + API routes) deploys to **Cloudflare Workers** with the OpenNext adapter (the supported path for dynamic Next.js; classic `wrangler pages deploy` is for static exports only).

```bash
npm run deploy
# or, without an account (temporary preview, claim within 60 minutes):
npx opennextjs-cloudflare build && npx wrangler deploy --temporary
```

Requires Wrangler auth (`npx wrangler login`) or a temporary claim deploy.

## Scripts

- `npm run dev` — local development server
- `npm run build` — Next.js production build
- `npm run preview` — OpenNext build + local Workers preview
- `npm run deploy` — OpenNext build + Wrangler deploy
- `npm run lint` — ESLint
