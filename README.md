# OpenNext Starter

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Read the documentation at https://opennext.js.org/cloudflare.

## Backend (tRPC + Drizzle + Cloudflare D1)

Auth (signup / login / logout / session) and the inventory ledger are served by
type-safe [tRPC](https://trpc.io) routes under `src/app/api/trpc`, backed by
[Drizzle ORM](https://orm.drizzle.team) against a [Cloudflare D1](https://developers.cloudflare.com/d1/)
(serverless SQLite) database. Passwords are hashed with Web Crypto (PBKDF2) and
sessions are opaque tokens held in an httpOnly cookie.

Key locations:

- `src/server/db/schema.ts` — Drizzle data model (`users`, `sessions`, `inventory_items`).
- `migrations/` — raw SQL migrations applied to D1 by Wrangler (`0001_init`, `0002_seed`).
- `src/server/` — Drizzle client, auth helpers, tRPC context/routers.
- `src/trpc/` — the client-side tRPC + React Query provider.

### First-time setup

```bash
pnpm install                 # Drizzle has no generated client, so nothing to regenerate
pnpm run db:migrate:local    # create + seed the local D1 database
```

The seed adds two demo accounts — `debarishi-sr` / `admin123` (admin) and
`sera-sengupta` / `user123` (user) — plus a starter catalogue. After editing
`src/server/db/schema.ts`, produce a new SQL migration with:

```bash
pnpm run db:generate         # drizzle-kit generate — emits migrations/<NNNN>_*.sql
```

Migrations are hand-authored SQL applied to D1 by Wrangler (the schema is a
typed mirror of those tables). Browse the data locally with `pnpm run db:studio`.
To apply migrations to the deployed (staging) database: `pnpm run db:migrate:staging`.

## Develop

Run the Next.js development server (D1 bindings are provided locally via
`initOpenNextCloudflareForDev`):

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Preview

Preview the application locally on the Cloudflare runtime:

```bash
npm run preview
# or similar package manager command
```

## Deploy

Deploy the application to Cloudflare:

```bash
npm run deploy
# or similar package manager command
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
