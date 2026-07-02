import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatTone = "default" | "accent" | "warn" | "danger" | "success";

const TONE_CLASS: Record<StatTone, string> = {
    default: "text-ink",
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger",
    success: "text-success",
};

const LABEL_TONE_CLASS: Record<StatTone, string> = {
    default: "text-ink-500",
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger",
    success: "text-success",
};

export interface StatCellProps {
    label: string;
    value: string;
    /** Colours both the label and the big value. */
    tone?: StatTone;
    /** Optional icon shown beside the label (e.g. a warning triangle). */
    icon?: ReactNode;
    /** Drops the right divider — set on the last cell in a strip. */
    last?: boolean;
    className?: string;
}

/**
 * A single metric in a stat strip: a mono uppercase label over a big serif
 * value, tinted by tone. Compose several side by side inside a bordered card.
 *
 * @category Display
 */
export function StatCell({ label, value, tone = "default", icon, last, className }: StatCellProps) {
    return (
        <div className={cn("px-5 py-[18px]", !last && "border-ink/[0.12] border-r", className)}>
            <div
                className={cn(
                    "flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase",
                    LABEL_TONE_CLASS[tone],
                )}
            >
                {icon}
                {label}
            </div>
            <div className={cn("mt-1.5 font-serif text-[32px] leading-none font-semibold", TONE_CLASS[tone])}>
                {value}
            </div>
        </div>
    );
}
