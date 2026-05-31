# Vercel And Neon Deployment Design

## Goal

Deploy Focus Calendar on Vercel Hobby while keeping application data in a free Neon PostgreSQL database connected through the Vercel Marketplace.

## Architecture

- Vercel hosts the Next.js application and provides the public HTTPS URL.
- Neon stores persistent relational data. Vercel injects the PostgreSQL `DATABASE_URL` after the Marketplace resource is connected.
- The Vercel build command applies the Prisma schema with `prisma db push` before building the Next.js application.
- cron-job.org calls the existing protected scheduler endpoints with `Authorization: Bearer <SCHEDULER_SECRET>`.
- Local and Docker deployments use PostgreSQL as well, avoiding different database providers across environments.

## Configuration

The Vercel project requires:

- `DATABASE_URL`, injected by the Neon integration;
- Google OAuth credentials and the deployed callback URL;
- `GOOGLE_OAUTH_STATE_SECRET`;
- `GOOGLE_TOKEN_ENCRYPTION_KEY`;
- `SCHEDULER_SECRET`;
- VAPID settings for browser push.

## Deployment Flow

1. Push the repository to GitHub.
2. Import the repository as a new Vercel project.
3. Install a Neon PostgreSQL resource from the Vercel Marketplace and connect it to the project.
4. Add the application secrets and redeploy.
5. Register the deployed Google OAuth callback URL.
6. Configure cron-job.org to call reconciliation every 15 minutes and notification dispatch every 5 minutes.

## Error Handling

- Builds fail if `DATABASE_URL` is missing or unreachable, preventing a deployment that cannot store data.
- Scheduler requests return `401` when the Bearer token differs from `SCHEDULER_SECRET`.
- Google OAuth setup is completed only after the final Vercel domain is known.

## Verification

- Generate the Prisma client against the PostgreSQL schema.
- Run unit tests and the Next.js production build.
- Run `git diff --check`.
- After the Neon resource exists, run `npm run db:push` with its `DATABASE_URL`.
- After deployment, test both scheduler URLs from cron-job.org and confirm HTTP `200`.
