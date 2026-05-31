import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { AccountStatus } from "./account-status";
import { getAuthStatus, signOut } from "@/client/api";

vi.mock("@/client/api", () => ({ getAuthStatus: vi.fn(), signOut: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

it("shows Google login when signed out", async () => {
  vi.mocked(getAuthStatus).mockResolvedValue({ signedIn: false, localDevelopment: false, email: null });
  render(<AccountStatus />);
  expect(await screen.findByRole("link", { name: "Google로 로그인" })).toHaveAttribute("href", "/api/google/connect?mode=read");
});

it("shows the signed-in email and signs out", async () => {
  vi.mocked(getAuthStatus).mockResolvedValue({ signedIn: true, localDevelopment: false, email: "user@example.com" });
  vi.mocked(signOut).mockResolvedValue({ signedOut: true });
  render(<AccountStatus />);
  expect(await screen.findByText("user@example.com")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "로그아웃" }));
  expect(signOut).toHaveBeenCalled();
});

it("labels local development", async () => {
  vi.mocked(getAuthStatus).mockResolvedValue({ signedIn: false, localDevelopment: true, email: null });
  render(<AccountStatus />);
  expect(await screen.findByText("로컬 개발 모드")).toBeInTheDocument();
});
