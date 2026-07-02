import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration. The datasource URL here is only used by the Prisma
 * CLI (migrate diff / studio) against a throwaway local SQLite file — the app
 * itself talks to Cloudflare D1 through the driver adapter in
 * `src/server/db.ts`, never this URL.
 *
 * Schema migrations are authored as raw SQL under `migrations/` and applied to
 * D1 with `wrangler d1 migrations apply` (see README/package scripts), so this
 * `migrations.path` is only relevant if you drive migrations through Prisma.
 */
export default defineConfig({
    schema: path.join("prisma", "schema.prisma"),
    datasource: {
        url: "file:./prisma/dev.db",
    },
});
