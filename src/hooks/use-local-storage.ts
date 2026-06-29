import { useCallback, useEffect, useState } from "react";

/**
 * A hook that persists state to localStorage with automatic JSON serialization.
 * Falls back to the provided default value if localStorage is empty or invalid.
 *
 * SSR-safe: the initial render (server + first client paint) always uses
 * `defaultValue`, then the stored value is hydrated in an effect after mount.
 * This avoids hydration mismatches under Next.js while preserving the original
 * behaviour — the default value is NOT written to localStorage automatically,
 * so code-side default changes are reflected on next load unless the user has
 * explicitly saved their own values.
 *
 * @param key - The localStorage key
 * @param defaultValue - Default value to use if nothing in localStorage
 * @returns [value, setValue] - Similar to useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [value, setValue] = useState<T>(defaultValue);

    // Hydrate from localStorage after mount (client only).
    useEffect(() => {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                setValue(JSON.parse(stored) as T);
            }
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    // Wrapper for setValue that persists to localStorage on explicit changes.
    // If the new value matches the default, remove from localStorage so
    // code-side default updates are always reflected.
    const setStoredValue = useCallback(
        (newValue: T | ((prev: T) => T)) => {
            setValue((prev) => {
                const resolved = typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
                try {
                    if (JSON.stringify(resolved) === JSON.stringify(defaultValue)) {
                        localStorage.removeItem(key);
                    } else {
                        localStorage.setItem(key, JSON.stringify(resolved));
                    }
                } catch (error) {
                    console.warn(`Error writing to localStorage key "${key}":`, error);
                }
                return resolved;
            });
        },
        [key, defaultValue],
    );

    return [value, setStoredValue];
}
