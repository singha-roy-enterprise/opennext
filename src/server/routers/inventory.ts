import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "@/server/trpc";

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
    list: publicProcedure.query(({ ctx }) => ctx.db.inventoryItem.findMany({ orderBy: { name: "asc" } })),

    create: adminProcedure.input(itemFields).mutation(async ({ ctx, input }) => {
        const clash = await ctx.db.inventoryItem.findUnique({ where: { sku: input.sku }, select: { id: true } });
        if (clash) throw new TRPCError({ code: "CONFLICT", message: `SKU "${input.sku}" already exists.` });
        return ctx.db.inventoryItem.create({ data: input });
    }),

    update: adminProcedure
        .input(z.object({ id: z.string().min(1) }).and(itemFields))
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input;
            // Guard against colliding with a different item's SKU.
            const clash = await ctx.db.inventoryItem.findUnique({ where: { sku: data.sku }, select: { id: true } });
            if (clash && clash.id !== id) {
                throw new TRPCError({ code: "CONFLICT", message: `SKU "${data.sku}" already exists.` });
            }
            try {
                return await ctx.db.inventoryItem.update({ where: { id }, data });
            } catch {
                throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
            }
        }),

    /** Increment/decrement stock, clamped at zero. Used by the +/- controls. */
    adjustQty: adminProcedure
        .input(z.object({ id: z.string().min(1), delta: z.number().int() }))
        .mutation(async ({ ctx, input }) => {
            const item = await ctx.db.inventoryItem.findUnique({ where: { id: input.id } });
            if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
            return ctx.db.inventoryItem.update({
                where: { id: input.id },
                data: { qty: Math.max(0, item.qty + input.delta) },
            });
        }),

    remove: adminProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
        await ctx.db.inventoryItem.delete({ where: { id: input.id } }).catch(() => {
            throw new TRPCError({ code: "NOT_FOUND", message: "Item not found." });
        });
        return { ok: true as const };
    }),

    bulkRemove: adminProcedure
        .input(z.object({ ids: z.array(z.string().min(1)).min(1) }))
        .mutation(async ({ ctx, input }) => {
            const { count } = await ctx.db.inventoryItem.deleteMany({ where: { id: { in: input.ids } } });
            return { count };
        }),
});
