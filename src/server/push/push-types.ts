export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  kind: string;
  questId: string;
  title: string;
  body: string;
  url: string;
}
