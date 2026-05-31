import { db } from "../db";

export class UserRepository {
  upsertGoogleProfile(profile: { sub: string; email: string }) {
    return db.user.upsert({
      where: { googleSubject: profile.sub },
      create: { googleSubject: profile.sub, email: profile.email },
      update: { email: profile.email }
    });
  }

  get(ownerId: string) {
    return db.user.findUnique({ where: { id: ownerId } });
  }
}
