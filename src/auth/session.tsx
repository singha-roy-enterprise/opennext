"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { trpc } from "@/trpc/react";
import type { SessionUser } from "@/server/context";

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

export interface SignUpInput {
    name: string;
    username: string;
    email: string;
    password: string;
}

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

/** Display-only demo accounts, surfaced in the sign-in modal. Their passwords
 * match the seeded rows in the database (see `migrations/0002_seed.sql`), so the
 * one-click demo buttons authenticate against the real backend. */
export interface DemoCredential {
    username: string;
    password: string;
    name: string;
    initials: string;
    role: Exclude<Role, "guest">;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
    {
        username: "debarishi-sr",
        password: "admin123",
        name: "Debarishi Singha Roy",
        initials: "DS",
        role: "admin",
    },
    {
        username: "sera-sengupta",
        password: "user123",
        name: "Sera Sengupta",
        initials: "SS",
        role: "user",
    },
];

const GUEST_SESSION: Session = { role: "guest", user: null };

function toSession(user: SessionUser | null): Session {
    if (!user) return GUEST_SESSION;
    return { role: user.role, user: { login: user.login, name: user.name, initials: user.initials } };
}

function errorMessage(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    return "Something went wrong. Please try again.";
}

interface SessionContextValue {
    session: Session;
    isSignedIn: boolean;
    isAdmin: boolean;
    isGuest: boolean;
    /** Verify credentials against the backend; resolves to an AuthResult. */
    signIn: (identifier: string, password: string) => Promise<AuthResult>;
    /** Register a new (read-only) account on the backend and sign in. */
    signUp: (input: SignUpInput) => Promise<AuthResult>;
    signOut: () => Promise<void>;
    /** Auth modal visibility (shared across pages). */
    authModalOpen: boolean;
    openAuth: () => void;
    closeAuth: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
    const utils = trpc.useUtils();
    // Resolves the current session; guests get `null`. Runs client-side after
    // mount, so SSR and first paint render as a guest (matching the markup).
    const meQuery = trpc.auth.me.useQuery(undefined, { staleTime: 5 * 60_000 });
    const loginMutation = trpc.auth.login.useMutation();
    const signupMutation = trpc.auth.signup.useMutation();
    const logoutMutation = trpc.auth.logout.useMutation();

    const [authModalOpen, setAuthModalOpen] = useState(false);

    const meUser = meQuery.data ?? null;
    const session = useMemo(() => toSession(meUser), [meUser]);

    const signIn = useCallback(
        async (identifier: string, password: string): Promise<AuthResult> => {
            try {
                const user = await loginMutation.mutateAsync({ identifier, password });
                utils.auth.me.setData(undefined, user);
                return { ok: true, session: toSession(user) };
            } catch (err) {
                return { ok: false, error: errorMessage(err) };
            }
        },
        [loginMutation, utils],
    );

    const signUp = useCallback(
        async (input: SignUpInput): Promise<AuthResult> => {
            try {
                const user = await signupMutation.mutateAsync(input);
                utils.auth.me.setData(undefined, user);
                return { ok: true, session: toSession(user) };
            } catch (err) {
                return { ok: false, error: errorMessage(err) };
            }
        },
        [signupMutation, utils],
    );

    const signOut = useCallback(async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch {
            // Even if the network call fails, drop the client-side session.
        }
        utils.auth.me.setData(undefined, null);
        setAuthModalOpen(false);
    }, [logoutMutation, utils]);

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
