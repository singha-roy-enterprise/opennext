import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration for the Cloudflare D1 (serverless SQLite) schema.
 *
 * Schema migrations are hand-authored SQL under `migrations/` and applied to D1
 * with `wrangler d1 migrations apply` (see README/package scripts). Drizzle Kit's
 * `out` points at the same directory so `pnpm run db:generate` can emit a new SQL
 * migration derived from a change to `src/server/db/schema.ts`, and `db:studio`
 * can browse the schema — but the existing `0001`/`0002` SQL remain the applied
 * source of truth via Wrangler.
 *
 * The app itself talks to D1 through `drizzle-orm/d1` in `src/server/db.ts`;
 * nothing here runs in the Worker.
 */
export default defineConfig({
    dialect: "sqlite",
    schema: "./src/server/db/schema.ts",
    out: "./migrations",
});
