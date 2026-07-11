"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { BillItem, BillData, BusinessDetails, CustomerDetails } from "@/types/bill";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useVersionedFormStorage } from "@/hooks/use-versioned-form-storage";
import { useBillCalculations } from "@/hooks/use-bill-calculations";
import {
    DEFAULT_BUSINESS_DETAILS,
    DEFAULT_CGST_PERCENT,
    DEFAULT_SGST_PERCENT,
    INDIAN_STATES,
    STORAGE_KEY_BUSINESS_DETAILS,
    STORAGE_KEY_FORM_DATA,
} from "@/constants/defaults";
import { packageJSON } from "@/utils/package-json";
import { validateBillData, hasErrors, type DocumentType, type FieldErrors } from "@/lib/pdf-generator";
import { formatAmountInWords } from "@/lib/number-to-words";
import { useSession } from "@/auth/session";
import { useToast } from "@/ui/toast";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { TextInput } from "@/ui/text-input";
import { FieldLabel } from "@/ui/field";
import { SectionLabel } from "@/ui/section-label";
import {
    SignInIcon,
    LockIcon,
    PencilIcon,
    ListIcon,
    ChevronDownIcon,
    PlusIcon,
    CloseIcon,
    DownloadIcon,
} from "@/ui/icons";

const emptyCustomerDetails: CustomerDetails = {
    name: "",
    address: { line1: "", line2: "", city: "", pin: "", state: "" },
    phone: "",
    gstNo: "",
};

interface FormData {
    invoiceNumber: string;
    dateString: string;
    customerDetails: CustomerDetails;
    items: BillItem[];
}

function getTodayDateString(): string {
    return new Date().toISOString().split("T")[0];
}

function createEmptyItem(): BillItem {
    return {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        description: "",
        hsnSac: "",
        quantity: 1,
        rate: null,
        cgstPercent: DEFAULT_CGST_PERCENT,
        sgstPercent: DEFAULT_SGST_PERCENT,
    };
}

const defaultFormData: FormData = {
    invoiceNumber: "",
    dateString: getTodayDateString(),
    customerDetails: emptyCustomerDetails,
    items: [createEmptyItem()],
};

function inr2(n: number): string {
    return "₹" + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/** Parse a numeric text input into number | null (empty/invalid → null). */
function parseNum(v: string): number | null {
    if (v.trim() === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
}

const ITEM_COLS = "grid-cols-[26px_minmax(150px,1.5fr)_72px_52px_76px_90px_46px_80px_46px_80px_94px_26px]";

const monoCell = "px-2 py-[9px] text-right font-mono text-[12.5px] text-ink-700";

export default function InvoiceClient() {
    const { isAdmin, openAuth } = useSession();

    if (!isAdmin) return <RestrictedView openAuth={openAuth} />;
    return <InvoiceGenerator />;
}

function RestrictedView({ openAuth }: { openAuth: () => void }) {
    return (
        <div className="bg-paper min-h-screen">
            <AppHeader />
            <main className="mx-auto max-w-[1080px] px-7 pt-[34px] pb-[90px]">
                <Card
                    variant="solid"
                    className="mx-auto my-6 max-w-[560px] px-10 py-14 text-center shadow-[0_26px_60px_-38px_rgb(var(--shadow-rgb)/0.5)]"
                >
                    <div className="border-ink mx-auto mb-[22px] flex size-[52px] items-center justify-center rounded-[4px] border-[1.5px]">
                        <LockIcon size={24} />
                    </div>
                    <div className="text-danger mb-3 font-mono text-[10.5px] tracking-[0.16em]">
                        RESTRICTED · ADMIN ONLY
                    </div>
                    <h1 className="m-0 font-serif text-[30px] font-semibold">Invoice generator is admin-only</h1>
                    <p className="text-ink-700 mx-auto mt-3.5 mb-[26px] max-w-[410px] text-[14px] leading-[1.55]">
                        Creating GST invoices is restricted to admin accounts. Sign in with an admin account to
                        continue, or head back to the inventory ledger.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Button variant="primary" onClick={openAuth} className="gap-[9px]">
                            <SignInIcon size={15} />
                            Sign in
                        </Button>
                        <Link
                            href="/inventory"
                            className="border-ink text-ink hover:bg-ink hover:text-cream inline-flex items-center gap-2 rounded-[3px] border-[1.5px] bg-transparent px-[22px] py-[13px] text-[13px] font-semibold no-underline transition-colors"
                        >
                            View inventory
                        </Link>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function InvoiceGenerator() {
    const { toast } = useToast();

    const [businessDetails, setBusinessDetails] = useLocalStorage<BusinessDetails>(
        STORAGE_KEY_BUSINESS_DETAILS,
        DEFAULT_BUSINESS_DETAILS,
    );
    const [editingBusiness, setEditingBusiness] = useState(false);

    const [formData, setFormData] = useVersionedFormStorage<FormData>(
        STORAGE_KEY_FORM_DATA,
        packageJSON.version,
        defaultFormData,
    );
    const { invoiceNumber, dateString, customerDetails, items } = formData;

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const clearError = useCallback((...keys: string[]) => {
        setFieldErrors((prev) => {
            const next = { ...prev };
            keys.forEach((k) => delete next[k]);
            return next;
        });
    }, []);

    const { calculatedItems, totals } = useBillCalculations(items);

    const billData: BillData = useMemo(
        () => ({
            invoiceNumber,
            date: new Date(dateString),
            businessDetails,
            customerDetails,
            items: calculatedItems,
            totals,
        }),
        [invoiceNumber, dateString, businessDetails, customerDetails, calculatedItems, totals],
    );

    // ── field setters ──────────────────────────────────────────
    const setInvoiceNumber = (v: string) => {
        setFormData((prev) => ({ ...prev, invoiceNumber: v }));
        clearError("invoiceNumber");
    };
    const setDateString = (v: string) => setFormData((prev) => ({ ...prev, dateString: v }));

    const updateCustomer = (patch: Partial<CustomerDetails>) => {
        setFormData((prev) => ({ ...prev, customerDetails: { ...prev.customerDetails, ...patch } }));
        clearError("customerName", "customerAddress1", "customerCity", "customerState");
    };
    const updateCustomerAddress = (patch: Partial<CustomerDetails["address"]>) => {
        setFormData((prev) => ({
            ...prev,
            customerDetails: { ...prev.customerDetails, address: { ...prev.customerDetails.address, ...patch } },
        }));
        clearError("customerName", "customerAddress1", "customerCity", "customerState");
    };

    const updateItem = (id: string, patch: Partial<BillItem>) => {
        setFormData((prev) => ({ ...prev, items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
        clearError("billItems");
    };
    const addRow = () => setFormData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
    const removeRow = (id: string) =>
        setFormData((prev) => ({
            ...prev,
            items: prev.items.length > 1 ? prev.items.filter((it) => it.id !== id) : prev.items,
        }));

    // ── business editing ───────────────────────────────────────
    const updateBusiness = (patch: Partial<BusinessDetails>) => setBusinessDetails((prev) => ({ ...prev, ...patch }));
    const updateBusinessAddress = (patch: Partial<BusinessDetails["address"]>) =>
        setBusinessDetails((prev) => ({ ...prev, address: { ...prev.address, ...patch } }));
    const toggleBusiness = () => {
        if (editingBusiness) toast("Business details saved");
        setEditingBusiness((v) => !v);
    };

    // ── reverse GST calculator ─────────────────────────────────
    const [reverse, setReverse] = useState({ total: "", cgst: "9", sgst: "9" });
    const [showReverse, setShowReverse] = useState(false);
    const rev = useMemo(() => {
        const t = parseFloat(reverse.total) || 0;
        const cg = parseFloat(reverse.cgst) || 0;
        const sg = parseFloat(reverse.sgst) || 0;
        const taxable = t / (1 + (cg + sg) / 100);
        return { taxable: taxable || 0, cgst: (taxable * cg) / 100 || 0, sgst: (taxable * sg) / 100 || 0 };
    }, [reverse]);

    // ── PDF generation ─────────────────────────────────────────
    const handleGenerate = async (type: DocumentType) => {
        const errors = validateBillData(billData);
        if (hasErrors(errors)) {
            setFieldErrors(errors);
            toast("Please fix the highlighted fields", "danger");
            return;
        }
        setFieldErrors({});
        // Loaded lazily so the pdf-lib drawing code is bundled only into a
        // browser chunk, never the Cloudflare Worker server bundle.
        const { generatePDF } = await import("@/lib/pdf-download");
        await generatePDF(billData, type);
        toast(
            type === "credit-note" ? "Credit note generated" : `Invoice ${invoiceNumber} generated`,
            type === "credit-note" ? "muted" : "success",
        );
    };

    const ledClass = (err?: boolean) => (err ? "led-in invalid" : "led-in");

    return (
        <div className="bg-paper min-h-screen">
            <AppHeader />

            <main className="mx-auto max-w-[1080px] px-7 pt-[34px] pb-[90px]">
                <Card
                    variant="subtle"
                    className="overflow-hidden shadow-[0_1px_0_rgb(var(--shadow-rgb)/0.04),0_26px_60px_-38px_rgb(var(--shadow-rgb)/0.5)]"
                >
                    {/* FROM + invoice meta */}
                    <div className="border-ink flex flex-wrap justify-between gap-[30px] border-b-[1.5px] px-[38px] pt-[34px] pb-7">
                        <div className="min-w-0 flex-[1_1_320px]">
                            <div className="mb-2.5 flex items-center gap-2.5">
                                <span className="text-accent font-mono text-[10.5px] tracking-[0.16em]">FROM</span>
                                <button
                                    type="button"
                                    onClick={toggleBusiness}
                                    className="border-ink/20 text-ink-700 hover:border-ink inline-flex cursor-pointer items-center gap-[5px] rounded-[3px] border bg-transparent px-2 py-[3px] text-[10.5px] font-semibold transition-colors"
                                >
                                    <PencilIcon size={11} />
                                    {editingBusiness ? "Done" : "Edit"}
                                </button>
                            </div>
                            {!editingBusiness ? (
                                <div>
                                    <div className="font-serif text-[26px] leading-[1.1] font-semibold tracking-[-0.01em]">
                                        {businessDetails.name}
                                    </div>
                                    <div className="text-ink-700 mt-2.5 font-mono text-[11.5px] leading-[1.7]">
                                        <div>{businessDetails.address.line1}</div>
                                        {businessDetails.address.line2 && <div>{businessDetails.address.line2}</div>}
                                        <div>{`${businessDetails.address.city} - ${businessDetails.address.pin}, ${businessDetails.address.state}`}</div>
                                        <div className="mt-1.5">☎ {businessDetails.phones.join(", ")}</div>
                                        <div>✉ {businessDetails.email}</div>
                                        <div className="border-ink/25 mt-1.5 inline-block border px-[7px] py-0.5">
                                            GSTIN · {businessDetails.gstNo}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex max-w-[420px] flex-col gap-[9px]">
                                    <TextInput
                                        value={businessDetails.name}
                                        onChange={(e) => updateBusiness({ name: e.target.value })}
                                        placeholder="Business name"
                                    />
                                    <TextInput
                                        value={businessDetails.address.line1}
                                        onChange={(e) => updateBusinessAddress({ line1: e.target.value })}
                                        placeholder="Address line 1"
                                    />
                                    <TextInput
                                        value={businessDetails.address.line2 || ""}
                                        onChange={(e) => updateBusinessAddress({ line2: e.target.value })}
                                        placeholder="Address line 2"
                                    />
                                    <div className="flex gap-[9px]">
                                        <TextInput
                                            value={businessDetails.address.city}
                                            onChange={(e) => updateBusinessAddress({ city: e.target.value })}
                                            placeholder="City"
                                        />
                                        <TextInput
                                            mono
                                            value={businessDetails.address.pin}
                                            onChange={(e) => updateBusinessAddress({ pin: e.target.value })}
                                            placeholder="PIN"
                                        />
                                        <TextInput
                                            value={businessDetails.address.state}
                                            onChange={(e) => updateBusinessAddress({ state: e.target.value })}
                                            placeholder="State"
                                        />
                                    </div>
                                    <div className="flex gap-[9px]">
                                        <TextInput
                                            value={businessDetails.phones.join(", ")}
                                            onChange={(e) =>
                                                updateBusiness({
                                                    phones: e.target.value
                                                        .split(",")
                                                        .map((p) => p.trim())
                                                        .filter(Boolean),
                                                })
                                            }
                                            placeholder="Phone(s)"
                                        />
                                        <TextInput
                                            value={businessDetails.email}
                                            onChange={(e) => updateBusiness({ email: e.target.value })}
                                            placeholder="Email"
                                        />
                                    </div>
                                    <TextInput
                                        mono
                                        value={businessDetails.gstNo}
                                        onChange={(e) => updateBusiness({ gstNo: e.target.value })}
                                        placeholder="GSTIN"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex-none text-right">
                            <div className="font-serif text-[40px] leading-[0.9] font-medium tracking-[0.01em]">
                                Tax Invoice
                            </div>
                            <div className="mt-5 flex flex-col items-end gap-3">
                                <div className="text-right">
                                    <div className="text-ink-500 mb-[5px] font-mono text-[10px] tracking-[0.14em]">
                                        INVOICE NO.
                                    </div>
                                    <TextInput
                                        mono
                                        invalid={!!fieldErrors.invoiceNumber}
                                        className="w-[220px] text-right text-[13px]"
                                        value={invoiceNumber}
                                        onChange={(e) => setInvoiceNumber(e.target.value)}
                                        placeholder="SRE/2026-27/0000"
                                    />
                                </div>
                                <div className="text-right">
                                    <div className="text-ink-500 mb-[5px] font-mono text-[10px] tracking-[0.14em]">
                                        DATE
                                    </div>
                                    <TextInput
                                        mono
                                        className="w-[220px] text-[13px]"
                                        type="date"
                                        value={dateString}
                                        onChange={(e) => setDateString(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="border-ink/[0.14] border-b px-[38px] py-7">
                        <SectionLabel n="01" title="Bill To" />
                        <div className="grid grid-cols-2 gap-x-[18px] gap-y-[15px]">
                            <div className="col-span-2">
                                <FieldLabel>Customer Name</FieldLabel>
                                <TextInput
                                    invalid={!!fieldErrors.customerName}
                                    value={customerDetails.name}
                                    onChange={(e) => updateCustomer({ name: e.target.value })}
                                    placeholder="Customer / firm name"
                                />
                            </div>
                            <div className="col-span-2">
                                <FieldLabel>Address</FieldLabel>
                                <TextInput
                                    invalid={!!fieldErrors.customerAddress1}
                                    className="mb-[9px]"
                                    value={customerDetails.address.line1}
                                    onChange={(e) => updateCustomerAddress({ line1: e.target.value })}
                                    placeholder="Street address, building name"
                                />
                                <TextInput
                                    value={customerDetails.address.line2 || ""}
                                    onChange={(e) => updateCustomerAddress({ line2: e.target.value })}
                                    placeholder="Area, landmark (optional)"
                                />
                            </div>
                            <div>
                                <FieldLabel>City</FieldLabel>
                                <TextInput
                                    invalid={!!fieldErrors.customerCity}
                                    value={customerDetails.address.city}
                                    onChange={(e) => updateCustomerAddress({ city: e.target.value })}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <FieldLabel>PIN Code</FieldLabel>
                                <TextInput
                                    mono
                                    value={customerDetails.address.pin}
                                    onChange={(e) => updateCustomerAddress({ pin: e.target.value })}
                                    placeholder="6-digit PIN"
                                />
                            </div>
                            <div>
                                <FieldLabel>State</FieldLabel>
                                <select
                                    className={cn(ledClass(!!fieldErrors.customerState), "cursor-pointer")}
                                    value={customerDetails.address.state}
                                    onChange={(e) => updateCustomerAddress({ state: e.target.value })}
                                >
                                    <option value="">Select state</option>
                                    {INDIAN_STATES.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <FieldLabel>Phone</FieldLabel>
                                <TextInput
                                    mono
                                    value={customerDetails.phone || ""}
                                    onChange={(e) => updateCustomer({ phone: e.target.value })}
                                    placeholder="10-digit mobile"
                                />
                            </div>
                            <div className="col-span-2">
                                <FieldLabel>
                                    GSTIN <span className="text-ink-300">(optional)</span>
                                </FieldLabel>
                                <TextInput
                                    mono
                                    value={customerDetails.gstNo || ""}
                                    onChange={(e) => updateCustomer({ gstNo: e.target.value })}
                                    placeholder="15-character GSTIN"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reverse GST calculator */}
                    <div className="border-ink/[0.14] border-b px-[38px] py-[22px]">
                        <button
                            type="button"
                            onClick={() => setShowReverse((v) => !v)}
                            className="border-ink/30 text-ink hover:border-accent hover:text-accent flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-[3px] border border-dashed bg-transparent px-4 py-3 text-[12.5px] font-semibold transition-colors"
                        >
                            <span className="inline-flex items-center gap-[9px]">
                                <ListIcon size={15} />
                                Reverse GST Calculator
                            </span>
                            <ChevronDownIcon
                                size={14}
                                className={cn("transition-transform", showReverse && "rotate-180")}
                            />
                        </button>
                        {showReverse && (
                            <div className="border-ink/[0.16] bg-surface mt-3.5 rounded-[3px] border p-[18px]">
                                <div className="grid grid-cols-[2fr_1fr_1fr] items-end gap-3.5">
                                    <div>
                                        <label className="text-ink-500 mb-1.5 block text-[10px] font-semibold tracking-[0.12em] uppercase">
                                            Total bill (incl. GST)
                                        </label>
                                        <TextInput
                                            mono
                                            value={reverse.total}
                                            onChange={(e) => setReverse((r) => ({ ...r, total: e.target.value }))}
                                            placeholder="e.g. 11800"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-ink-500 mb-1.5 block text-[10px] font-semibold tracking-[0.12em] uppercase">
                                            CGST %
                                        </label>
                                        <TextInput
                                            mono
                                            value={reverse.cgst}
                                            onChange={(e) => setReverse((r) => ({ ...r, cgst: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-ink-500 mb-1.5 block text-[10px] font-semibold tracking-[0.12em] uppercase">
                                            SGST %
                                        </label>
                                        <TextInput
                                            mono
                                            value={reverse.sgst}
                                            onChange={(e) => setReverse((r) => ({ ...r, sgst: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="border-ink/[0.18] mt-4 flex gap-[30px] border-t border-dashed pt-3.5 font-mono">
                                    <RevOut label="TAXABLE" value={inr2(rev.taxable)} />
                                    <RevOut label="CGST" value={inr2(rev.cgst)} />
                                    <RevOut label="SGST" value={inr2(rev.sgst)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bill Items */}
                    <div className="px-[38px] pt-7">
                        <SectionLabel n="02" title="Bill Items" />
                    </div>
                    <div className="overflow-x-auto px-[38px]">
                        <div className="min-w-[960px]">
                            <div
                                className={cn(
                                    "border-ink text-ink-500 grid gap-1.5 border-b-[1.5px] pb-2.5 font-mono text-[9.5px] font-semibold tracking-[0.06em] uppercase",
                                    ITEM_COLS,
                                )}
                            >
                                <div className="text-center">#</div>
                                <div>Description of goods</div>
                                <div>HSN/SAC</div>
                                <div className="text-right">Qty</div>
                                <div className="text-right">Rate</div>
                                <div className="text-right">Taxable</div>
                                <div className="text-right">CG%</div>
                                <div className="text-right">CGST</div>
                                <div className="text-right">SG%</div>
                                <div className="text-right">SGST</div>
                                <div className="text-right">Amount</div>
                                <div />
                            </div>
                            {calculatedItems.map((it, i) => (
                                <div
                                    key={it.id}
                                    className={cn("border-ink/10 grid items-center gap-1.5 border-b", ITEM_COLS)}
                                >
                                    <div className="text-ink-300 text-center font-mono text-[11px]">{i + 1}</div>
                                    <input
                                        className="cell-in text-left font-sans text-[13px]"
                                        value={it.description}
                                        onChange={(e) => updateItem(it.id, { description: e.target.value })}
                                        placeholder="Item description"
                                    />
                                    <input
                                        className="cell-in text-left"
                                        value={it.hsnSac}
                                        onChange={(e) => updateItem(it.id, { hsnSac: e.target.value })}
                                        placeholder="—"
                                    />
                                    <input
                                        className="cell-in"
                                        value={it.quantity ?? ""}
                                        onChange={(e) => updateItem(it.id, { quantity: parseNum(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <input
                                        className="cell-in"
                                        value={it.rate ?? ""}
                                        onChange={(e) => updateItem(it.id, { rate: parseNum(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <div className={monoCell}>{inr2(it.taxableValue)}</div>
                                    <input
                                        className="cell-in"
                                        value={it.cgstPercent ?? ""}
                                        onChange={(e) => updateItem(it.id, { cgstPercent: parseNum(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <div className={monoCell}>{inr2(it.cgstAmount)}</div>
                                    <input
                                        className="cell-in"
                                        value={it.sgstPercent ?? ""}
                                        onChange={(e) => updateItem(it.id, { sgstPercent: parseNum(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <div className={monoCell}>{inr2(it.sgstAmount)}</div>
                                    <div className="text-ink px-2 py-[9px] text-right font-mono text-[12.5px] font-semibold">
                                        {inr2(it.totalAmount)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(it.id)}
                                        title="Remove"
                                        className="text-ink-300 hover:text-danger flex size-6 cursor-pointer items-center justify-center justify-self-center border-none bg-transparent transition-colors"
                                    >
                                        <CloseIcon size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-[38px] pt-3.5">
                        <Button variant="ghost" size="sm" onClick={addRow}>
                            <PlusIcon size={15} />
                            Add row
                        </Button>
                    </div>
                    {fieldErrors.billItems && (
                        <div className="text-danger px-[38px] pt-3 text-[12.5px]">{fieldErrors.billItems}</div>
                    )}

                    {/* Totals */}
                    <div className="flex flex-wrap items-end justify-between gap-[30px] px-[38px] pt-[30px] pb-9">
                        <div className="max-w-[420px] flex-[1_1_280px]">
                            <div className="text-ink-500 mb-1.5 font-mono text-[10px] tracking-[0.12em]">
                                AMOUNT IN WORDS
                            </div>
                            <div className="text-ink font-serif text-[16px] leading-[1.4] italic">
                                {formatAmountInWords(totals.grandTotal)}
                            </div>
                        </div>
                        <div className="w-[330px] max-w-full flex-none">
                            <TotalRow label="Total Taxable Value" value={inr2(totals.totalTaxableValue)} />
                            <TotalRow label="Total CGST" value={inr2(totals.totalCgst)} />
                            <TotalRow label="Total SGST" value={inr2(totals.totalSgst)} thick />
                            <div className="flex items-baseline justify-between pt-3.5">
                                <span className="text-[12px] font-semibold tracking-[0.12em] uppercase">
                                    Grand Total
                                </span>
                                <span className="font-serif text-[34px] font-semibold tracking-[-0.01em]">
                                    {inr2(totals.grandTotal)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="border-ink flex flex-wrap justify-end gap-3 border-t-[1.5px] px-[38px] py-[22px]">
                        <Button variant="outline" onClick={() => handleGenerate("credit-note")}>
                            <DownloadIcon size={16} />
                            Credit Note
                        </Button>
                        <Button variant="accent" onClick={() => handleGenerate("invoice")} className="px-[26px]">
                            <DownloadIcon size={16} />
                            Download Invoice
                        </Button>
                    </div>
                </Card>
            </main>
        </div>
    );
}

function RevOut({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-ink-500 text-[10px] tracking-[0.1em]">{label}</div>
            <div className="mt-[3px] text-[16px] font-semibold">{value}</div>
        </div>
    );
}

function TotalRow({ label, value, thick }: { label: string; value: string; thick?: boolean }) {
    return (
        <div
            className={cn(
                "flex justify-between py-[9px] font-mono text-[13px]",
                thick ? "border-ink border-b-[1.5px]" : "border-ink/[0.12] border-b",
            )}
        >
            <span className="text-ink-700">{label}</span>
            <span>{value}</span>
        </div>
    );
}
