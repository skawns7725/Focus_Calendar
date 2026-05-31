export function isSchedulerAuthorized(authorization: string | null, secret: string | undefined): boolean {
  return !secret || authorization === `Bearer ${secret}`;
}
