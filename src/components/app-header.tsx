"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/auth/session";
import { useToast } from "@/ui/toast";
import { cn } from "@/lib/cn";
import { GitHubIcon, SignOutIcon } from "@/ui/icons";

/** Shared role badge styling, reused on the header and the home dashboard. */
export function roleBadgeClass(admin: boolean): string {
    return cn(
        "inline-flex items-center gap-[5px] rounded-[2px] border px-2.5 py-[5px] font-mono text-[10px] font-semibold tracking-[0.05em]",
        admin ? "border-success/40 bg-success/[0.08] text-success" : "border-ink/25 text-ink-500",
    );
}

interface NavItem {
    label: string;
    to: string;
}

/** Shared top bar. Pass `showNav={false}` for the landing (Home) page. */
export function AppHeader({ showNav = true }: { showNav?: boolean }) {
    const { isSignedIn, isAdmin, session, openAuth, signOut } = useSession();
    const { toast } = useToast();
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { label: "Home", to: "/" },
        { label: "Inventory", to: "/inventory" },
        ...(isAdmin ? [{ label: "Invoice", to: "/invoice" }] : []),
    ];

    const handleSignOut = () => {
        signOut();
        toast("Signed out · viewing as guest", "muted");
    };

    return (
        <header className="border-b-[1.5px] border-ink bg-cream">
            <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between gap-5 px-7">
                <div className="flex min-w-0 items-center gap-[22px]">
                    <div className="flex items-center gap-[13px]">
                        <div className="flex size-10 items-center justify-center border-[1.5px] border-ink font-serif text-[18px] font-semibold">
                            SR
                        </div>
                        <div className="flex flex-col leading-[1.15]">
                            <span className="text-[14px] font-bold tracking-[0.04em]">SINGHA ROY ENTERPRISE</span>
                            <span className="font-mono text-[10px] tracking-[0.04em] text-ink-500">
                                TAX INVOICE & STOCK LEDGER · BALURGHAT, WB
                            </span>
                        </div>
                    </div>
                    {showNav && (
                        <nav className="flex h-[74px] items-stretch pl-1.5">
                            {navItems.map((item) => {
                                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                                if (active) {
                                    return (
                                        <span
                                            key={item.to}
                                            className="flex items-center px-4 text-[13px] font-semibold text-ink shadow-[inset_0_-3px_0_#2742C4]"
                                        >
                                            {item.label}
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        className="flex items-center px-4 text-[13px] font-semibold text-ink-500 no-underline transition-colors hover:text-ink"
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3.5">
                    {showNav && (
                        <>
                            <span className="font-mono text-[10.5px] tracking-[0.05em] text-ink-300">v2.0</span>
                            <span className="h-6 w-px bg-ink/[0.18]" />
                        </>
                    )}

                    {!isSignedIn && (
                        <button
                            type="button"
                            onClick={openAuth}
                            className="inline-flex cursor-pointer items-center gap-[9px] rounded-[3px] border-[1.5px] border-ink bg-ink px-[15px] py-[9px] text-[12.5px] font-semibold text-cream transition-colors hover:border-accent hover:bg-accent"
                        >
                            <GitHubIcon size={15} />
                            Sign in with GitHub
                        </button>
                    )}

                    {isSignedIn && session.user && (
                        <div className="flex items-center gap-[11px]">
                            <span className={roleBadgeClass(isAdmin)}>{isAdmin ? "ADMIN" : "USER"}</span>
                            <div className="flex items-center gap-2.5 rounded-[3px] border border-ink/[0.18] bg-white py-[5px] pr-1.5 pl-[5px]">
                                <div className="flex size-7 items-center justify-center bg-ink font-serif text-[13px] text-cream">
                                    {session.user.initials}
                                </div>
                                <div className="flex flex-col pr-0.5 leading-[1.15]">
                                    <span className="text-[12px] font-semibold">{session.user.name}</span>
                                    <span className="font-mono text-[10px] text-ink-500">{session.user.login}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    title="Sign out"
                                    className="flex size-[26px] cursor-pointer items-center justify-center border-none bg-transparent text-ink-500 transition-colors hover:text-danger"
                                >
                                    <SignOutIcon size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
