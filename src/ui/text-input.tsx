import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    /** Paints the border red to flag a validation error. */
    invalid?: boolean;
    /** Renders the value in the monospace figure face (codes, PINs, amounts). */
    mono?: boolean;
}

/**
 * The house text field — the `.led-in` style (white fill, hairline border,
 * cobalt focus ring, red-on-invalid) as a component. Use `mono` for codes and
 * figures, `invalid` for error states.
 *
 * @category Forms
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
    { invalid, mono, className, ...rest },
    ref,
) {
    return <input ref={ref} className={cn("led-in", invalid && "invalid", mono && "font-mono", className)} {...rest} />;
});
