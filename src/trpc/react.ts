import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/app-router";

/** Typed tRPC React hooks — `trpc.auth.me.useQuery()`, etc. */
export const trpc = createTRPCReact<AppRouter>();
