import { InferInsertModel, InferSelectModel, relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Drizzle schema for the Cloudflare D1 (serverless SQLite) database. It is a
 * typed mirror of the tables created by the raw-SQL migrations under
 * `migrations/` (applied by Wrangler) — Drizzle does not own the migrations
 * here, it only describes them so queries are type-safe.
 *
 * Datetime columns are stored as epoch-millisecond integers (verified against
 * the live D1 data), so they use `mode: "timestamp_ms"` and surface as JS
 * `Date` values. `id`, `createdAt`, and `updatedAt` get JS-side defaults via
 * `$defaultFn` so inserts can omit them; `updatedAt` is also set explicitly on
 * every update (see the routers) since Drizzle has no Prisma-style `@updatedAt`.
 */

/** New opaque primary key — runtime-native, no extra dependency. */
const newId = () => crypto.randomUUID();
const now = () => new Date();

/// An authenticated account. Passwords are stored as PBKDF2 hashes
/// (see `src/server/auth/password.ts`), never in plain text.
export const users = sqliteTable("users", {
    id: text("id").primaryKey().$defaultFn(newId),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    /// "admin" | "user" — guests are unauthenticated and have no row.
    role: text("role").notNull().default("user"),
    /// Encoded as `pbkdf2$<iterations>$<saltB64>$<hashB64>`.
    password: text("password").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/// A server-side session, referenced by an opaque token held in an httpOnly cookie.
export const sessions = sqliteTable("sessions", {
    id: text("id").primaryKey().$defaultFn(newId),
    token: text("token").notNull().unique(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

/// A stock-ledger line. `qty <= 0` is "out", `qty <= reorder` is "low".
export const inventoryItems = sqliteTable("inventory_items", {
    id: text("id").primaryKey().$defaultFn(newId),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    unit: text("unit").notNull().default("pcs"),
    qty: integer("qty").notNull().default(0),
    purchase: real("purchase").notNull().default(0),
    selling: real("selling").notNull().default(0),
    reorder: integer("reorder").notNull().default(0),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
    updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type InventoryItem = InferSelectModel<typeof inventoryItems>;

export type NewUser = InferInsertModel<typeof users>;
export type NewSession = InferInsertModel<typeof sessions>;
export type NewInventoryItem = InferInsertModel<typeof inventoryItems>;
