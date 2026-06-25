import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { middleware } from "./middleware";

afterEach(() => {
  vi.unstubAllEnvs();
});

it("allows the preview test login route to perform its own authorization", async () => {
  vi.stubEnv("NODE_ENV", "production");

  const response = middleware(new NextRequest("https://focus-calendar.example/api/test/login"));

  expect(response.status).toBe(200);
});

it("keeps private API routes behind the session guard in production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  const response = middleware(new NextRequest("https://focus-calendar.example/api/quests"));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({ error: "Sign in required" });
});
