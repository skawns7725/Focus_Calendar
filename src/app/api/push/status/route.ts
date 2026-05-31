import { NextResponse } from "next/server";
import { isPushConfigured, settingsService } from "@/server/services";

export async function GET() {
  const settings = await settingsService.get();
  return NextResponse.json({
    configured: isPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
    notificationPromptCompleted: settings.notificationPromptCompleted,
    browserNotificationsEnabled: settings.browserNotificationsEnabled,
    reminderMinutes: settings.reminderMinutes
  });
}
