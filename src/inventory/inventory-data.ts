export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    description: string;
    unit: string;
    qty: number;
    purchase: number;
    selling: number;
    reorder: number;
}

export type StatusKey = "in" | "low" | "out";

export interface StatusMeta {
    key: StatusKey;
    label: string;
    color: string;
    bg: string;
    border: string;
}

export const UNITS = [
    "pcs",
    "bag",
    "box",
    "kg",
    "litre",
    "metre",
    "sheet",
    "coil",
    "bucket",
    "jar",
    "cft",
    "set",
    "pair",
];

export function statusMeta(it: InventoryItem): StatusMeta {
    if (it.qty <= 0)
        return {
            key: "out",
            label: "Out",
            color: "#BE3A28",
            bg: "rgba(190,58,40,0.08)",
            border: "rgba(190,58,40,0.3)",
        };
    if (it.qty <= it.reorder)
        return {
            key: "low",
            label: "Low",
            color: "#B07415",
            bg: "rgba(176,116,21,0.1)",
            border: "rgba(176,116,21,0.32)",
        };
    return {
        key: "in",
        label: "In stock",
        color: "#2F7A55",
        bg: "rgba(47,122,85,0.08)",
        border: "rgba(47,122,85,0.28)",
    };
}

export function inr(n: number): string {
    return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}
