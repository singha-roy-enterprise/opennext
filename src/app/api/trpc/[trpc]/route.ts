import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/app-router";
import { createTRPCContext } from "@/server/context";

// Runs in the Cloudflare Worker (nodejs_compat) so `getCloudflareContext()` and
// the D1 binding are available. Always dynamic — every call hits the database.
export const dynamic = "force-dynamic";

function handler(req: Request): Promise<Response> {
    return fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: ({ resHeaders }) => createTRPCContext({ req, resHeaders }),
    });
}

export { handler as GET, handler as POST };
