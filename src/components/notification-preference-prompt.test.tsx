import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { NotificationPreferencePrompt } from "./notification-preference-prompt";

it("shows notification preference actions before the first choice", () => {
  render(<NotificationPreferencePrompt status={{ configured: true, notificationPromptCompleted: false }} onEnable={vi.fn()} onDisable={vi.fn()} />);
  expect(screen.getByRole("button", { name: "알림 켜기" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "나중에 설정" })).toBeInTheDocument();
});
