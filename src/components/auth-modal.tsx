"use client";

import { useSession } from "@/auth/session";
import { useToast } from "@/ui/toast";
import { cn } from "@/lib/cn";
import { GitHubIcon, CloseIcon } from "@/ui/icons";

/**
 * Mock "Sign in with GitHub" modal. Picking an account just sets the session
 * role — the real OAuth handshake is handled elsewhere in production.
 */
export function AuthModal() {
    const { authModalOpen, closeAuth, signIn } = useSession();
    const { toast } = useToast();

    if (!authModalOpen) return null;

    const pick = (role: "admin" | "user") => {
        signIn(role);
        toast(`Signed in as ${role === "admin" ? "@debarishi-sr · Admin access" : "@sera-sengupta · User"}`);
    };

    return (
        <div
            onClick={closeAuth}
            className="bg-ink/50 fixed inset-0 z-[80] flex animate-[overlayIn_0.18s_ease] items-center justify-center p-6"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="border-ink bg-card w-[440px] max-w-full animate-[popIn_0.2s_ease] overflow-hidden rounded-[5px] border-[1.5px] shadow-[0_30px_70px_-34px_rgba(27,25,22,0.6)]"
            >
                <div className="border-ink/[0.14] flex items-center justify-between border-b px-[22px] py-5">
                    <div className="flex items-center gap-2.5">
                        <GitHubIcon size={18} />
                        <h3 className="m-0 text-[15px] font-bold">Sign in with GitHub</h3>
                    </div>
                    <button
                        type="button"
                        onClick={closeAuth}
                        className="border-ink/[0.18] text-ink-700 hover:border-ink hover:text-ink flex size-[30px] cursor-pointer items-center justify-center rounded-[3px] border bg-transparent transition-colors"
                    >
                        <CloseIcon size={15} />
                    </button>
                </div>
                <div className="px-4 pt-3.5 pb-2">
                    <div className="text-ink-500 px-1.5 pb-2 font-mono text-[10px] tracking-[0.1em] uppercase">
                        Demo · choose a test account
                    </div>
                    <AccountButton
                        onClick={() => pick("admin")}
                        initials="DS"
                        initialsBgClass="bg-ink"
                        name="Debarishi Singha Roy"
                        meta="@debarishi-sr · invoice + inventory editing"
                        badge="ADMIN"
                        admin
                        className="mb-2.5"
                    />
                    <AccountButton
                        onClick={() => pick("user")}
                        initials="SS"
                        initialsBgClass="bg-ink-500"
                        name="Sera Sengupta"
                        meta="@sera-sengupta · read-only inventory"
                        badge="USER"
                    />
                </div>
                <div className="text-ink-300 px-[22px] pt-2.5 pb-[18px] font-mono text-[10px] leading-[1.5]">
                    Mock authentication for testing. In production, the role is resolved from your GitHub username on
                    the backend.
                </div>
            </div>
        </div>
    );
}

function AccountButton({
    onClick,
    initials,
    initialsBgClass,
    name,
    meta,
    badge,
    admin = false,
    className,
}: {
    onClick: () => void;
    initials: string;
    initialsBgClass: string;
    name: string;
    meta: string;
    badge: string;
    admin?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "border-ink/[0.16] hover:border-accent flex w-full cursor-pointer items-center gap-[13px] rounded-[3px] border bg-white p-[13px] text-left transition-colors",
                className,
            )}
        >
            <div
                className={cn(
                    "text-cream flex size-[38px] flex-none items-center justify-center font-serif text-[15px]",
                    initialsBgClass,
                )}
            >
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold">{name}</div>
                <div className="text-ink-500 font-mono text-[11px]">{meta}</div>
            </div>
            <span
                className={cn(
                    "inline-flex flex-none items-center gap-1 rounded-[2px] px-2 py-[3px] font-mono text-[9.5px] font-semibold",
                    admin
                        ? "border-success/40 bg-success/[0.08] text-success border"
                        : "border-ink/25 text-ink-500 border",
                )}
            >
                {badge}
            </span>
        </button>
    );
}
