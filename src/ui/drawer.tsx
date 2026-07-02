"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "@/ui/icons";

export interface DrawerProps {
    /** Fires on backdrop click and on the header close button. */
    onClose: () => void;
    /** Serif title shown in the sticky header. */
    title: string;
    /** Sticky footer content (e.g. Cancel / Save actions). */
    footer?: ReactNode;
    /** Panel width, e.g. "440px". */
    width?: string;
    /** Extra classes for the scrolling body wrapper. */
    bodyClassName?: string;
    children: ReactNode;
}

/**
 * Right-hand slide-in panel with a sticky serif header (title + close) and an
 * optional sticky footer. The body scrolls between them. Backdrop click closes.
 *
 * @category Overlays
 */
export function Drawer({ onClose, title, footer, width = "440px", bodyClassName, children }: DrawerProps) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex animate-[overlayIn_0.2s_ease] justify-end bg-black/45"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ width }}
                className="border-ink bg-card h-full max-w-[92vw] animate-[drawerIn_0.26s_cubic-bezier(0.2,0.8,0.2,1)] overflow-y-auto border-l-[1.5px]"
            >
                <div className="border-ink bg-card sticky top-0 z-[2] flex items-center justify-between border-b-[1.5px] px-6 py-5">
                    <h2 className="m-0 font-serif text-[22px] font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="border-ink/[0.18] text-ink-700 hover:border-ink hover:text-ink flex size-8 cursor-pointer items-center justify-center rounded-[3px] border bg-transparent transition-colors"
                    >
                        <CloseIcon size={16} />
                    </button>
                </div>
                <div className={cn("flex flex-col gap-[18px] px-6 py-[22px]", bodyClassName)}>{children}</div>
                {footer && (
                    <div className="border-ink bg-card sticky bottom-0 flex gap-[11px] border-t-[1.5px] px-6 py-[18px]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
