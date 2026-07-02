/**
 * Password hashing for the Workers runtime, built on Web Crypto (SubtleCrypto)
 * — no native bcrypt/argon2 dependency, which wouldn't run on Cloudflare.
 *
 * Hashes are PBKDF2-HMAC-SHA256, serialised as `pbkdf2$<iterations>$<saltB64>$<hashB64>`
 * so the parameters travel with the hash and can be verified independently.
 */

const ITERATIONS = 100_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function deriveBits(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        key,
        KEY_BYTES * 8,
    );
    return new Uint8Array(bits);
}

/** Hash a plaintext password into a self-describing `pbkdf2$…` string. */
export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const hash = await deriveBits(password, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Constant-time verify of a plaintext password against a stored `pbkdf2$…` hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [scheme, iterationsRaw, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2" || !iterationsRaw || !saltB64 || !hashB64) return false;

    const iterations = Number.parseInt(iterationsRaw, 10);
    if (!Number.isFinite(iterations)) return false;

    const expected = fromBase64(hashB64);
    const actual = await deriveBits(password, fromBase64(saltB64), iterations);
    if (actual.length !== expected.length) return false;

    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
}
