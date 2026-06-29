import { useMemo } from "react";
import type { BillItem, BillItemCalculated, BillTotals } from "@/types/bill";

/**
 * Hook that calculates all derived values for bill items.
 *
 * For each item, calculates:
 * - Taxable Value = Quantity × Rate
 * - CGST Amount = Taxable Value × (CGST% / 100)
 * - SGST Amount = Taxable Value × (SGST% / 100)
 * - Total Amount = Taxable Value + CGST Amount + SGST Amount
 *
 * Also calculates grand totals across all items.
 */
export function useBillCalculations(items: BillItem[]) {
    const calculatedItems: BillItemCalculated[] = useMemo(() => {
        return items.map((item) => {
            const quantity = item.quantity ?? 0;
            const rate = item.rate ?? 0;
            const cgstPercent = item.cgstPercent ?? 0;
            const sgstPercent = item.sgstPercent ?? 0;

            const taxableValue = quantity * rate;
            const cgstAmount = (taxableValue * cgstPercent) / 100;
            const sgstAmount = (taxableValue * sgstPercent) / 100;
            const totalAmount = taxableValue + cgstAmount + sgstAmount;

            return {
                ...item,
                taxableValue,
                cgstAmount,
                sgstAmount,
                totalAmount,
            };
        });
    }, [items]);

    const totals: BillTotals = useMemo(() => {
        return calculatedItems.reduce(
            (acc, item) => ({
                totalTaxableValue: acc.totalTaxableValue + item.taxableValue,
                totalCgst: acc.totalCgst + item.cgstAmount,
                totalSgst: acc.totalSgst + item.sgstAmount,
                grandTotal: acc.grandTotal + item.totalAmount,
            }),
            {
                totalTaxableValue: 0,
                totalCgst: 0,
                totalSgst: 0,
                grandTotal: 0,
            },
        );
    }, [calculatedItems]);

    return { calculatedItems, totals };
}
