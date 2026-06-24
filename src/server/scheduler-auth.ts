export function isSchedulerAuthorized(authorization: string | null, secret: string | undefined): boolean {
  return !secret || authorization === `Bearer ${secret}`;
}

export function schedulerSecret(env: Record<string, string | undefined> = process.env) {
  return env.SCHEDULER_SECRET || env.CRON_SECRET;
}
