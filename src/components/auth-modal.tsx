"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { DEMO_CREDENTIALS, useSession, type AuthResult } from "@/auth/session";
import { useToast } from "@/ui/toast";
import { cn } from "@/lib/cn";
import { CloseIcon, UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, SignInIcon, UserPlusIcon } from "@/ui/icons";

type Mode = "signin" | "signup";

/**
 * Mock username/password auth modal. Credentials are verified client-side
 * against the demo seeds (and any locally-registered accounts) — the real
 * verification would happen on the backend in production.
 */
export function AuthModal() {
    const { authModalOpen, closeAuth, signIn, signUp } = useSession();
    const { toast } = useToast();

    const [mode, setMode] = useState<Mode>("signin");
    const [identifier, setIdentifier] = useState("");
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!authModalOpen) return null;

    const resetForm = () => {
        setIdentifier("");
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setError(null);
    };

    const close = () => {
        resetForm();
        setMode("signin");
        closeAuth();
    };

    const switchMode = (next: Mode) => {
        setError(null);
        setShowPassword(false);
        setMode(next);
    };

    const finish = (result: AuthResult) => {
        if (!result.ok) {
            setError(result.error);
            return;
        }
        const user = result.session.user;
        toast(`Signed in as ${user?.name}${result.session.role === "admin" ? " · Admin access" : ""}`);
        close();
    };

    const handleSignIn = (e: FormEvent) => {
        e.preventDefault();
        finish(signIn(identifier, password));
    };

    const handleSignUp = (e: FormEvent) => {
        e.preventDefault();
        finish(signUp({ name, username, email, password }));
    };

    const signInAsDemo = (demoIdentifier: string, demoPassword: string) => {
        finish(signIn(demoIdentifier, demoPassword));
    };

    const isSignIn = mode === "signin";

    return (
        <div
            onClick={close}
            className="bg-ink/50 fixed inset-0 z-[80] flex animate-[overlayIn_0.18s_ease] items-center justify-center p-6"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="border-ink bg-card w-[440px] max-w-full animate-[popIn_0.2s_ease] overflow-hidden rounded-[5px] border-[1.5px] shadow-[0_30px_70px_-34px_rgba(27,25,22,0.6)]"
            >
                <div className="border-ink/[0.14] flex items-center justify-between border-b px-[22px] py-5">
                    <div className="flex items-center gap-2.5">
                        {isSignIn ? <SignInIcon size={18} /> : <UserPlusIcon size={18} />}
                        <h3 className="m-0 text-[15px] font-bold">{isSignIn ? "Sign in" : "Create an account"}</h3>
                    </div>
                    <button
                        type="button"
                        onClick={close}
                        className="border-ink/[0.18] text-ink-700 hover:border-ink hover:text-ink flex size-[30px] cursor-pointer items-center justify-center rounded-[3px] border bg-transparent transition-colors"
                    >
                        <CloseIcon size={15} />
                    </button>
                </div>

                {/* Mode toggle */}
                <div className="border-ink/[0.14] flex gap-1 border-b px-4 py-3">
                    <TabButton active={isSignIn} onClick={() => switchMode("signin")}>
                        Sign in
                    </TabButton>
                    <TabButton active={!isSignIn} onClick={() => switchMode("signup")}>
                        Sign up
                    </TabButton>
                </div>

                <form onSubmit={isSignIn ? handleSignIn : handleSignUp} className="px-[22px] pt-5 pb-2">
                    {isSignIn ? (
                        <Field
                            icon={<UserIcon size={15} />}
                            label="Username or email"
                            value={identifier}
                            onChange={setIdentifier}
                            placeholder="debarishi-sr"
                            autoComplete="username"
                            autoFocus
                        />
                    ) : (
                        <>
                            <Field
                                icon={<UserIcon size={15} />}
                                label="Full name"
                                value={name}
                                onChange={setName}
                                placeholder="Debarishi Singha Roy"
                                autoComplete="name"
                                autoFocus
                            />
                            <Field
                                icon={<UserIcon size={15} />}
                                label="Username"
                                value={username}
                                onChange={setUsername}
                                placeholder="debarishi-sr"
                                autoComplete="username"
                            />
                            <Field
                                icon={<MailIcon size={15} />}
                                label="Email"
                                type="email"
                                value={email}
                                onChange={setEmail}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </>
                    )}

                    <Field
                        icon={<LockIcon size={15} />}
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={setPassword}
                        placeholder={isSignIn ? "••••••••" : "At least 6 characters"}
                        autoComplete={isSignIn ? "current-password" : "new-password"}
                        trailing={
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                title={showPassword ? "Hide password" : "Show password"}
                                className="text-ink-500 hover:text-ink flex cursor-pointer items-center border-none bg-transparent p-0 transition-colors"
                            >
                                {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                            </button>
                        }
                    />

                    {error && (
                        <div className="border-danger/40 bg-danger/[0.06] text-danger mb-3 rounded-[3px] border px-3 py-2 text-[12px] font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="border-ink bg-ink text-cream hover:border-accent hover:bg-accent mb-1 inline-flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[3px] border-[1.5px] p-[13px] text-[13px] font-semibold transition-colors"
                    >
                        {isSignIn ? <SignInIcon size={15} /> : <UserPlusIcon size={15} />}
                        {isSignIn ? "Sign in" : "Create account"}
                    </button>
                </form>

                {isSignIn ? (
                    <div className="px-[22px] pt-1 pb-[18px]">
                        <div className="text-ink-500 mb-2 font-mono text-[10px] tracking-[0.1em] uppercase">
                            Demo · click to sign in
                        </div>
                        <div className="flex flex-col gap-2">
                            {DEMO_CREDENTIALS.map((c) => (
                                <button
                                    key={c.username}
                                    type="button"
                                    onClick={() => signInAsDemo(c.username, c.password)}
                                    className="border-ink/[0.16] hover:border-accent flex w-full cursor-pointer items-center gap-[13px] rounded-[3px] border bg-white p-[11px] text-left transition-colors"
                                >
                                    <span
                                        className={cn(
                                            "text-cream flex size-[34px] flex-none items-center justify-center font-serif text-[14px]",
                                            c.role === "admin" ? "bg-ink" : "bg-ink-500",
                                        )}
                                    >
                                        {c.initials}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[12.5px] font-bold">{c.name}</span>
                                        <span className="text-ink-500 block font-mono text-[10.5px]">
                                            {c.username} · {c.password}
                                        </span>
                                    </span>
                                    <span
                                        className={cn(
                                            "inline-flex flex-none items-center rounded-[2px] border px-2 py-[3px] font-mono text-[9.5px] font-semibold",
                                            c.role === "admin"
                                                ? "border-success/40 bg-success/[0.08] text-success"
                                                : "border-ink/25 text-ink-500",
                                        )}
                                    >
                                        {c.role.toUpperCase()}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="text-ink-300 mt-3 font-mono text-[10px] leading-[1.5]">
                            Mock authentication for testing. In production, credentials are verified on the backend.
                        </div>
                    </div>
                ) : (
                    <div className="text-ink-300 px-[22px] pt-1 pb-[18px] font-mono text-[10px] leading-[1.5]">
                        New accounts are created with standard (read-only) access. Admin access is granted separately.
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex-1 cursor-pointer rounded-[3px] border px-3 py-[7px] text-[12.5px] font-semibold transition-colors",
                active
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/[0.16] text-ink-500 hover:text-ink bg-transparent",
            )}
        >
            {children}
        </button>
    );
}

function Field({
    icon,
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    autoComplete,
    autoFocus = false,
    trailing,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    trailing?: ReactNode;
}) {
    return (
        <label className="mb-3.5 block">
            <span className="text-ink-700 mb-1.5 block text-[11.5px] font-semibold tracking-[0.02em]">{label}</span>
            <span className="border-ink/[0.18] focus-within:border-accent flex items-center gap-2.5 rounded-[3px] border bg-white px-3 py-[10px] transition-colors">
                <span className="text-ink-500 flex-none">{icon}</span>
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    className="text-ink placeholder:text-ink-300 min-w-0 flex-1 border-none bg-transparent p-0 text-[13px] outline-none"
                />
                {trailing && <span className="flex-none">{trailing}</span>}
            </span>
        </label>
    );
}
