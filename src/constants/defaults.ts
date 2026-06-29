import type { BusinessDetails } from "@/types/bill";

/**
 * Default business details for SINGHA ROY ENTERPRISE
 * These are used as fallback when localStorage is empty
 */
export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
    name: "SINGHA ROY ENTERPRISE",
    phones: ["9903746426", "7001761384"],
    email: "debarishisingharoy@gmail.com",
    gstNo: "19ALAPR8029B1Z5",
    address: {
        line1: "Singha Roy Bhaban, Saheb Kachari Para",
        line2: "Balurghat, District - South Dinajpur",
        city: "Balurghat",
        pin: "733101",
        state: "West Bengal",
    },
};

/**
 * LocalStorage key for persisting business details
 */
export const STORAGE_KEY_BUSINESS_DETAILS = "singha_roy_enterprise_business_details";

/**
 * LocalStorage key for persisting form data (invoice, customer, items)
 */
export const STORAGE_KEY_FORM_DATA = "singha_roy_enterprise_form_data";

/**
 * Default GST percentages
 */
export const DEFAULT_CGST_PERCENT = 9;
export const DEFAULT_SGST_PERCENT = 9;

/**
 * Indian states for dropdown
 */
export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Chandigarh",
    "Puducherry",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Andaman and Nicobar Islands",
] as const;
