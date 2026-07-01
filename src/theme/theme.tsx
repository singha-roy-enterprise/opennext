"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "sre_theme";

/**
 * Inline script injected in <head> so the theme class is applied before first
 * paint — avoids a flash of the wrong theme. Kept as a string because it must
 * run synchronously ahead of hydration.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function currentTheme(): Theme {
    if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) return "dark";
    return "light";
}

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    // Server and first client render both assume "light" to match markup; the
    // real theme (already applied to <html> by themeInitScript) is synced after
    // mount to avoid a hydration mismatch.
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(currentTheme());
    }, []);

    const apply = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
            // ignore
        }
        document.documentElement.classList.toggle("dark", next === "dark");
    }, []);

    const toggleTheme = useCallback(() => {
        apply(currentTheme() === "dark" ? "light" : "dark");
    }, [apply]);

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, toggleTheme, setTheme: apply }),
        [theme, toggleTheme, apply],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
    return ctx;
}
