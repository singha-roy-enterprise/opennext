import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import type { Context, SessionUser } from "@/server/context";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
    buildClearSessionCookie,
    buildSessionCookie,
    generateSessionToken,
    sessionExpiry,
} from "@/server/auth/session-cookie";
import type { User } from "@/generated/prisma/client";

/** Map a DB user row to the public session shape (drops the password hash). */
function toSessionUser(user: User): SessionUser {
    return {
        id: user.id,
        login: `@${user.username}`,
        username: user.username,
        email: user.email,
        name: user.name,
        initials: user.initials,
        role: user.role === "admin" ? "admin" : "user",
    };
}

/** "Debarishi Singha Roy" -> "DS", "sera" -> "SE". */
function deriveInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Create a session row and queue the session cookie on the response. */
async function startSession(ctx: Context, userId: string): Promise<void> {
    const token = generateSessionToken();
    const expiresAt = sessionExpiry();
    await ctx.db.session.create({ data: { token, userId, expiresAt } });
    ctx.resHeaders.append("Set-Cookie", buildSessionCookie(token, expiresAt, ctx.secure));
}

export const authRouter = router({
    /** Current session user, or null for guests. */
    me: publicProcedure.query(({ ctx }) => ctx.user),

    signup: publicProcedure
        .input(
            z.object({
                name: z.string().trim().min(1, "Enter your full name."),
                username: z
                    .string()
                    .trim()
                    .min(3, "Username must be at least 3 characters.")
                    .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, numbers, dots, dashes or underscores."),
                email: z.email("Enter a valid email address.").trim(),
                password: z.string().min(6, "Password must be at least 6 characters."),
            }),
        )
        .mutation(async ({ ctx, input }): Promise<SessionUser> => {
            const username = input.username.toLowerCase();
            const email = input.email.toLowerCase();

            const clash = await ctx.db.user.findFirst({
                where: { OR: [{ username }, { email }] },
                select: { id: true },
            });
            if (clash) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "That username or email is already registered.",
                });
            }

            const user = await ctx.db.user.create({
                data: {
                    username,
                    email,
                    name: input.name.trim(),
                    initials: deriveInitials(input.name),
                    role: "user",
                    password: await hashPassword(input.password),
                },
            });

            await startSession(ctx, user.id);
            return toSessionUser(user);
        }),

    login: publicProcedure
        .input(
            z.object({
                identifier: z.string().trim().min(1, "Enter your username or email."),
                password: z.string().min(1, "Enter your password."),
            }),
        )
        .mutation(async ({ ctx, input }): Promise<SessionUser> => {
            const identifier = input.identifier.toLowerCase();
            const user = await ctx.db.user.findFirst({
                where: { OR: [{ username: identifier }, { email: identifier }] },
            });

            // Verify even when the user is missing to keep the timing uniform.
            const ok = user
                ? await verifyPassword(input.password, user.password)
                : await verifyPassword(input.password, "pbkdf2$100000$AAAA$AAAA");

            if (!user || !ok) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect username/email or password." });
            }

            await startSession(ctx, user.id);
            return toSessionUser(user);
        }),

    logout: protectedProcedure.mutation(async ({ ctx }) => {
        if (ctx.sessionToken) {
            await ctx.db.session.delete({ where: { token: ctx.sessionToken } }).catch(() => {});
        }
        ctx.resHeaders.append("Set-Cookie", buildClearSessionCookie(ctx.secure));
        return { ok: true as const };
    }),
});
