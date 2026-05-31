import { expect, it, vi } from "vitest";
import { enableBrowserNotifications } from "./push";

it("requests browser permission and serializes the push subscription", async () => {
  const requestPermission = vi.fn(async () => "granted" as NotificationPermission);
  const subscribe = vi.fn(async () => ({
    endpoint: "https://push.example/device",
    toJSON: () => ({ endpoint: "https://push.example/device", keys: { p256dh: "key", auth: "auth" } })
  }));
  Object.defineProperty(globalThis, "Notification", { configurable: true, value: { requestPermission } });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn(async () => ({ pushManager: { subscribe } })) }
  });

  expect(await enableBrowserNotifications("AQAB")).toEqual({ endpoint: "https://push.example/device", p256dh: "key", auth: "auth" });
  expect(requestPermission).toHaveBeenCalledTimes(1);
});
