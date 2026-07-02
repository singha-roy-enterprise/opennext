/**
 * Opaque server-side sessions: a random token stored in the `sessions` table and
 * mirrored to the client in an httpOnly cookie. The cookie carries no user data
 * — it's just the lookup key — so it can't be tampered into a different identity.
 */

export const SESSION_COOKIE = "sre_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** 256 bits of hex randomness — the session lookup key. */
export function generateSessionToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function sessionExpiry(from: Date = new Date()): Date {
    return new Date(from.getTime() + SESSION_TTL_MS);
}

/** Build the `Set-Cookie` value that stores a session token. */
export function buildSessionCookie(token: string, expires: Date, secure: boolean): string {
    const parts = [
        `${SESSION_COOKIE}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        `Expires=${expires.toUTCString()}`,
    ];
    if (secure) parts.push("Secure");
    return parts.join("; ");
}

/** Build the `Set-Cookie` value that clears the session cookie. */
export function buildClearSessionCookie(secure: boolean): string {
    const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
    if (secure) parts.push("Secure");
    return parts.join("; ");
}

/** Pull a single cookie value out of a raw `Cookie` header. */
export function readCookie(header: string | null, name: string): string | null {
    if (!header) return null;
    for (const part of header.split(/; */)) {
        const eq = part.indexOf("=");
        if (eq === -1) continue;
        if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
    }
    return null;
}
