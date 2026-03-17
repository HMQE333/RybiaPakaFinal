-- AlterTable: User - add banner, pronouns and onboarding tracking fields
ALTER TABLE "User" ADD COLUMN "bannerUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "pronouns" TEXT;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
