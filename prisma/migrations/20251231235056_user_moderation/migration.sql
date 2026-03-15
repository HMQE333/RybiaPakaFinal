-- AlterTable
ALTER TABLE "User" ADD COLUMN "bannedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "banReason" TEXT;
ALTER TABLE "User" ADD COLUMN "banByLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "suspensionUntil" DATETIME;
ALTER TABLE "User" ADD COLUMN "suspensionReason" TEXT;
ALTER TABLE "User" ADD COLUMN "suspensionByLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "suspensionAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "moderationNoticeType" TEXT;
ALTER TABLE "User" ADD COLUMN "moderationNoticeReason" TEXT;
ALTER TABLE "User" ADD COLUMN "moderationNoticeByLabel" TEXT;
ALTER TABLE "User" ADD COLUMN "moderationNoticeAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "moderationNoticeSeenAt" DATETIME;
