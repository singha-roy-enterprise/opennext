import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "accent" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    // Solid ink → cobalt on hover. The default call-to-action.
    primary: "border-ink bg-ink text-cream hover:border-accent hover:bg-accent rounded-[3px] border-[1.5px] font-semibold",
    // Solid cobalt. The highest-emphasis action (Download invoice, Add item).
    accent: "border-accent bg-accent text-white hover:border-accent-dark hover:bg-accent-dark rounded-[3px] border-[1.5px] font-bold",
    // Outline that inverts to an ink fill on hover.
    outline: "border-ink text-ink hover:bg-ink hover:text-cream rounded-[3px] border-[1.5px] bg-transparent font-semibold",
    // Low-emphasis bordered chip that picks up the accent on hover.
    ghost: "border-ink/25 text-ink hover:border-accent hover:text-accent rounded-[3px] border bg-transparent font-semibold",
    // Destructive solid.
    danger: "border-danger bg-danger text-white rounded-[3px] border-[1.5px] font-bold",
    // Inline text button — no box, no padding.
    link: "text-accent border-none bg-transparent p-0 font-semibold hover:underline",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
    sm: "px-[15px] py-[9px] text-[12.5px]",
    md: "px-[22px] py-[13px] text-[13px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

/**
 * The house button. Encodes the app's five box styles plus an inline `link`
 * variant so call sites stop repeating long Tailwind strings. Defaults to
 * `type="button"` (the app almost never submits forms implicitly).
 *
 * @category Actions
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = "primary", size = "md", type = "button", className, children, ...rest },
    ref,
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-2 transition-colors",
                VARIANT_CLASS[variant],
                variant !== "link" && SIZE_CLASS[size],
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
});
