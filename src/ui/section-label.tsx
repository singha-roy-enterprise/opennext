import { cn } from "@/lib/cn";

export interface SectionLabelProps {
    /** Mono index shown in the accent colour, e.g. "01". */
    n: string;
    /** Wide-tracked uppercase section title. */
    title: string;
    className?: string;
}

/**
 * A numbered section header: a mono accent index, a spaced-uppercase title, and
 * a hairline rule that fills the rest of the row. Structures the invoice form.
 */
export function SectionLabel({ n, title, className }: SectionLabelProps) {
    return (
        <div className={cn("mb-[18px] flex items-center gap-[11px]", className)}>
            <span className="text-accent font-mono text-[11px] font-semibold">{n}</span>
            <span className="text-[11.5px] font-semibold tracking-[0.18em] uppercase">{title}</span>
            <span className="bg-ink/[0.14] h-px flex-1" />
        </div>
    );
}
