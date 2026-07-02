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
 * A mock credential record. Passwords are stored in plain text because this is
 * a front-end-only demo — there is no backend to hash or verify against. In
 * production, credentials would be checked server-side and only the resolved
 * session (role + profile) would ever reach the client.
 */
export interface Credential extends Account {
    username: string;
    email: string;
    password: string;
    role: Exclude<Role, "guest">;
}

export interface SignUpInput {
    name: string;
    username: string;
    email: string;
    password: string;
}

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

/**
 * Pre-seeded demo accounts. Their credentials are surfaced in the sign-in modal
 * so the app stays usable as a demo without a real user directory.
 */
export const DEMO_CREDENTIALS: Credential[] = [
    {
        username: "debarishi-sr",
        email: "debarishi@singharoy.in",
        password: "admin123",
        login: "@debarishi-sr",
        name: "Debarishi Singha Roy",
        initials: "DS",
        role: "admin",
    },
    {
        username: "sera-sengupta",
        email: "sera@singharoy.in",
        password: "user123",
        login: "@sera-sengupta",
        name: "Sera Sengupta",
        initials: "SS",
        role: "user",
    },
];

const SESSION_STORAGE_KEY = "sre_session";
const ACCOUNTS_STORAGE_KEY = "sre_accounts";

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

/** User-registered mock accounts, persisted separately from the demo seeds. */
function readRegistered(): Credential[] {
    try {
        const raw = JSON.parse(localStorage.getItem(ACCOUNTS_STORAGE_KEY) || "null");
        if (Array.isArray(raw)) return raw as Credential[];
    } catch {
        // ignore
    }
    return [];
}

function writeRegistered(accounts: Credential[]): void {
    try {
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {
        // ignore
    }
}

/** All known credentials: demo seeds first, then registered accounts. */
function allCredentials(): Credential[] {
    return [...DEMO_CREDENTIALS, ...readRegistered()];
}

/** "Debarishi Singha Roy" -> "DS", "sera" -> "SE". */
export function deriveInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toAccount(cred: Credential): Account {
    return { login: cred.login, name: cred.name, initials: cred.initials };
}

interface SessionContextValue {
    session: Session;
    isSignedIn: boolean;
    isAdmin: boolean;
    isGuest: boolean;
    /** Verify a username/email + password against the mock credential store. */
    signIn: (identifier: string, password: string) => AuthResult;
    /** Register a new mock account (always a "user" role) and sign in. */
    signUp: (input: SignUpInput) => AuthResult;
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
        // Hydrating the persisted session after mount is intentional (client-only).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(readSession());
    }, []);

    const applySession = useCallback((role: Role, user: Account | null): Session => {
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
        (identifier: string, password: string): AuthResult => {
            const id = identifier.trim().toLowerCase();
            if (!id || !password) {
                return { ok: false, error: "Enter your username/email and password." };
            }
            const match = allCredentials().find((c) => c.username.toLowerCase() === id || c.email.toLowerCase() === id);
            if (!match || match.password !== password) {
                return { ok: false, error: "Incorrect username/email or password." };
            }
            return { ok: true, session: applySession(match.role, toAccount(match)) };
        },
        [applySession],
    );

    const signUp = useCallback(
        ({ name, username, email, password }: SignUpInput): AuthResult => {
            const cleanName = name.trim();
            const cleanUsername = username.trim();
            const cleanEmail = email.trim();

            if (!cleanName || !cleanUsername || !cleanEmail || !password) {
                return { ok: false, error: "All fields are required." };
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
                return { ok: false, error: "Enter a valid email address." };
            }
            if (password.length < 6) {
                return { ok: false, error: "Password must be at least 6 characters." };
            }

            const taken = allCredentials().some(
                (c) =>
                    c.username.toLowerCase() === cleanUsername.toLowerCase() ||
                    c.email.toLowerCase() === cleanEmail.toLowerCase(),
            );
            if (taken) {
                return { ok: false, error: "That username or email is already registered." };
            }

            const cred: Credential = {
                username: cleanUsername,
                email: cleanEmail,
                password,
                login: `@${cleanUsername}`,
                name: cleanName,
                initials: deriveInitials(cleanName),
                role: "user",
            };
            writeRegistered([...readRegistered(), cred]);
            return { ok: true, session: applySession(cred.role, toAccount(cred)) };
        },
        [applySession],
    );

    const signOut = useCallback(() => {
        applySession("guest", null);
        setAuthModalOpen(false);
    }, [applySession]);

    const value = useMemo<SessionContextValue>(
        () => ({
            session,
            isSignedIn: session.role !== "guest",
            isAdmin: session.role === "admin",
            isGuest: session.role !== "admin",
            signIn,
            signUp,
            signOut,
            authModalOpen,
            openAuth: () => setAuthModalOpen(true),
            closeAuth: () => setAuthModalOpen(false),
        }),
        [session, signIn, signUp, signOut, authModalOpen],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used within a SessionProvider");
    return ctx;
}
