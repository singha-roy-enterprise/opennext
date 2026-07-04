import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/server/db/schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Build a Drizzle client bound to a Cloudflare D1 database. A fresh client is
 * created per request because the D1 binding is only valid within the current
 * request's Cloudflare context — clients must never be cached across requests.
 * Passing `{ schema }` enables the relational query API (`db.query.*`).
 */
export function createDb(d1: D1Database) {
    return drizzle(d1, { schema });
}

export { schema };
export * from "@/server/db/schema";
