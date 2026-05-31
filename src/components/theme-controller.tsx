"use client";

import { useEffect } from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type EffectiveTheme = "light" | "dark";

const storageKey = "focus-calendar-theme";

export function resolveTheme(theme: ThemeChoice | null, devicePrefersDark: boolean): EffectiveTheme {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return devicePrefersDark ? "dark" : "light";
}

export function ThemeController() {
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      const choice = readStoredTheme();
      document.documentElement.dataset.theme = resolveTheme(choice, media?.matches ?? false);
    };
    apply();
    media?.addEventListener("change", apply);
    return () => media?.removeEventListener("change", apply);
  }, []);

  return null;
}

export function saveTheme(theme: ThemeChoice) {
  window.localStorage.setItem(storageKey, theme);
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  document.documentElement.dataset.theme = resolveTheme(theme, dark);
}

export function readStoredTheme(): ThemeChoice {
  const value = window.localStorage.getItem(storageKey);
  return value === "light" || value === "dark" ? value : "system";
}
