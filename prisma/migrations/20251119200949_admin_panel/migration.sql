/*
  Warnings:

  - You are about to alter the column `payload` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Made the column `id` on table `FishingMethod` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `FriendRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Friendship` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Message` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Rank` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id` on table `Region` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterId" INTEGER,
    "handledById" INTEGER,
    "targetType" TEXT,
    "targetId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "actorId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    CONSTRAINT "AdminLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FishingMethod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_FishingMethod" ("id", "name") SELECT "id", "name" FROM "FishingMethod";
DROP TABLE "FishingMethod";
ALTER TABLE "new_FishingMethod" RENAME TO "FishingMethod";
CREATE UNIQUE INDEX "FishingMethod_name_key" ON "FishingMethod"("name");
CREATE TABLE "new_FriendRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FriendRequest" ("createdAt", "id", "receiverId", "senderId", "status") SELECT "createdAt", "id", "receiverId", "senderId", "status" FROM "FriendRequest";
DROP TABLE "FriendRequest";
ALTER TABLE "new_FriendRequest" RENAME TO "FriendRequest";
CREATE INDEX "FriendRequest_receiverId_status_idx" ON "FriendRequest"("receiverId", "status");
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");
CREATE TABLE "new_Friendship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aId" INTEGER NOT NULL,
    "bId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Friendship_aId_fkey" FOREIGN KEY ("aId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friendship_bId_fkey" FOREIGN KEY ("bId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Friendship" ("aId", "bId", "createdAt", "id") SELECT "aId", "bId", "createdAt", "id" FROM "Friendship";
DROP TABLE "Friendship";
ALTER TABLE "new_Friendship" RENAME TO "Friendship";
CREATE INDEX "Friendship_bId_idx" ON "Friendship"("bId");
CREATE UNIQUE INDEX "Friendship_aId_bId_key" ON "Friendship"("aId", "bId");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("createdAt", "id", "readAt", "receiverId", "senderId", "text") SELECT "createdAt", "id", "readAt", "receiverId", "senderId", "text" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "payload", "readAt", "type", "userId") SELECT "createdAt", "id", "payload", "readAt", "type", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE TABLE "new_Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Post" ("authorId", "content", "createdAt", "id", "parentId", "threadId") SELECT "authorId", "content", "createdAt", "id", "parentId", "threadId" FROM "Post";
DROP TABLE "Post";
ALTER TABLE "new_Post" RENAME TO "Post";
CREATE TABLE "new_Rank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "colorHex" TEXT
);
INSERT INTO "new_Rank" ("colorHex", "id", "name") SELECT "colorHex", "id", "name" FROM "Rank";
DROP TABLE "Rank";
ALTER TABLE "new_Rank" RENAME TO "Rank";
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");
CREATE TABLE "new_Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Region" ("id", "name") SELECT "id", "name" FROM "Region";
DROP TABLE "Region";
ALTER TABLE "new_Region" RENAME TO "Region";
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- RedefineIndex (using IF NOT EXISTS to avoid dropping SQLite auto indexes)
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "Reaction_postId_userId_type_key" ON "Reaction"("postId", "userId", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "User_nick_key" ON "User"("nick");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");

