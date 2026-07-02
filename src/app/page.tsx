"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/auth/session";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { SignInIcon, EyeIcon, ArrowRightIcon, LockIcon } from "@/ui/icons";

export default function HomePage() {
    const { isSignedIn, isAdmin, session, openAuth, signOut } = useSession();
    const router = useRouter();

    return (
        <div className="bg-paper flex min-h-screen flex-col">
            <div className="bg-accent h-1" />
            <AppHeader showNav={false} />

            <main className="flex flex-1 items-center justify-center px-7 py-12">
                <div className="w-full max-w-[760px]">
                    <div className="mb-[34px] text-center">
                        <div className="text-accent mb-[18px] font-mono text-[11px] tracking-[0.16em]">
                            GSTIN 19ALAPR8029B1Z5 · BALURGHAT, WEST BENGAL
                        </div>
                        <h1 className="m-0 font-serif text-[60px] leading-[0.95] font-medium tracking-[-0.015em]">
                            Singha Roy Enterprise
                        </h1>
                        <p className="text-ink-700 mt-[18px] mb-0 text-[15px] leading-[1.5]">
                            GST tax-invoice generator &amp; live stock ledger.
                            <br />
                            Sign in for full access, or browse inventory as a guest.
                        </p>
                    </div>

                    {!isSignedIn ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Card variant="solid" className="flex flex-col px-6 py-[26px]">
                                    <div className="border-ink mb-[18px] flex size-[42px] items-center justify-center rounded-[3px] border-[1.5px]">
                                        <SignInIcon size={20} />
                                    </div>
                                    <h2 className="mt-0 mb-2 font-serif text-[23px] font-semibold">
                                        Sign in to your account
                                    </h2>
                                    <p className="text-ink-700 mt-0 mb-[22px] flex-1 text-[13px] leading-[1.5]">
                                        Sign in with your username or email and password to generate GST invoices and
                                        manage inventory with full edit access.
                                    </p>
                                    <Button variant="primary" onClick={openAuth} className="gap-[9px] p-[13px]">
                                        <SignInIcon size={15} />
                                        Sign in
                                    </Button>
                                </Card>

                                <Card variant="dashed" className="flex flex-col px-6 py-[26px]">
                                    <div className="border-ink/40 text-ink-700 mb-[18px] flex size-[42px] items-center justify-center rounded-[3px] border-[1.5px]">
                                        <EyeIcon size={20} />
                                    </div>
                                    <h2 className="mt-0 mb-2 font-serif text-[23px] font-semibold">
                                        Continue as guest
                                    </h2>
                                    <p className="text-ink-700 mt-0 mb-[22px] flex-1 text-[13px] leading-[1.5]">
                                        Browse the live stock ledger in read-only mode. The invoice generator stays
                                        admin-only.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/inventory")}
                                        className="gap-[9px] p-[13px]"
                                    >
                                        View inventory <ArrowRightIcon size={15} />
                                    </Button>
                                </Card>
                            </div>
                            <p className="text-ink-500 mt-[22px] mb-0 text-center font-mono text-[11px]">
                                Editing &amp; invoicing are limited to admin accounts.
                            </p>
                        </>
                    ) : (
                        <Card variant="solid" className="px-7 py-[30px]">
                            <div className="border-ink/[0.14] flex items-center gap-3.5 border-b pb-[22px]">
                                <div className="bg-ink text-cream flex size-12 items-center justify-center font-serif text-[20px]">
                                    {session.user?.initials}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[16px] font-bold">{session.user?.name}</div>
                                    <div className="text-ink-500 font-mono text-[11.5px]">
                                        {session.user?.login} · {isAdmin ? "Full access" : "Read-only access"}
                                    </div>
                                </div>
                                <Badge
                                    tone={isAdmin ? "success" : "neutral"}
                                    className="px-2.5 py-[5px] tracking-[0.05em]"
                                >
                                    {isAdmin ? "ADMIN" : "USER"}
                                </Badge>
                            </div>

                            <div className="mt-[22px] grid grid-cols-2 gap-3.5">
                                <Link
                                    href="/inventory"
                                    className="border-ink/[0.18] text-ink hover:border-accent bg-surface flex items-center justify-between gap-2.5 rounded-[3px] border px-5 py-[18px] no-underline transition-colors"
                                >
                                    <span>
                                        <span className="block text-[14px] font-bold">Inventory</span>
                                        <span className="text-ink-500 text-[11.5px]">Stock ledger</span>
                                    </span>
                                    <ArrowRightIcon size={18} className="text-accent" />
                                </Link>

                                {isAdmin ? (
                                    <Link
                                        href="/invoice"
                                        className="border-ink/[0.18] text-ink hover:border-accent bg-surface flex items-center justify-between gap-2.5 rounded-[3px] border px-5 py-[18px] no-underline transition-colors"
                                    >
                                        <span>
                                            <span className="block text-[14px] font-bold">Invoice Generator</span>
                                            <span className="text-ink-500 text-[11.5px]">Create GST invoices</span>
                                        </span>
                                        <ArrowRightIcon size={18} className="text-accent" />
                                    </Link>
                                ) : (
                                    <div className="border-ink/25 text-ink-300 flex items-center gap-2.5 rounded-[3px] border border-dashed px-5 py-[18px]">
                                        <LockIcon size={17} />
                                        <span>
                                            <span className="block text-[14px] font-bold">Invoice Generator</span>
                                            <span className="text-[11.5px]">Admin access required</span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 flex gap-3.5 text-[12.5px]">
                                <Button variant="link" onClick={openAuth}>
                                    Switch account
                                </Button>
                                <Button
                                    variant="link"
                                    onClick={signOut}
                                    className="text-ink-500 hover:text-danger hover:no-underline"
                                >
                                    Sign out
                                </Button>
                            </div>
                        </Card>
                    )}
                </div>
            </main>

            <footer className="border-ink/[0.14] text-ink-300 border-t px-7 py-[18px] text-center font-mono text-[10.5px] tracking-[0.04em]">
                SINGHA ROY ENTERPRISE · SINGHA ROY BHABAN, SAHEB KACHARI PARA, BALURGHAT 733101 · v2.0
            </footer>
        </div>
    );
}
