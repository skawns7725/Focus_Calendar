import { NextResponse } from "next/server";
import { isPushConfigured } from "@/server/services";
import { getRequestServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { settingsService } = await getRequestServices(request);
  const settings = await settingsService.get();
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
    notificationPromptCompleted: settings.notificationPromptCompleted,
    browserNotificationsEnabled: settings.browserNotificationsEnabled,
    reminderMinutes: settings.reminderMinutes
  });
}
