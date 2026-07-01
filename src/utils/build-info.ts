/**
 * Build-time git metadata, injected via `next.config.ts` env. The values are
 * inlined at build so they are safe to read on both the server and the client.
 */
export const COMMIT_SHA = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";
export const COMMIT_SHA_SHORT = COMMIT_SHA.slice(0, 7);
export const REPO_URL = process.env.NEXT_PUBLIC_REPO_URL ?? "";
export const COMMIT_URL = REPO_URL && COMMIT_SHA ? `${REPO_URL}/commit/${COMMIT_SHA}` : REPO_URL;
