import type { NextConfig } from "next";
import { execSync } from "node:child_process";

/** Run a git command at build time, swallowing any error (e.g. git absent). */
function tryGit(cmd: string): string | undefined {
    try {
        return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || undefined;
    } catch {
        return undefined;
    }
}

/** Resolve the full commit SHA from CI env vars, falling back to local git. */
function resolveCommitSHA(): string {
    return (
        process.env.NEXT_PUBLIC_COMMIT_SHA ||
        process.env.CF_PAGES_COMMIT_SHA ||
        process.env.WORKERS_CI_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA ||
        tryGit("git rev-parse HEAD") ||
        ""
    );
}

/** Normalize an `git@host:owner/repo.git` or https remote into a browsable URL. */
function normalizeRepoURL(raw?: string): string {
    if (!raw) return "";
    let url = raw.trim();
    const ssh = url.match(/^git@([^:]+):(.+?)(?:\.git)?$/);
    if (ssh) url = `https://${ssh[1]}/${ssh[2]}`;
    return url.replace(/\.git$/, "");
}

/** Resolve the repo URL from an env override, else the first configured remote. */
function resolveRepoURL(): string {
    if (process.env.NEXT_PUBLIC_REPO_URL) return normalizeRepoURL(process.env.NEXT_PUBLIC_REPO_URL);
    const remote = tryGit("git remote");
    const name = remote?.split(/\s+/)[0];
    return normalizeRepoURL(name ? tryGit(`git remote get-url ${name}`) : undefined);
}

const nextConfig: NextConfig = {
    env: {
        NEXT_PUBLIC_COMMIT_SHA: resolveCommitSHA(),
        NEXT_PUBLIC_REPO_URL: resolveRepoURL(),
    },
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
