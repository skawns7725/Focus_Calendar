import { NextResponse } from "next/server";
import { z } from "zod";
import { pushSubscriptionRepository, settingsService } from "@/server/services";

const subscriptionInput = z.object({ endpoint: z.string().url(), p256dh: z.string().min(1), auth: z.string().min(1) });

export async function POST(request: Request) {
  const subscription = subscriptionInput.parse(await request.json());
  await pushSubscriptionRepository.upsert(subscription);
  const settings = await settingsService.get();
  await settingsService.update({ ...settings, notificationPromptCompleted: true, browserNotificationsEnabled: true });
  return NextResponse.json({ subscribed: true });
}

export async function DELETE(request: Request) {
  const { endpoint } = z.object({ endpoint: z.string().url().optional() }).parse(await request.json());
  if (endpoint) await pushSubscriptionRepository.remove(endpoint);
  const hasActiveSubscription = (await pushSubscriptionRepository.list()).length > 0;
  const settings = await settingsService.get();
  await settingsService.update({ ...settings, notificationPromptCompleted: true, browserNotificationsEnabled: hasActiveSubscription });
  return NextResponse.json({ subscribed: hasActiveSubscription });
}
