"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/auth/session";
import { useTheme } from "@/theme/theme";
import { useToast } from "@/ui/toast";
import { cn } from "@/lib/cn";
import { COMMIT_SHA_SHORT, COMMIT_URL, REPO_URL } from "@/utils/build-info";
import { SignInIcon, SignOutIcon, GitHubIcon, GitCommitIcon, SunIcon, MoonIcon } from "@/ui/icons";

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
        <header className="border-ink bg-cream border-b-[1.5px]">
            <div className="mx-auto flex h-[74px] max-w-[1180px] items-center justify-between gap-5 px-7">
                <div className="flex min-w-0 items-center gap-[22px]">
                    <div className="flex items-center gap-[13px]">
                        <div className="border-ink flex size-10 items-center justify-center border-[1.5px] font-serif text-[18px] font-semibold">
                            SR
                        </div>
                        <div className="flex flex-col leading-[1.15]">
                            <span className="text-[14px] font-bold tracking-[0.04em]">SINGHA ROY ENTERPRISE</span>
                            <span className="text-ink-500 font-mono text-[10px] tracking-[0.04em]">
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
                                            className="text-ink flex items-center px-4 text-[13px] font-semibold shadow-[inset_0_-3px_0_#2742C4]"
                                        >
                                            {item.label}
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.to}
                                        href={item.to}
                                        className="text-ink-500 hover:text-ink flex items-center px-4 text-[13px] font-semibold no-underline transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-3.5">
                    <HeaderUtilities />
                    <span className="bg-ink/[0.18] h-6 w-px" />

                    {showNav && (
                        <>
                            <span className="text-ink-300 font-mono text-[10.5px] tracking-[0.05em]">v2.0</span>
                            <span className="bg-ink/[0.18] h-6 w-px" />
                        </>
                    )}

                    {!isSignedIn && (
                        <button
                            type="button"
                            onClick={openAuth}
                            className="border-ink bg-ink text-cream hover:border-accent hover:bg-accent inline-flex cursor-pointer items-center gap-[9px] rounded-[3px] border-[1.5px] px-[15px] py-[9px] text-[12.5px] font-semibold transition-colors"
                        >
                            <SignInIcon size={15} />
                            Sign in
                        </button>
                    )}

                    {isSignedIn && session.user && (
                        <div className="flex items-center gap-[11px]">
                            <span className={roleBadgeClass(isAdmin)}>{isAdmin ? "ADMIN" : "USER"}</span>
                            <div className="border-ink/[0.18] flex items-center gap-2.5 rounded-[3px] border bg-surface py-[5px] pr-1.5 pl-[5px]">
                                <div className="bg-ink text-cream flex size-7 items-center justify-center font-serif text-[13px]">
                                    {session.user.initials}
                                </div>
                                <div className="flex flex-col pr-0.5 leading-[1.15]">
                                    <span className="text-[12px] font-semibold">{session.user.name}</span>
                                    <span className="text-ink-500 font-mono text-[10px]">{session.user.login}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    title="Sign out"
                                    className="text-ink-500 hover:text-danger flex size-[26px] cursor-pointer items-center justify-center border-none bg-transparent transition-colors"
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

const iconButtonClass =
    "border-ink/[0.18] text-ink-500 hover:border-ink hover:text-ink flex size-[30px] items-center justify-center rounded-[3px] border bg-transparent no-underline transition-colors";

/** Commit SHA, GitHub source link, and light/dark theme toggle. */
function HeaderUtilities() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex items-center gap-2">
            {COMMIT_SHA_SHORT && (
                <a
                    href={COMMIT_URL || undefined}
                    target="_blank"
                    rel="noreferrer"
                    title={`Commit ${COMMIT_SHA_SHORT} — view on GitHub`}
                    className="border-ink/[0.18] text-ink-500 hover:border-ink hover:text-ink inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-[6px] font-mono text-[10.5px] no-underline transition-colors"
                >
                    <GitCommitIcon size={12} />
                    {COMMIT_SHA_SHORT}
                </a>
            )}

            {REPO_URL && (
                <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    title="View source on GitHub"
                    className={iconButtonClass}
                >
                    <GitHubIcon size={15} />
                </a>
            )}

            <button
                type="button"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
                className={cn(iconButtonClass, "cursor-pointer")}
            >
                {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            </button>
        </div>
    );
}
