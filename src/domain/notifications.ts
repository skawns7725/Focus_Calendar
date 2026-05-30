export type NotificationKind = "start" | "deadline_soon" | "carried_over" | "conflict";

export interface QuestNotification {
  kind: NotificationKind;
  questId: string;
  message: string;
}

