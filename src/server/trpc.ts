import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "@/server/context";

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

/** Open to everyone, including guests. */
export const publicProcedure = t.procedure;

/** Requires a valid session; narrows `ctx.user` to non-null for downstream resolvers. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be signed in." });
    return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Requires an admin session — used for every inventory write. */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access is required." });
    return next({ ctx });
});
