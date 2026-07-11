/**
 * Singha Roy Enterprise design-system primitives.
 *
 * Pure, prop-driven presentational components — no Next.js or app-context
 * dependencies — so they render standalone (and bundle cleanly for design
 * tooling). Styling relies on the theme tokens and utilities in globals.css.
 */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "@/ui/button";
export { TextInput, type TextInputProps } from "@/ui/text-input";
export { Field, FieldLabel, type FieldProps } from "@/ui/field";
export { Badge, type BadgeProps, type BadgeTone } from "@/ui/badge";
export { SectionLabel, type SectionLabelProps } from "@/ui/section-label";
export { StatCell, type StatCellProps, type StatTone } from "@/ui/stat-cell";
export { Card, type CardProps, type CardVariant } from "@/ui/card";
export { Modal, type ModalProps } from "@/ui/modal";
export { Drawer, type DrawerProps } from "@/ui/drawer";
export {
    InvoiceDocument,
    type InvoiceDocumentProps,
    type InvoiceDocumentType,
    type InvoiceParty,
    type InvoiceLineItem,
    type InvoiceBusiness,
} from "@/ui/invoice-document";
