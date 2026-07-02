import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ModalProps {
    /** Fires on backdrop click (clicks inside the dialog are ignored). */
    onClose: () => void;
    /** Dialog width, e.g. "440px" or "380px". */
    width?: string;
    /** Stacking context — auth sits above the confirm dialog. */
    zIndex?: number;
    /** Extra classes for the dialog surface. */
    className?: string;
    children: ReactNode;
}

/**
 * Centered modal shell: a dimmed backdrop that closes on click and a popping
 * card that swallows inner clicks. Provide the dialog contents as children.
 */
export function Modal({ onClose, width = "440px", zIndex = 60, className, children }: ModalProps) {
    return (
        <div
            onClick={onClose}
            style={{ zIndex }}
            className="fixed inset-0 flex animate-[overlayIn_0.18s_ease] items-center justify-center bg-black/50 p-6"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{ width }}
                className={cn(
                    "border-ink bg-card max-w-full animate-[popIn_0.2s_ease] overflow-hidden rounded-[5px] border-[1.5px] shadow-[0_30px_70px_-34px_rgba(27,25,22,0.6)]",
                    className,
                )}
            >
                {children}
            </div>
        </div>
    );
}
