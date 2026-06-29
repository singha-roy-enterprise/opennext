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

export const UNITS = ["pcs", "bag", "box", "kg", "litre", "metre", "sheet", "coil", "bucket", "jar", "cft", "set", "pair"];

const STORAGE_KEY = "sre_inventory";

/** Seed catalogue used on first load / when storage is empty. */
export function seedInventory(): InventoryItem[] {
    const d = (
        id: string,
        sku: string,
        name: string,
        description: string,
        unit: string,
        qty: number,
        purchase: number,
        selling: number,
        reorder: number,
    ): InventoryItem => ({ id, sku, name, description, unit, qty, purchase, selling, reorder });
    return [
        d("i1", "CEM-OPC53", "Ambuja OPC 53 Grade Cement", "High-strength Portland cement for structural work", "bag", 240, 360, 410, 50),
        d("i2", "STL-TMT12", "TMT Steel Bar 12mm", "Fe500D corrosion-resistant reinforcement bar", "pcs", 85, 720, 815, 40),
        d("i3", "PVC-PIPE4", "Astral PVC Pipe 4 inch", "Rigid pressure pipe, 3 metre length", "pcs", 18, 540, 640, 25),
        d("i4", "PNT-EML20", "Asian Paints Emulsion 20L", "Premium interior wall emulsion, matt finish", "bucket", 0, 3100, 3650, 8),
        d("i5", "WIR-FR15", "Finolex FR Wire 1.5sqmm", "Flame-retardant house wire, 90m coil", "coil", 64, 1180, 1390, 20),
        d("i6", "BRK-RED1", "Red Clay Brick Class A", "Standard burnt clay building brick", "pcs", 12500, 8, 11, 2000),
        d("i7", "SND-RIV1", "River Sand", "Screened fine aggregate for plastering", "cft", 320, 55, 78, 100),
        d("i8", "PLY-MR18", "Century Ply MR 18mm", "Moisture-resistant plywood, 8x4 ft sheet", "sheet", 9, 1850, 2150, 12),
        d("i9", "GI-WIRE2", "GI Binding Wire 18g", "Galvanised iron binding wire", "kg", 140, 78, 95, 30),
        d("i10", "SWT-MOD1", "Modular Switch 1-Way", "16A modular wall switch, white", "pcs", 480, 42, 65, 100),
        d("i11", "TNK-1000", "Sintex Water Tank 1000L", "Triple-layer overhead storage tank", "pcs", 6, 6200, 7400, 5),
        d("i12", "ADH-FEV5", "Fevicol SH 5kg", "Synthetic resin wood adhesive", "jar", 0, 640, 760, 10),
        d("i13", "MS-ANG50", "MS Angle 50x50x5mm", "Mild steel structural angle, 6 metre", "pcs", 54, 980, 1130, 20),
        d("i14", "LED-PH09", "Philips LED Bulb 9W", "Cool daylight B22 base LED bulb", "pcs", 360, 58, 90, 80),
        d("i15", "CMT-WHT5", "Birla White Cement 5kg", "White cement for finishing & grouting", "bag", 22, 175, 215, 25),
    ];
}

export function loadInventory(): InventoryItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed as InventoryItem[];
        }
    } catch {
        // ignore
    }
    return seedInventory();
}

export function saveInventory(items: InventoryItem[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // ignore
    }
}

export function statusMeta(it: InventoryItem): StatusMeta {
    if (it.qty <= 0) return { key: "out", label: "Out", color: "#BE3A28", bg: "rgba(190,58,40,0.08)", border: "rgba(190,58,40,0.3)" };
    if (it.qty <= it.reorder) return { key: "low", label: "Low", color: "#B07415", bg: "rgba(176,116,21,0.1)", border: "rgba(176,116,21,0.32)" };
    return { key: "in", label: "In stock", color: "#2F7A55", bg: "rgba(47,122,85,0.08)", border: "rgba(47,122,85,0.28)" };
}

export function inr(n: number): string {
    return "₹" + new Intl.NumberFormat("en-IN").format(Math.round(n));
}
