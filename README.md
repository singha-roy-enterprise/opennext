# OpenNext Starter

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Read the documentation at https://opennext.js.org/cloudflare.

## Backend (tRPC + Prisma + Cloudflare D1)

Auth (signup / login / logout / session) and the inventory ledger are served by
type-safe [tRPC](https://trpc.io) routes under `src/app/api/trpc`, backed by
[Prisma](https://www.prisma.io) against a [Cloudflare D1](https://developers.cloudflare.com/d1/)
(serverless SQLite) database. Passwords are hashed with Web Crypto (PBKDF2) and
sessions are opaque tokens held in an httpOnly cookie.

Key locations:

- `prisma/schema.prisma` — data model (`User`, `Session`, `InventoryItem`).
- `migrations/` — raw SQL migrations applied to D1 by Wrangler (`0001_init`, `0002_seed`).
- `src/server/` — Prisma client, auth helpers, tRPC context/routers.
- `src/trpc/` — the client-side tRPC + React Query provider.

### First-time setup

```bash
pnpm install                 # also runs `prisma generate` (postinstall)
pnpm run db:migrate:local    # create + seed the local D1 database
```

The seed adds two demo accounts — `debarishi-sr` / `admin123` (admin) and
`sera-sengupta` / `user123` (user) — plus a starter catalogue. Regenerate the
Prisma client after editing the schema with `pnpm run db:generate`, and produce
a new SQL migration with:

```bash
pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > migrations/000N_name.sql
```

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
