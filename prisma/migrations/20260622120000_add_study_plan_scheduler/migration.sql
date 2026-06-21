CREATE TABLE "StudyPlan" (
  "id" TEXT NOT NULL,
  "examName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "examDate" DATE NOT NULL,
  "scope" TEXT NOT NULL,
  "progress" INTEGER NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "dailyMinutes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT NOT NULL DEFAULT 'local',
  CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyBlock" (
  "id" TEXT NOT NULL,
  "studyPlanId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "stage" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudyBlock_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyPlan_ownerId_examDate_idx" ON "StudyPlan"("ownerId", "examDate");
CREATE INDEX "StudyBlock_studyPlanId_date_status_idx" ON "StudyBlock"("studyPlanId", "date", "status");

ALTER TABLE "StudyBlock"
  ADD CONSTRAINT "StudyBlock_studyPlanId_fkey"
  FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
