import { act, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ThemeController, resolveTheme } from "./theme-controller";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

it("defaults to light theme on the first visit", () => {
  expect(resolveTheme(null, false)).toBe("light");
});

it("restores a stored dark theme", () => {
  window.localStorage.setItem("focus-calendar-theme", "dark");
  render(<ThemeController />);
  expect(document.documentElement.dataset.theme).toBe("dark");
});

it("follows the device preference when system theme is stored", () => {
  const listeners: Array<() => void> = [];
  let dark = true;
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return dark; },
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
    removeEventListener: vi.fn()
  })));
  window.localStorage.setItem("focus-calendar-theme", "system");
  render(<ThemeController />);
  expect(document.documentElement.dataset.theme).toBe("dark");

  dark = false;
  act(() => listeners.forEach((listener) => listener()));
  expect(document.documentElement.dataset.theme).toBe("light");
});

