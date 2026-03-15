-- SQLite initial migration: create all tables and indexes
PRAGMA foreign_keys=ON;

-- User and related (auth)
CREATE TABLE IF NOT EXISTS "User" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" DATETIME,
  "passwordHash" TEXT,
  "image" TEXT,
  "name" TEXT,
  "nick" TEXT UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'NORMAL',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "username" TEXT UNIQUE,
  "avatarUrl" TEXT,
  "bio" TEXT,
  "age" INTEGER,
  "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rankId" TEXT,
  "regionId" TEXT,
  FOREIGN KEY ("rankId") REFERENCES "Rank" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User" ("username");

CREATE TABLE IF NOT EXISTS "Account" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" INTEGER NOT NULL,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" DATETIME NOT NULL,
  CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);

-- Forum
CREATE TABLE IF NOT EXISTS "Board" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Thread" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "boardId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Thread_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Thread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Post" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "content" TEXT NOT NULL,
  "threadId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "parentId" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post" ("id") ON UPDATE CASCADE ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS "Reaction" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "type" TEXT NOT NULL,
  "postId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Reaction_post_user_type_unique" UNIQUE ("postId", "userId", "type")
);

-- Profile/ranking
CREATE TABLE IF NOT EXISTS "Rank" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "colorHex" TEXT
);

CREATE TABLE IF NOT EXISTS "Region" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "FishingMethod" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "UserFishingMethod" (
  "userId" INTEGER NOT NULL,
  "methodId" TEXT NOT NULL,
  PRIMARY KEY ("userId", "methodId"),
  CONSTRAINT "UserFishingMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserFishingMethod_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "FishingMethod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserFishingMethod_methodId_idx" ON "UserFishingMethod" ("methodId");

-- Direct messages
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY,
  "senderId" INTEGER NOT NULL,
  "receiverId" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" DATETIME,
  CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Message_senderId_createdAt_idx" ON "Message" ("senderId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_receiverId_createdAt_idx" ON "Message" ("receiverId", "createdAt");

-- Friend requests / friendships
CREATE TABLE IF NOT EXISTS "FriendRequest" (
  "id" TEXT PRIMARY KEY,
  "senderId" INTEGER NOT NULL,
  "receiverId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FriendRequest_sender_receiver_unique" UNIQUE ("senderId", "receiverId")
);

CREATE INDEX IF NOT EXISTS "FriendRequest_receiver_status_idx" ON "FriendRequest" ("receiverId", "status");

CREATE TABLE IF NOT EXISTS "Friendship" (
  "id" TEXT PRIMARY KEY,
  "aId" INTEGER NOT NULL,
  "bId" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Friendship_aId_fkey" FOREIGN KEY ("aId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Friendship_bId_fkey" FOREIGN KEY ("bId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Friendship_a_b_unique" UNIQUE ("aId", "bId")
);

CREATE INDEX IF NOT EXISTS "Friendship_bId_idx" ON "Friendship" ("bId");

-- Notifications
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "payload" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Notification_user_createdAt_idx" ON "Notification" ("userId", "createdAt");

