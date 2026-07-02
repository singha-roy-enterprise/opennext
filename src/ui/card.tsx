import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "solid" | "subtle" | "dashed";

const VARIANT_CLASS: Record<CardVariant, string> = {
    // Full-weight ink border — the primary "sheet of paper".
    solid: "border-ink bg-card border-[1.5px]",
    // Hairline border — quieter panels and list containers.
    subtle: "border-ink/[0.18] bg-card border",
    // Dashed outline — secondary / opt-in surfaces (e.g. "continue as guest").
    dashed: "border-ink/35 border-[1.5px] border-dashed",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
}

/**
 * The paper-panel container: a warm card surface with one of three border
 * treatments and a slightly-squared radius. Layout/padding come from className.
 */
export function Card({ variant = "subtle", className, children, ...rest }: CardProps) {
    return (
        <div className={cn("rounded-[5px]", VARIANT_CLASS[variant], className)} {...rest}>
            {children}
        </div>
    );
}
