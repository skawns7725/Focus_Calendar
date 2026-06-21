-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "location" TEXT,
    "kind" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "expectedMinutes" INTEGER NOT NULL,
    "plannedStart" TIMESTAMP(3),
    "importance" INTEGER NOT NULL,
    "carryoverCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "recurrenceJson" TEXT,
    "lastCarryoverDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarBlock" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "calendarId" TEXT,
    "googleEventId" TEXT,
    "title" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "CalendarBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',
    "weekdayStart" TEXT NOT NULL DEFAULT '09:00',
    "weekdayEnd" TEXT NOT NULL DEFAULT '22:00',
    "weekendStart" TEXT NOT NULL DEFAULT '10:00',
    "weekendEnd" TEXT NOT NULL DEFAULT '22:00',
    "defaultView" TEXT NOT NULL DEFAULT 'list',
    "timeZone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "twoWaySync" BOOLEAN NOT NULL DEFAULT false,
    "googleImportMode" TEXT DEFAULT 'all',
    "selectedGoogleCalendarIdsJson" TEXT NOT NULL DEFAULT '[]',
    "notificationPromptCompleted" BOOLEAN NOT NULL DEFAULT false,
    "browserNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderMinutes" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderDelivery" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "ReminderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleConnection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "dedicatedCalendarId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleEventMapping" (
    "id" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "googleUpdatedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "GoogleEventMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleCalendarCursor" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "syncToken" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL DEFAULT 'local',

    CONSTRAINT "GoogleCalendarCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarBlock_ownerId_externalId_key" ON "CalendarBlock"("ownerId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_ownerId_key" ON "Settings"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_ownerId_endpoint_key" ON "PushSubscription"("ownerId", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderDelivery_ownerId_questId_scheduledStart_key" ON "ReminderDelivery"("ownerId", "questId", "scheduledStart");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleConnection_ownerId_key" ON "GoogleConnection"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleEventMapping_ownerId_questId_key" ON "GoogleEventMapping"("ownerId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleEventMapping_ownerId_googleEventId_key" ON "GoogleEventMapping"("ownerId", "googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleCalendarCursor_ownerId_calendarId_key" ON "GoogleCalendarCursor"("ownerId", "calendarId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
