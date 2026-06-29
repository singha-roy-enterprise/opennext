/**
 * Address format for India
 */
export interface Address {
    line1: string;
    line2?: string;
    city: string;
    pin: string;
    state: string;
}

/**
 * Business details for SINGHA ROY ENTERPRISE
 */
export interface BusinessDetails {
    name: string;
    phones: string[];
    email: string;
    gstNo: string;
    address: Address;
}

/**
 * Customer information for the bill
 */
export interface CustomerDetails {
    name: string;
    address: Address;
    phone?: string;
    gstNo?: string;
}

/**
 * Single item/row in the bill table
 */
export interface BillItem {
    id: string;
    description: string;
    hsnSac: string;
    quantity: number | null;
    rate: number | null;
    cgstPercent: number | null;
    sgstPercent: number | null;
}

/**
 * Calculated values for a bill item row
 */
export interface BillItemCalculated extends BillItem {
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    totalAmount: number;
}

/**
 * Bill totals
 */
export interface BillTotals {
    totalTaxableValue: number;
    totalCgst: number;
    totalSgst: number;
    grandTotal: number;
}

/**
 * Complete bill data for PDF generation
 */
export interface BillData {
    invoiceNumber: string;
    date: Date;
    businessDetails: BusinessDetails;
    customerDetails: CustomerDetails;
    items: BillItemCalculated[];
    totals: BillTotals;
}
