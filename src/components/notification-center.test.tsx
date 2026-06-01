import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { listUnreadNotifications, markNotificationsRead } from "@/client/api";
import { NotificationCenter } from "./notification-center";

vi.mock("@/client/api", () => ({
  listUnreadNotifications: vi.fn(async () => [{ id: "n1", kind: "carried_over", questId: "q1", message: "일정이 다음 날로 이동했습니다." }]),
  markNotificationsRead: vi.fn(async () => undefined)
}));

afterEach(cleanup);

it("shows unread notices and marks them read after confirmation", async () => {
  render(<NotificationCenter />);

  expect(await screen.findByLabelText("알림 1개")).toBeVisible();
  fireEvent.click(screen.getByLabelText("알림 1개"));
  expect(screen.getByText("일정이 다음 날로 이동했습니다.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "모두 확인" }));

  await waitFor(() => expect(markNotificationsRead).toHaveBeenCalledWith(["n1"]));
  expect(listUnreadNotifications).toHaveBeenCalled();
});
