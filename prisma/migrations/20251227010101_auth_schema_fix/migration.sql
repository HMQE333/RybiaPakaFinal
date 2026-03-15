-- Align auth tables with better-auth Prisma schema.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Rebuild User to convert emailVerified to boolean and enforce defaults.
CREATE TABLE "new_User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT 0,
  "passwordHash" TEXT,
  "image" TEXT,
  "name" TEXT NOT NULL DEFAULT '',
  "nick" TEXT,
  "role" TEXT NOT NULL DEFAULT 'NORMAL',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "username" TEXT,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "age" INTEGER,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rankId" TEXT,
  "regionId" TEXT,
  CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_User" (
  "id",
  "email",
  "emailVerified",
  "passwordHash",
  "image",
  "name",
  "nick",
  "role",
  "createdAt",
  "updatedAt",
  "username",
  "avatarUrl",
  "bio",
  "age",
  "joinedAt",
  "rankId",
  "regionId"
)
SELECT
  "id",
  "email",
  CASE WHEN "emailVerified" IS NULL THEN 0 ELSE 1 END,
  "passwordHash",
  "image",
  COALESCE("name", ''),
  "nick",
  COALESCE("role", 'NORMAL'),
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  COALESCE("updatedAt", CURRENT_TIMESTAMP),
  "username",
  "avatarUrl",
  "bio",
  "age",
  COALESCE("joinedAt", CURRENT_TIMESTAMP),
  "rankId",
  "regionId"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_nick_key" ON "User"("nick");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_rankId_idx" ON "User"("rankId");
CREATE INDEX "User_regionId_idx" ON "User"("regionId");

-- Rebuild Account to match better-auth columns.
CREATE TABLE "new_Account" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "providerId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" DATETIME,
  "refreshTokenExpiresAt" DATETIME,
  "scope" TEXT,
  "password" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Account" (
  "id",
  "userId",
  "providerId",
  "accountId",
  "accessToken",
  "refreshToken",
  "idToken",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "scope",
  "password",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "userId",
  "provider",
  "providerAccountId",
  "access_token",
  "refresh_token",
  "id_token",
  CASE WHEN "expires_at" IS NULL THEN NULL ELSE datetime("expires_at", 'unixepoch') END,
  NULL,
  "scope",
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Account";

DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";

CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Rebuild Session to use token/expiresAt columns.
CREATE TABLE "new_Session" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "token" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Session" (
  "id",
  "token",
  "userId",
  "expiresAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "sessionToken",
  "userId",
  "expires",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Session";

DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- Replace VerificationToken with Verification (better-auth).
CREATE TABLE "Verification" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Verification" (
  "identifier",
  "value",
  "expiresAt",
  "createdAt",
  "updatedAt"
)
SELECT
  "identifier",
  "token",
  "expires",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "VerificationToken";

DROP TABLE "VerificationToken";

CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Ensure channel messages table exists for chat.
CREATE TABLE IF NOT EXISTS "ChannelMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "channelId" TEXT NOT NULL,
  "authorId" INTEGER,
  "authorName" TEXT,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChannelMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChannelMessage_channelId_createdAt_idx" ON "ChannelMessage"("channelId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChannelMessage_authorId_createdAt_idx" ON "ChannelMessage"("authorId", "createdAt");
