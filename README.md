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
- JSON file store in `data/store.json` (seeded on first run)

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
