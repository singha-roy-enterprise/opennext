"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/auth/session";
import { ToastProvider } from "@/ui/toast";
import { AuthModal } from "@/components/auth-modal";

/** Client-side providers shared across every route (mirrors the old App.tsx tree). */
export function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <SessionProvider>
                {children}
                {/* Auth modal is shared across all pages. */}
                <AuthModal />
            </SessionProvider>
        </ToastProvider>
    );
}
