import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

/**
 * Build a Prisma client bound to a Cloudflare D1 database. A fresh client is
 * created per request because the D1 binding is only valid within the current
 * request's Cloudflare context — clients must never be cached across requests.
 */
export function createPrisma(d1: D1Database): PrismaClient {
    return new PrismaClient({ adapter: new PrismaD1(d1) });
}
