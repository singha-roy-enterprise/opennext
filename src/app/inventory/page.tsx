"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useSession } from "@/auth/session";
import { trpc } from "@/trpc/react";
import { useToast } from "@/ui/toast";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/cn";
import { Badge, type BadgeTone } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Drawer } from "@/ui/drawer";
import { FieldLabel } from "@/ui/field";
import { Modal } from "@/ui/modal";
import { StatCell } from "@/ui/stat-cell";
import { TextInput } from "@/ui/text-input";
import {
    SearchIcon,
    CloseIcon,
    ChevronDownIcon,
    ArrowDownIcon,
    TableIcon,
    GridIcon,
    DownloadIcon,
    PlusIcon,
    MinusIcon,
    PencilIcon,
    TrashIcon,
    AlertTriangleIcon,
    InfoIcon,
    BoxIcon,
    SpinnerIcon,
} from "@/ui/icons";
import { inr, statusMeta, UNITS, type InventoryItem, type StatusMeta } from "@/inventory/inventory-data";

type SortKey = "name" | "sku" | "qty" | "purchase" | "selling";
type Filter = "all" | "in" | "low" | "out";

interface Draft {
    sku: string;
    name: string;
    description: string;
    unit: string;
    qty: string;
    purchase: string;
    selling: string;
    reorder: string;
}

interface DrawerState {
    mode: "add" | "edit";
    id?: string;
    draft: Draft;
}

const emptyDraft: Draft = {
    sku: "",
    name: "",
    description: "",
    unit: "pcs",
    qty: "",
    purchase: "",
    selling: "",
    reorder: "",
};
const fmt = new Intl.NumberFormat("en-IN");

const colHead = "font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-500";

function segClass(active: boolean, last = false): string {
    return cn(
        "cursor-pointer whitespace-nowrap border-none border-r border-ink/[0.12] px-[13px] py-2 text-[12.5px] font-semibold",
        active ? "bg-ink text-cream" : "bg-transparent text-ink-700",
        last && "border-r-0",
    );
}

function viewClass(active: boolean, last = false): string {
    return cn(
        "flex h-9 w-[38px] cursor-pointer items-center justify-center border-none border-r border-ink/[0.12]",
        active ? "bg-ink text-cream" : "bg-transparent text-ink-700",
        last && "border-r-0",
    );
}

export default function InventoryPage() {
    const { isAdmin } = useSession();
    const { toast } = useToast();

    const utils = trpc.useUtils();
    const itemsQuery = trpc.inventory.list.useQuery();
    const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);
    const loading = itemsQuery.isLoading;

    const [view, setView] = useState<"table" | "card">("table");
    const [search, setSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [statusFilter, setStatusFilter] = useState<Filter>("all");
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [drawer, setDrawer] = useState<DrawerState | null>(null);
    const [confirm, setConfirm] = useState<{ ids: string[]; title: string; message: string } | null>(null);

    // ── inventory mutations (D1 via tRPC) ──────────────────────
    const invalidateList = () => utils.inventory.list.invalidate();

    const createMutation = trpc.inventory.create.useMutation({
        onSuccess: invalidateList,
        onError: (e) => toast(e.message, "danger"),
    });
    const updateMutation = trpc.inventory.update.useMutation({
        onSuccess: invalidateList,
        onError: (e) => toast(e.message, "danger"),
    });
    // Optimistic +/- so stock ticks update instantly, rolling back on failure.
    const adjustMutation = trpc.inventory.adjustQty.useMutation({
        onMutate: async ({ id, delta }) => {
            await utils.inventory.list.cancel();
            const prev = utils.inventory.list.getData();
            utils.inventory.list.setData(undefined, (old) =>
                old?.map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it)),
            );
            return { prev };
        },
        onError: (e, _vars, context) => {
            if (context?.prev) utils.inventory.list.setData(undefined, context.prev);
            toast(e.message, "danger");
        },
        onSettled: invalidateList,
    });
    const removeMutation = trpc.inventory.remove.useMutation();
    const bulkRemoveMutation = trpc.inventory.bulkRemove.useMutation();

    const saving = createMutation.isPending || updateMutation.isPending;

    const totalValue = items.reduce((a, it) => a + it.qty * it.selling, 0);
    const lowCount = items.filter((it) => statusMeta(it).key === "low").length;
    const outCount = items.filter((it) => statusMeta(it).key === "out").length;

    const visibleItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = items.filter((it) => {
            const st = statusMeta(it).key;
            if (statusFilter !== "all" && st !== statusFilter) return false;
            if (!q) return true;
            return (it.name + " " + it.sku + " " + it.description).toLowerCase().indexOf(q) > -1;
        });
        const dir = sortDir === "asc" ? 1 : -1;
        list = list.slice().sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
            return ((av as number) - (bv as number)) * dir;
        });
        return list;
    }, [items, search, statusFilter, sortKey, sortDir]);

    const visIds = visibleItems.map((it) => it.id);
    const allSelected = visibleItems.length > 0 && visIds.every((id) => selected[id]);
    const selectedCount = Object.keys(selected).filter((k) => selected[k]).length;

    const suggestions = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!searchFocused || !q) return [];
        return items.filter((it) => (it.name + " " + it.sku).toLowerCase().indexOf(q) > -1).slice(0, 6);
    }, [items, search, searchFocused]);

    const adjustQty = (id: string, delta: number) => adjustMutation.mutate({ id, delta });

    const toggleSelect = (id: string) =>
        setSelected((prev) => {
            const next = { ...prev };
            if (next[id]) delete next[id];
            else next[id] = true;
            return next;
        });

    const toggleAll = () =>
        setSelected((prev) => {
            const next = { ...prev };
            if (allSelected) visIds.forEach((id) => delete next[id]);
            else visIds.forEach((id) => (next[id] = true));
            return next;
        });

    const openAdd = () => setDrawer({ mode: "add", draft: { ...emptyDraft } });
    const openEdit = (it: InventoryItem) =>
        setDrawer({
            mode: "edit",
            id: it.id,
            draft: {
                sku: it.sku,
                name: it.name,
                description: it.description,
                unit: it.unit,
                qty: String(it.qty),
                purchase: String(it.purchase),
                selling: String(it.selling),
                reorder: String(it.reorder),
            },
        });

    const updateDraft = (k: keyof Draft, v: string) =>
        setDrawer((prev) => (prev ? { ...prev, draft: { ...prev.draft, [k]: v } } : prev));

    const saveDrawer = () => {
        if (!drawer) return;
        const f = drawer.draft;
        if (!f.sku.trim() || !f.name.trim()) {
            toast("SKU and item name are required", "danger");
            return;
        }
        const payload = {
            sku: f.sku.trim().toUpperCase(),
            name: f.name.trim(),
            description: f.description.trim(),
            unit: f.unit,
            qty: Math.max(0, parseInt(f.qty) || 0),
            purchase: Math.max(0, parseFloat(f.purchase) || 0),
            selling: Math.max(0, parseFloat(f.selling) || 0),
            reorder: Math.max(0, parseInt(f.reorder) || 0),
        };
        const isEdit = drawer.mode === "edit";
        const onSuccess = () => {
            setDrawer(null);
            toast(isEdit ? `"${payload.name}" updated` : `"${payload.name}" added to inventory`);
        };
        // Errors surface via each mutation's onError toast; the drawer stays open.
        if (isEdit) {
            updateMutation.mutate({ id: drawer.id!, ...payload }, { onSuccess });
        } else {
            createMutation.mutate(payload, { onSuccess });
        }
    };

    const askDelete = (ids: string[]) => {
        if (!ids.length) return;
        const names = items.filter((it) => ids.indexOf(it.id) > -1).map((it) => it.name);
        setConfirm({
            ids,
            title: ids.length > 1 ? `Delete ${ids.length} items?` : "Delete item?",
            message:
                ids.length > 1
                    ? `This will permanently remove ${ids.length} items from inventory. This cannot be undone.`
                    : `"${names[0] || ""}" will be permanently removed from inventory.`,
        });
    };

    const confirmDelete = () => {
        if (!confirm) return;
        const ids = confirm.ids;
        const onSuccess = () => {
            setSelected((prev) => {
                const next = { ...prev };
                ids.forEach((id) => delete next[id]);
                return next;
            });
            invalidateList();
            toast(ids.length > 1 ? `${ids.length} items deleted` : "Item deleted", "muted");
        };
        const onError = (e: { message: string }) => toast(e.message, "danger");
        if (ids.length > 1) {
            bulkRemoveMutation.mutate({ ids }, { onSuccess, onError });
        } else {
            removeMutation.mutate({ id: ids[0] }, { onSuccess, onError });
        }
        setConfirm(null);
    };

    const exportCsv = () => {
        const rows = visibleItems;
        const head = ["SKU", "Name", "Description", "Unit", "Quantity", "Purchase Price", "Selling Price", "Status"];
        const esc = (v: unknown) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
        const lines = [head.map(esc).join(",")].concat(
            rows.map((r) =>
                [r.sku, r.name, r.description, r.unit, r.qty, r.purchase, r.selling, statusMeta(r).label]
                    .map(esc)
                    .join(","),
            ),
        );
        const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "singha-roy-inventory.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast(`Exported ${rows.length} items to CSV`);
    };

    // ── derived layout ─────────────────────────────────────────
    const gridCols = isAdmin
        ? "36px 132px minmax(190px,1.5fr) 200px 100px 100px 70px 76px"
        : "132px minmax(190px,1.5fr) 156px 110px 110px 78px";
    const minW = isAdmin ? "1040px" : "840px";

    const showTable = !loading && visibleItems.length > 0 && view === "table";
    const showCards = !loading && visibleItems.length > 0 && view === "card";
    const isEmpty = !loading && visibleItems.length === 0;
    const showBanner = !isAdmin;

    return (
        <div className="bg-paper min-h-screen">
            <AppHeader showNav={false} />

            <main className="mx-auto max-w-[1180px] px-7 pt-[34px] pb-[90px]">
                {/* Title */}
                <div className="mb-[26px] flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <div className="mb-2 flex items-center gap-2.5">
                            <span className="text-accent font-mono text-[10.5px] tracking-[0.16em]">STOCK LEDGER</span>
                        </div>
                        <h1 className="m-0 font-serif text-[42px] leading-[0.95] font-medium tracking-[-0.01em]">
                            Inventory
                        </h1>
                        <p className="text-ink-500 mt-2.5 font-mono text-[12px]">
                            {items.length} SKUs · {inr(totalValue)} in stock value · {lowCount + outCount} need
                            attention
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <Card variant="subtle" className="mb-[26px] grid grid-cols-4 overflow-hidden rounded-[4px]">
                    <StatCell label="Total SKUs" value={String(items.length)} />
                    <StatCell label="Stock Value" value={inr(totalValue)} tone="accent" />
                    <StatCell
                        label="Low Stock"
                        value={String(lowCount)}
                        tone="warn"
                        icon={<AlertTriangleIcon size={12} />}
                    />
                    <StatCell label="Out of Stock" value={String(outCount)} tone="danger" last />
                </Card>

                {/* Toolbar */}
                <div className="mb-[18px] flex flex-wrap items-center gap-2.5">
                    <div className="relative min-w-[220px] flex-[1_1_260px]">
                        <span className="text-ink-500 pointer-events-none absolute top-1/2 left-[13px] -translate-y-1/2">
                            <SearchIcon size={16} />
                        </span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setTimeout(() => setSearchFocused(false), 130)}
                            placeholder="Search by name or SKU…"
                            className="border-ink/[0.18] text-ink bg-surface w-full rounded-[3px] border py-[11px] pr-[38px] pl-10 text-[13.5px] outline-none"
                        />
                        {search.trim().length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setSearchFocused(false);
                                }}
                                className="text-ink-500 hover:text-ink absolute top-1/2 right-[9px] flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent transition-colors"
                            >
                                <CloseIcon size={14} />
                            </button>
                        )}
                        {suggestions.length > 0 && (
                            <div className="border-ink/20 bg-surface absolute top-[calc(100%+5px)] right-0 left-0 z-30 rounded-[3px] border p-[5px] shadow-[0_18px_40px_-20px_rgb(var(--shadow-rgb)/0.5)]">
                                {suggestions.map((sug) => (
                                    <button
                                        key={sug.id}
                                        type="button"
                                        onClick={() => {
                                            setSearch(sug.name);
                                            setSearchFocused(false);
                                        }}
                                        className="text-ink hover:bg-accent/[0.06] flex w-full cursor-pointer items-center gap-[11px] border-none bg-transparent px-[11px] py-[9px] text-left transition-colors"
                                    >
                                        <span className="text-accent flex-none font-mono text-[10.5px] font-semibold">
                                            {sug.sku}
                                        </span>
                                        <span className="flex-1 overflow-hidden text-[13px] font-medium text-ellipsis whitespace-nowrap">
                                            {sug.name}
                                        </span>
                                        <span className="text-ink-500 flex-none font-mono text-[11px]">
                                            {sug.qty} {sug.unit}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border-ink/[0.18] bg-surface inline-flex items-center overflow-hidden rounded-[3px] border">
                        <button onClick={() => setStatusFilter("all")} className={segClass(statusFilter === "all")}>
                            All
                        </button>
                        <button onClick={() => setStatusFilter("in")} className={segClass(statusFilter === "in")}>
                            In stock
                        </button>
                        <button onClick={() => setStatusFilter("low")} className={segClass(statusFilter === "low")}>
                            Low
                        </button>
                        <button
                            onClick={() => setStatusFilter("out")}
                            className={segClass(statusFilter === "out", true)}
                        >
                            Out
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative flex items-center">
                            <select
                                value={sortKey}
                                onChange={(e) => setSortKey(e.target.value as SortKey)}
                                className="border-ink/[0.18] text-ink bg-surface cursor-pointer appearance-none rounded-[3px] border py-2.5 pr-[30px] pl-3 text-[13px] font-medium outline-none"
                            >
                                <option value="name">Sort: Name</option>
                                <option value="sku">Sort: SKU</option>
                                <option value="qty">Sort: Quantity</option>
                                <option value="purchase">Sort: Purchase ₹</option>
                                <option value="selling">Sort: Selling ₹</option>
                            </select>
                            <span className="text-ink-500 pointer-events-none absolute right-2.5">
                                <ChevronDownIcon size={14} />
                            </span>
                        </div>
                        <button
                            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                            title="Toggle direction"
                            className="border-ink/[0.18] text-accent bg-surface flex size-[38px] cursor-pointer items-center justify-center rounded-[3px] border"
                        >
                            <ArrowDownIcon
                                size={16}
                                className={cn("transition-transform", sortDir === "desc" && "rotate-180")}
                            />
                        </button>
                    </div>

                    <div className="border-ink/[0.18] bg-surface inline-flex items-center overflow-hidden rounded-[3px] border">
                        <button
                            onClick={() => setView("table")}
                            title="Table view"
                            className={viewClass(view === "table")}
                        >
                            <TableIcon size={17} />
                        </button>
                        <button
                            onClick={() => setView("card")}
                            title="Card view"
                            className={viewClass(view === "card", true)}
                        >
                            <GridIcon size={17} />
                        </button>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={exportCsv}
                        className="border-ink/[0.22] bg-surface hover:border-ink hover:text-ink px-3.5 py-2.5"
                    >
                        <DownloadIcon size={15} />
                        Export
                    </Button>

                    {isAdmin && (
                        <Button variant="accent" onClick={openAdd} className="px-4 py-[11px] whitespace-nowrap">
                            <PlusIcon size={16} />
                            Add item
                        </Button>
                    )}
                </div>

                {showBanner && (
                    <div className="border-accent/25 bg-accent/[0.05] mb-[18px] flex items-center gap-[11px] rounded-[3px] border px-4 py-[13px]">
                        <span className="text-accent">
                            <InfoIcon size={17} />
                        </span>
                        <span className="text-ink-700 text-[13px]">
                            You&apos;re viewing in read-only mode. Stock editing is restricted to admin accounts — sign
                            in with an admin account to add, edit and adjust stock.
                        </span>
                    </div>
                )}

                {/* Listing */}
                <Card variant="subtle" className="overflow-hidden rounded-[4px]">
                    {loading && <LoadingSkeleton />}

                    {isEmpty && (
                        <div className="px-6 py-[60px] text-center">
                            <span className="text-ink-300 mb-3.5 inline-block">
                                <BoxIcon size={38} />
                            </span>
                            <div className="text-[15px] font-semibold">No items match your filters</div>
                            <div className="text-ink-500 mt-1.5 font-mono text-[12px]">
                                Try a different search term or clear the status filter.
                            </div>
                        </div>
                    )}

                    {showTable && (
                        <div className="overflow-x-auto">
                            <div
                                className="border-ink grid items-center gap-3 border-b-[1.5px] px-5 py-3.5"
                                style={{ gridTemplateColumns: gridCols, minWidth: minW }}
                            >
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="accent-accent size-[15px] cursor-pointer"
                                    />
                                )}
                                <div className={colHead}>SKU</div>
                                <div className={colHead}>Item</div>
                                <div className={colHead}>Stock</div>
                                <div className={cn(colHead, "text-right")}>Purchase</div>
                                <div className={cn(colHead, "text-right")}>Selling</div>
                                <div className={cn(colHead, "text-right")}>Margin</div>
                                {isAdmin && <div className={cn(colHead, "text-right")}>Actions</div>}
                            </div>
                            {visibleItems.map((it) => (
                                <TableRow
                                    key={it.id}
                                    item={it}
                                    isAdmin={isAdmin}
                                    gridCols={gridCols}
                                    minW={minW}
                                    selected={!!selected[it.id]}
                                    onToggle={() => toggleSelect(it.id)}
                                    onInc={() => adjustQty(it.id, 1)}
                                    onDec={() => adjustQty(it.id, -1)}
                                    onEdit={() => openEdit(it)}
                                    onDelete={() => askDelete([it.id])}
                                />
                            ))}
                        </div>
                    )}

                    {showCards && (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 p-[18px]">
                            {visibleItems.map((it) => (
                                <CardItem
                                    key={it.id}
                                    item={it}
                                    isAdmin={isAdmin}
                                    selected={!!selected[it.id]}
                                    onToggle={() => toggleSelect(it.id)}
                                    onInc={() => adjustQty(it.id, 1)}
                                    onDec={() => adjustQty(it.id, -1)}
                                    onEdit={() => openEdit(it)}
                                    onDelete={() => askDelete([it.id])}
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </main>

            {/* Bulk action bar */}
            {isAdmin && selectedCount > 0 && (
                <div className="border-ink bg-card fixed bottom-[26px] left-1/2 z-[45] flex -translate-x-1/2 animate-[toastIn_0.25s_ease] items-center gap-3.5 rounded-[4px] border-[1.5px] py-[11px] pr-3.5 pl-[18px] shadow-[0_18px_44px_-20px_rgb(var(--shadow-rgb)/0.6)]">
                    <span className="text-[13px] font-semibold">
                        <b className="text-accent">{selectedCount}</b> selected
                    </span>
                    <span className="bg-ink/[0.18] h-[22px] w-px" />
                    <button
                        type="button"
                        onClick={() => setSelected({})}
                        className="text-ink-700 cursor-pointer border-none bg-transparent px-3 py-[7px] text-[13px] font-semibold"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={() => askDelete(Object.keys(selected).filter((k) => selected[k]))}
                        className="border-danger/40 bg-danger/[0.08] text-danger inline-flex cursor-pointer items-center gap-[7px] rounded-[3px] border px-3.5 py-2 text-[13px] font-bold"
                    >
                        <TrashIcon size={14} />
                        Delete
                    </button>
                </div>
            )}

            {/* Add/Edit drawer */}
            {drawer && (
                <ItemDrawer
                    drawer={drawer}
                    saving={saving}
                    onChange={updateDraft}
                    onClose={() => setDrawer(null)}
                    onSave={saveDrawer}
                />
            )}

            {/* Delete confirmation */}
            {confirm && (
                <Modal
                    onClose={() => setConfirm(null)}
                    width="380px"
                    className="rounded-[4px] p-6 shadow-[0_24px_60px_-30px_rgb(var(--shadow-rgb)/0.6)]"
                >
                    <div className="border-danger/35 bg-danger/[0.08] text-danger mb-4 flex size-11 items-center justify-center rounded-[3px] border">
                        <TrashIcon size={22} />
                    </div>
                    <h3 className="mt-0 mb-[7px] font-serif text-[20px] font-semibold">{confirm.title}</h3>
                    <p className="text-ink-700 mt-0 mb-5 text-[13px] leading-[1.5]">{confirm.message}</p>
                    <div className="flex gap-[11px]">
                        <Button
                            variant="outline"
                            onClick={() => setConfirm(null)}
                            className="border-ink/20 hover:text-ink flex-1 p-[11px] hover:bg-transparent"
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="flex-1 p-[11px]">
                            Delete
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ── presentational sub-components ──────────────────────────────

function LoadingSkeleton() {
    const bar = (w: number | "auto", flex?: number): CSSProperties => ({
        height: 13,
        width: w,
        flex,
        background:
            "linear-gradient(90deg, color-mix(in srgb, var(--color-ink) 5%, transparent) 25%, color-mix(in srgb, var(--color-ink) 12%, transparent) 37%, color-mix(in srgb, var(--color-ink) 5%, transparent) 63%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.4s infinite",
    });
    return (
        <div className="py-1.5">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className={cn("flex gap-4 px-5 py-[15px]", i < 3 && "border-ink/[0.08] border-b")}>
                    <div style={bar(90)} />
                    <div style={bar("auto", 1)} />
                    <div style={bar(120)} />
                </div>
            ))}
        </div>
    );
}

const STATUS_TONE: Record<StatusMeta["key"], BadgeTone> = { out: "danger", low: "warn", in: "success" };

function StatusBadge({ m }: { m: StatusMeta }) {
    return (
        <Badge tone={STATUS_TONE[m.key]} dot>
            {m.label}
        </Badge>
    );
}

function marginParts(it: InventoryItem) {
    const margin = it.purchase > 0 ? ((it.selling - it.purchase) / it.purchase) * 100 : 0;
    const colorClass = margin >= 20 ? "text-success" : margin > 0 ? "text-accent" : "text-danger";
    return { label: (margin >= 0 ? "+" : "") + margin.toFixed(0) + "%", colorClass };
}

function qtyTextClass(m: StatusMeta): string {
    return cn(
        "min-w-[40px] px-1 text-center font-mono text-[12.5px] font-bold",
        m.key === "out" ? "text-danger" : m.key === "low" ? "text-warn" : "text-ink",
    );
}

interface RowActions {
    item: InventoryItem;
    isAdmin: boolean;
    selected: boolean;
    onToggle: () => void;
    onInc: () => void;
    onDec: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

function TableRow({
    item,
    isAdmin,
    gridCols,
    minW,
    selected,
    onToggle,
    onInc,
    onDec,
    onEdit,
    onDelete,
}: RowActions & { gridCols: string; minW: string }) {
    const m = statusMeta(item);
    const margin = marginParts(item);
    return (
        <div
            className={cn(
                "border-ink/[0.09] grid items-center gap-3 border-b px-5 py-[13px] transition-colors",
                selected ? "bg-accent/[0.05]" : "hover:bg-accent/[0.025]",
            )}
            style={{ gridTemplateColumns: gridCols, minWidth: minW }}
        >
            {isAdmin && (
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onToggle}
                    className="accent-accent size-[15px] cursor-pointer"
                />
            )}
            <div>
                <span className="bg-accent/[0.07] text-accent rounded-[2px] px-[7px] py-[3px] font-mono text-[11px] font-semibold">
                    {item.sku}
                </span>
            </div>
            <div className="min-w-0">
                <div className="overflow-hidden text-[13.5px] font-semibold text-ellipsis whitespace-nowrap">
                    {item.name}
                </div>
                <div className="text-ink-500 mt-px overflow-hidden text-[11.5px] text-ellipsis whitespace-nowrap">
                    {item.description || "—"}
                </div>
            </div>
            <div className="flex items-center gap-[9px]">
                {isAdmin ? (
                    <>
                        <div className="border-ink/[0.18] bg-surface inline-flex items-center rounded-[3px] border">
                            <button
                                type="button"
                                onClick={onDec}
                                title="Stock out"
                                className="border-ink/[0.12] text-ink-500 hover:bg-danger/10 hover:text-danger flex h-[22px] w-6 cursor-pointer items-center justify-center border-r border-none bg-transparent transition-colors"
                            >
                                <MinusIcon size={13} />
                            </button>
                            <span className={qtyTextClass(m)}>{fmt.format(item.qty)}</span>
                            <button
                                type="button"
                                onClick={onInc}
                                title="Stock in"
                                className="border-ink/[0.12] text-ink-500 hover:bg-success/10 hover:text-success flex h-[22px] w-6 cursor-pointer items-center justify-center border-l border-none bg-transparent transition-colors"
                            >
                                <PlusIcon size={13} />
                            </button>
                        </div>
                        <span className="text-ink-500 text-[11px]">{item.unit}</span>
                    </>
                ) : (
                    <span className={qtyTextClass(m)}>
                        {fmt.format(item.qty)} {item.unit}
                    </span>
                )}
                <StatusBadge m={m} />
            </div>
            <div className="text-ink-700 text-right font-mono text-[12.5px]">{inr(item.purchase)}</div>
            <div className="text-right font-mono text-[12.5px] font-semibold">{inr(item.selling)}</div>
            <div className="text-right">
                <span className={cn("font-mono text-[12px] font-semibold", margin.colorClass)}>{margin.label}</span>
            </div>
            {isAdmin && (
                <div className="flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        title="Edit"
                        className="text-ink-500 hover:text-accent flex size-7 cursor-pointer items-center justify-center border-none bg-transparent transition-colors"
                    >
                        <PencilIcon size={15} />
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        title="Delete"
                        className="text-ink-500 hover:text-danger flex size-7 cursor-pointer items-center justify-center border-none bg-transparent transition-colors"
                    >
                        <TrashIcon size={15} />
                    </button>
                </div>
            )}
        </div>
    );
}

function CardItem({ item, isAdmin, selected, onToggle, onInc, onDec, onEdit, onDelete }: RowActions) {
    const m = statusMeta(item);
    const margin = marginParts(item);
    return (
        <div
            className={cn(
                "bg-surface rounded-[3px] border p-4 transition-colors",
                selected ? "border-accent" : "border-ink/[0.14] hover:border-ink/30",
            )}
        >
            <div className="mb-[11px] flex items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-[9px]">
                    {isAdmin && (
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={onToggle}
                            className="accent-accent size-[14px] flex-none cursor-pointer"
                        />
                    )}
                    <span className="bg-accent/[0.07] text-accent rounded-[2px] px-[7px] py-[3px] font-mono text-[10.5px] font-semibold">
                        {item.sku}
                    </span>
                </div>
                <StatusBadge m={m} />
            </div>
            <div className="text-[15px] leading-[1.3] font-bold">{item.name}</div>
            <div className="text-ink-500 mt-1 h-[34px] overflow-hidden text-[12px] leading-[1.45]">
                {item.description || "—"}
            </div>
            <div className="border-ink/[0.12] my-3.5 flex overflow-hidden rounded-[3px] border">
                <div className="border-ink/10 flex-1 border-r px-3 py-2.5">
                    <div className="text-ink-500 font-mono text-[9px] tracking-[0.06em] uppercase">Purchase</div>
                    <div className="text-ink-700 mt-[3px] font-mono text-[13px]">{inr(item.purchase)}</div>
                </div>
                <div className="border-ink/10 flex-1 border-r px-3 py-2.5">
                    <div className="text-ink-500 font-mono text-[9px] tracking-[0.06em] uppercase">Selling</div>
                    <div className="mt-[3px] font-mono text-[13px] font-bold">{inr(item.selling)}</div>
                </div>
                <div className="flex-none px-3 py-2.5 text-right">
                    <div className="text-ink-500 font-mono text-[9px] tracking-[0.06em] uppercase">Margin</div>
                    <div className={cn("mt-[3px] font-mono text-[12px] font-semibold", margin.colorClass)}>
                        {margin.label}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                    {isAdmin ? (
                        <>
                            <div className="border-ink/[0.18] bg-surface inline-flex items-center rounded-[3px] border">
                                <button
                                    type="button"
                                    onClick={onDec}
                                    className="border-ink/[0.12] text-ink-500 hover:bg-danger/10 hover:text-danger flex h-6 w-[26px] cursor-pointer items-center justify-center border-r border-none bg-transparent transition-colors"
                                >
                                    <MinusIcon size={13} />
                                </button>
                                <span className={qtyTextClass(m)}>{fmt.format(item.qty)}</span>
                                <button
                                    type="button"
                                    onClick={onInc}
                                    className="border-ink/[0.12] text-ink-500 hover:bg-success/10 hover:text-success flex h-6 w-[26px] cursor-pointer items-center justify-center border-l border-none bg-transparent transition-colors"
                                >
                                    <PlusIcon size={13} />
                                </button>
                            </div>
                            <span className="text-ink-500 text-[11.5px]">{item.unit}</span>
                        </>
                    ) : (
                        <span className={qtyTextClass(m)}>
                            {fmt.format(item.qty)} {item.unit}
                        </span>
                    )}
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onEdit}
                            title="Edit"
                            className="border-ink/15 text-ink-500 hover:border-accent hover:text-accent flex size-[30px] cursor-pointer items-center justify-center rounded-[3px] border bg-transparent transition-colors"
                        >
                            <PencilIcon size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            title="Delete"
                            className="border-ink/15 text-ink-500 hover:border-danger hover:text-danger flex size-[30px] cursor-pointer items-center justify-center rounded-[3px] border bg-transparent transition-colors"
                        >
                            <TrashIcon size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ItemDrawer({
    drawer,
    saving,
    onChange,
    onClose,
    onSave,
}: {
    drawer: DrawerState;
    saving: boolean;
    onChange: (k: keyof Draft, v: string) => void;
    onClose: () => void;
    onSave: () => void;
}) {
    const d = drawer.draft;
    return (
        <Drawer
            onClose={onClose}
            title={drawer.mode === "edit" ? "Edit item" : "Add new item"}
            footer={
                <>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-ink/20 hover:text-ink flex-1 p-3 hover:bg-transparent"
                    >
                        Cancel
                    </Button>
                    <Button variant="accent" onClick={onSave} disabled={saving} className="flex-[2] p-3">
                        {saving && <SpinnerIcon size={15} className="animate-spin" />}
                        {drawer.mode === "edit" ? "Save changes" : "Add item"}
                    </Button>
                </>
            }
        >
            <div className="grid grid-cols-2 gap-3.5">
                <div>
                    <FieldLabel className="mb-[7px]">SKU / Code</FieldLabel>
                    <TextInput
                        mono
                        value={d.sku}
                        onChange={(e) => onChange("sku", e.target.value)}
                        placeholder="CEM-OPC53"
                    />
                </div>
                <div>
                    <FieldLabel className="mb-[7px]">Unit</FieldLabel>
                    <select
                        className="led-in cursor-pointer"
                        value={d.unit}
                        onChange={(e) => onChange("unit", e.target.value)}
                    >
                        {UNITS.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <FieldLabel className="mb-[7px]">Item name</FieldLabel>
                <TextInput
                    value={d.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="Ambuja OPC 53 Grade Cement"
                />
            </div>
            <div>
                <FieldLabel className="mb-[7px]">Description</FieldLabel>
                <textarea
                    className="led-in resize-y leading-[1.45]"
                    value={d.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    rows={2}
                    placeholder="Short description…"
                />
            </div>
            <div className="bg-ink/[0.12] h-px" />
            <div className="grid grid-cols-2 gap-3.5">
                <div>
                    <FieldLabel className="mb-[7px]">Quantity</FieldLabel>
                    <TextInput
                        mono
                        type="number"
                        value={d.qty}
                        onChange={(e) => onChange("qty", e.target.value)}
                        placeholder="0"
                    />
                </div>
                <div>
                    <FieldLabel className="mb-[7px]">Low-stock at</FieldLabel>
                    <TextInput
                        mono
                        type="number"
                        value={d.reorder}
                        onChange={(e) => onChange("reorder", e.target.value)}
                        placeholder="20"
                    />
                </div>
                <div>
                    <FieldLabel className="mb-[7px]">Purchase ₹</FieldLabel>
                    <TextInput
                        mono
                        type="number"
                        value={d.purchase}
                        onChange={(e) => onChange("purchase", e.target.value)}
                        placeholder="0"
                    />
                </div>
                <div>
                    <FieldLabel className="mb-[7px]">Selling ₹</FieldLabel>
                    <TextInput
                        mono
                        type="number"
                        value={d.selling}
                        onChange={(e) => onChange("selling", e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>
        </Drawer>
    );
}
