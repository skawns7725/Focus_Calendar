import { Quest } from "@/domain/types";

export async function listQuests(): Promise<Quest[]> {
  return request("/api/quests");
}

export async function createQuest(input: unknown): Promise<Quest> {
  return request("/api/quests", { method: "POST", body: JSON.stringify(input) });
}

export async function completeQuest(id: string): Promise<Quest> {
  return request(`/api/quests/${id}/complete`, { method: "POST" });
}

export async function abandonQuest(id: string): Promise<Quest> {
  return request(`/api/quests/${id}/abandon`, { method: "POST" });
}

export async function updateQuest(id: string, input: Partial<Quest>): Promise<Quest> {
  return request(`/api/quests/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export async function reconcileSchedule() {
  return request("/api/schedule/reconcile", { method: "POST" });
}

export async function listUnreadNotifications() {
  return request("/api/notifications");
}

export async function markNotificationsRead(ids: string[]) {
  return request("/api/notifications", { method: "PATCH", body: JSON.stringify({ ids }) });
}

export async function moveQuestToNearestDay(id: string): Promise<Quest> {
  return request(`/api/quests/${id}/move-nearest`, { method: "POST" });
}

export async function getSettings() {
  return request("/api/settings");
}

export async function updateSettings(input: unknown) {
  return request("/api/settings", { method: "PUT", body: JSON.stringify(input) });
}

export async function getGoogleStatus() {
  return request("/api/google/status");
}

export async function listGoogleCalendars() {
  return request("/api/google/calendars");
}

export async function syncGoogleCalendar() {
  return request("/api/google/sync", { method: "POST" });
}

export async function getPushStatus() {
  return request("/api/push/status");
}

export async function subscribePush(input: unknown) {
  return request("/api/push/subscribe", { method: "POST", body: JSON.stringify(input) });
}

export async function unsubscribePush(endpoint?: string) {
  return request("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) });
}

export async function getAuthStatus() {
  return request("/api/auth/status");
}

export async function signOut() {
  return request("/api/auth/sign-out", { method: "POST" });
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "요청을 처리하지 못했습니다." }));
    throw new Error(payload.error ?? "요청을 처리하지 못했습니다.");
  }
  return response.json();
}
