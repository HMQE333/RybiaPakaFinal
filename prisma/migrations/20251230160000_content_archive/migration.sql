-- AlterTable
ALTER TABLE "Thread" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "ContentArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "reporterLabel" TEXT NOT NULL,
    "adminLabel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "restoredAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Thread_deletedAt_idx" ON "Thread"("deletedAt");

-- CreateIndex
CREATE INDEX "Post_deletedAt_idx" ON "Post"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentArchive_deletedAt_idx" ON "ContentArchive"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentArchive_expiresAt_idx" ON "ContentArchive"("expiresAt");

-- CreateIndex
CREATE INDEX "ContentArchive_restoredAt_idx" ON "ContentArchive"("restoredAt");

-- CreateIndex
CREATE INDEX "ContentArchive_targetType_targetId_idx" ON "ContentArchive"("targetType", "targetId");
