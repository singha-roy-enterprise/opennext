import { router } from "@/server/trpc";
import { authRouter } from "@/server/routers/auth";
import { inventoryRouter } from "@/server/routers/inventory";

export const appRouter = router({
    auth: authRouter,
    inventory: inventoryRouter,
});

export type AppRouter = typeof appRouter;
