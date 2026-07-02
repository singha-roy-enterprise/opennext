import { type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Uppercase mono micro-label used above stacked form fields (invoice, drawer).
 *
 * @category Forms
 */
export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span
            className={cn(
                "text-ink-500 mb-1.5 block text-[10.5px] font-semibold tracking-[0.1em] uppercase",
                className,
            )}
        >
            {children}
        </span>
    );
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    /** Visible field label. */
    label: string;
    /** Leading icon rendered inside the input box. */
    icon?: ReactNode;
    /** Trailing adornment (e.g. a show/hide-password toggle). */
    trailing?: ReactNode;
    onChange?: (value: string) => void;
}

/**
 * A labelled input in a bordered box with an optional leading icon and trailing
 * adornment — the auth-form field style. `onChange` yields the string value
 * directly for terse call sites.
 *
 * @category Forms
 */
export function Field({ label, icon, trailing, onChange, className, ...rest }: FieldProps) {
    return (
        <label className="mb-3.5 block">
            <span className="text-ink-700 mb-1.5 block text-[11.5px] font-semibold tracking-[0.02em]">{label}</span>
            <span className="border-ink/[0.18] focus-within:border-accent bg-surface flex items-center gap-2.5 rounded-[3px] border px-3 py-[10px] transition-colors">
                {icon && <span className="text-ink-500 flex-none">{icon}</span>}
                <input
                    onChange={(e) => onChange?.(e.target.value)}
                    className={cn(
                        "text-ink placeholder:text-ink-300 min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] outline-none",
                        className,
                    )}
                    {...rest}
                />
                {trailing && <span className="flex-none">{trailing}</span>}
            </span>
        </label>
    );
}
