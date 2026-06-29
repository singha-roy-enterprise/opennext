"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "guest" | "admin" | "user";

export interface Account {
    login: string;
    name: string;
    initials: string;
}

export interface Session {
    role: Role;
    user: Account | null;
}

/**
 * Mock accounts used by the demo sign-in modal. In production the role is
 * resolved from the authenticated GitHub username on the backend — the OAuth
 * flow itself is intentionally not implemented here.
 */
export const ACCOUNTS: Record<Exclude<Role, "guest">, Account> = {
    admin: { login: "@debarishi-sr", name: "Debarishi Singha Roy", initials: "DS" },
    user: { login: "@sera-sengupta", name: "Sera Sengupta", initials: "SS" },
};

const SESSION_STORAGE_KEY = "sre_session";

const GUEST_SESSION: Session = { role: "guest", user: null };

function readSession(): Session {
    try {
        const raw = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "null");
        if (raw && raw.role) return raw as Session;
    } catch {
        // ignore
    }
    return GUEST_SESSION;
}

interface SessionContextValue {
    session: Session;
    isSignedIn: boolean;
    isAdmin: boolean;
    isGuest: boolean;
    /** Sign in as one of the mock roles. */
    signIn: (role: Exclude<Role, "guest">) => void;
    signOut: () => void;
    /** Auth modal visibility (shared across pages). */
    authModalOpen: boolean;
    openAuth: () => void;
    closeAuth: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    // Start as a guest on the server and the first client render, then hydrate
    // the persisted session after mount to avoid hydration mismatches.
    const [session, setSession] = useState<Session>(GUEST_SESSION);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        setSession(readSession());
    }, []);

    const applySession = useCallback((role: Role): Session => {
        const user = role === "guest" ? null : ACCOUNTS[role];
        const next: Session = { role, user };
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore
        }
        setSession(next);
        return next;
    }, []);

    const signIn = useCallback(
        (role: Exclude<Role, "guest">) => {
            applySession(role);
            setAuthModalOpen(false);
        },
        [applySession],
    );

    const signOut = useCallback(() => {
        applySession("guest");
        setAuthModalOpen(false);
    }, [applySession]);

    const value = useMemo<SessionContextValue>(
        () => ({
            session,
            isSignedIn: session.role !== "guest",
            isAdmin: session.role === "admin",
            isGuest: session.role !== "admin",
            signIn,
            signOut,
            authModalOpen,
            openAuth: () => setAuthModalOpen(true),
            closeAuth: () => setAuthModalOpen(false),
        }),
        [session, signIn, signOut, authModalOpen],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used within a SessionProvider");
    return ctx;
}
