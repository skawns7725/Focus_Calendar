import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AppNavigation } from "./app-navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings"
}));

it("marks the current desktop and mobile navigation links as active", () => {
  render(<><AppNavigation variant="desktop" /><AppNavigation variant="mobile" /></>);

  expect(screen.getAllByRole("link", { name: "설정" })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: "설정" }).every((link) => link.classList.contains("active"))).toBe(true);
  expect(screen.getAllByRole("link", { name: "할 일 목록" }).every((link) => !link.classList.contains("active"))).toBe(true);
});
