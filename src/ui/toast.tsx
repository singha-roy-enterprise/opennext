"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ToastKind = "success" | "danger" | "muted";

interface Toast {
    id: number;
    msg: string;
    kind: ToastKind;
}

interface ToastContextValue {
    toast: (msg: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, { border: string; dot: string }> = {
    success: { border: "border-success/40", dot: "bg-success" },
    danger: { border: "border-danger/40", dot: "bg-danger" },
    muted: { border: "border-ink/25", dot: "bg-ink-500" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((msg: string, kind: ToastKind = "success") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, msg, kind }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800);
    }, []);

    const value = useMemo(() => ({ toast }), [toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed right-6 bottom-6 z-[90] flex flex-col items-end gap-2.5">
                {toasts.map((t) => {
                    const k = KIND_STYLES[t.kind];
                    return (
                        <div
                            key={t.id}
                            className={cn(
                                "flex min-w-[210px] animate-[toastIn_0.25s_ease] items-center gap-2.5 rounded-[3px] border bg-card px-4 py-3 text-[13px] font-medium text-ink shadow-[0_14px_34px_-16px_rgba(27,25,22,0.5)]",
                                k.border,
                            )}
                        >
                            <span className={cn("size-[7px] flex-none rounded-full", k.dot)} />
                            <span>{t.msg}</span>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within a ToastProvider");
    return ctx;
}
