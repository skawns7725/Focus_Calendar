import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("./account-status", () => ({ AccountStatus: () => <a href="/api/google/connect?mode=read">Google로 로그인</a> }));

it("keeps one responsive account access control", () => {
  render(<AppShell title="테스트" subtitle="설명">내용</AppShell>);

  expect(screen.getAllByRole("link", { name: "Google로 로그인" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Google로 로그인" }).parentElement).toHaveClass("account-slot");
});
