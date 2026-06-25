import { db } from "../db";

export class UserRepository {
  upsertGoogleProfile(profile: { sub: string; email: string }) {
    return db.user.upsert({
      where: { googleSubject: profile.sub },
      create: { googleSubject: profile.sub, email: profile.email },
      update: { email: profile.email }
    });
  }

  upsertPreviewTestUser(input: { id: string; googleSubject: string; email: string }) {
    return db.user.upsert({
      where: { googleSubject: input.googleSubject },
      create: input,
      update: { email: input.email }
    });
  }

  get(ownerId: string) {
    return db.user.findUnique({ where: { id: ownerId } });
  }
}
