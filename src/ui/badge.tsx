import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "danger" | "warn" | "neutral" | "accent";

const TONE_CLASS: Record<BadgeTone, string> = {
    success: "border-success/40 bg-success/[0.08] text-success",
    danger: "border-danger/40 bg-danger/[0.08] text-danger",
    warn: "border-warn/40 bg-warn/10 text-warn",
    neutral: "border-ink/25 text-ink-500",
    accent: "border-accent/40 bg-accent/[0.08] text-accent",
};

export interface BadgeProps {
    tone?: BadgeTone;
    /** Show a leading status dot (inherits the tone colour). */
    dot?: boolean;
    children: ReactNode;
    className?: string;
}

/**
 * Tiny mono uppercase status/role pill: a thin tinted border, faint background,
 * and an optional leading dot. Used for stock status and account roles.
 */
export function Badge({ tone = "neutral", dot, children, className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-[5px] rounded-[2px] border px-[7px] py-0.5 font-mono text-[10px] font-semibold tracking-[0.04em] whitespace-nowrap uppercase",
                TONE_CLASS[tone],
                className,
            )}
        >
            {dot && <span className="size-[5px] flex-none rounded-full bg-current" />}
            {children}
        </span>
    );
}
