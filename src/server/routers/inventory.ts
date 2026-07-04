import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc";
import { inventoryItems } from "@/server/db";

/** Shared field schema for create/update. Numbers are clamped to sane floors. */
const itemFields = z.object({
    sku: z.string().trim().min(1, "SKU is required.").max(40).toUpperCase(),
    name: z.string().trim().min(1, "Item name is required.").max(120),
    description: z.string().trim().max(400).default(""),
    unit: z.string().trim().min(1).max(20).default("pcs"),
    qty: z.number().int().min(0).default(0),
    purchase: z.number().min(0).default(0),
    selling: z.number().min(0).default(0),
    reorder: z.number().int().min(0).default(0),
});

export const inventoryRouter = router({
    /** Full catalogue, alphabetical. Readable by everyone (guests included). */
    list: publicProcedure.query(({ ctx }) => ctx.db.select().from(inventoryItems).orderBy(asc(inventoryItems.name))),

    create: adminProcedure.input(itemFields).mutation(async ({ ctx, input }) => {
        const clash = await ctx.db
            .select({ id: inventoryItems.id })
            .from(inventoryItems)
            .where(eq(inventoryItems.sku, input.sku))
            .get();
        if (clash) throw new TRPCError({ code: "CONFLICT", message: `SKU "${input.sku}" already exists.` });
        const [item] = await ctx.db.insert(inventoryItems).values(input).returning();
        return item;
    }),

    update: adminProcedure
        .input(z.object({ id: z.string().min(1) }).and(itemFields))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            // Guard against colliding with a different item's SKU.
            const clash = await ctx.db
                .select({ id: inventoryItems.id })
                .from(inventoryItems)
                .where(eq(inventoryItems.sku, data.sku))
                .get();
            if (clash && clash.id !== id) {
                throw new TRPCError({ code: "CONFLICT", message: `SKU "${data.sku}" already exists.` });
            }
            const [item] = await ctx.db
                .update(inventoryItems)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(inventoryItems.id, id))
                .returning();
            if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
            return item;
        }),

    /** Increment/decrement stock, clamped at zero. Used by the +/- controls. */
    adjustQty: adminProcedure
        .input(z.object({ id: z.string().min(1), delta: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db
                .select({ qty: inventoryItems.qty })
                .from(inventoryItems)
                .where(eq(inventoryItems.id, input.id))
                .get();
            if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
            const [updated] = await ctx.db
                .update(inventoryItems)
                .set({ qty: Math.max(0, item.qty + input.delta), updatedAt: new Date() })
                .where(eq(inventoryItems.id, input.id))
                .returning();
            return updated;
        }),

    remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
        const [removed] = await ctx.db.delete(inventoryItems).where(eq(inventoryItems.id, input.id)).returning();
        if (!removed) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
        return { ok: true as const };
    }),

    bulkRemove: adminProcedure
        .input(z.object({ ids: z.array(z.string().min(1)).min(1) }))
        .mutation(async ({ ctx, input }) => {
            const removed = await ctx.db
                .delete(inventoryItems)
                .where(inArray(inventoryItems.id, input.ids))
                .returning({ id: inventoryItems.id });
            return { count: removed.length };
        }),
});
