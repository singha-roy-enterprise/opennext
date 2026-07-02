import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createPrisma } from "@/server/db";
import { SESSION_COOKIE, readCookie } from "@/server/auth/session-cookie";

/** The public shape of a signed-in user — never includes the password hash. */
export interface SessionUser {
    id: string;
    login: string;
    username: string;
    email: string;
    name: string;
    initials: string;
    role: "admin" | "user";
}

/**
 * Per-request tRPC context. Resolves the D1-backed Prisma client from the
 * Cloudflare binding and, if a valid session cookie is present, the current
 * user. `resHeaders` is threaded through so auth mutations can set/clear the
 * session cookie on the response.
 */
export async function createTRPCContext({ req, resHeaders }: { req: Request; resHeaders: Headers }) {
    const { env } = await getCloudflareContext({ async: true });
    if (!env.D1) throw new Error("D1 binding is not configured — check wrangler.jsonc.");

    const db = createPrisma(env.D1);
    const secure = new URL(req.url).protocol === "https:";

    const token = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
    let user: SessionUser | null = null;
    let sessionToken: string | null = null;

    if (token) {
        const session = await db.session.findUnique({ where: { token }, include: { user: true } });
        if (session && session.expiresAt > new Date()) {
            sessionToken = token;
            const u = session.user;
            user = {
                id: u.id,
                login: `@${u.username}`,
                username: u.username,
                email: u.email,
                name: u.name,
                initials: u.initials,
                role: u.role === "admin" ? "admin" : "user",
            };
        } else if (session) {
            // Expired — clean it up so the table doesn't accumulate dead rows.
            await db.session.delete({ where: { token } }).catch(() => {});
        }
    }

    return { db, env, req, resHeaders, secure, user, sessionToken };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
