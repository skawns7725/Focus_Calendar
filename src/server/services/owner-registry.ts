import { db } from "../db";

export async function listOwnerIds(environment = process.env.NODE_ENV) {
  const ids = (await db.user.findMany({ select: { id: true } })).map((user) => user.id);
  return environment === "production" ? ids : [...new Set(["local", ...ids])];
}
