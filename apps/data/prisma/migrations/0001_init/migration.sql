-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "image" TEXT,
    "name" TEXT NOT NULL DEFAULT '',
    "nick" TEXT,
    "role" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bannedAt" TIMESTAMP(3),
    "banReason" TEXT,
    "banByLabel" TEXT,
    "suspensionUntil" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "suspensionByLabel" TEXT,
    "suspensionAt" TIMESTAMP(3),
    "moderationNoticeType" TEXT,
    "moderationNoticeReason" TEXT,
    "moderationNoticeByLabel" TEXT,
    "moderationNoticeAt" TIMESTAMP(3),
    "moderationNoticeSeenAt" TIMESTAMP(3),
    "username" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rankId" TEXT,
    "regionId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "boardId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishingMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FishingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFishingMethod" (
    "userId" INTEGER NOT NULL,
    "methodId" TEXT NOT NULL,

    CONSTRAINT "UserFishingMethod_pkey" PRIMARY KEY ("userId","methodId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" INTEGER,
    "authorName" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedById" INTEGER,

    CONSTRAINT "ChannelMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMessageArchive" (
    "archiveId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" INTEGER,
    "authorName" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "hiddenAt" TIMESTAMP(3),
    "hiddenById" INTEGER,

    CONSTRAINT "ChannelMessageArchive_pkey" PRIMARY KEY ("archiveId")
);

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "aId" INTEGER NOT NULL,
    "bId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterId" INTEGER,
    "handledById" INTEGER,
    "targetType" TEXT,
    "targetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArchive" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "reporterLabel" TEXT NOT NULL,
    "adminLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "restoredAt" TIMESTAMP(3),

    CONSTRAINT "ContentArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "actorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,

    CONSTRAINT "AdminLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryLike" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryComment" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GalleryComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationSetting" (
    "userId" INTEGER NOT NULL,
    "commentReply" INTEGER NOT NULL DEFAULT 1,
    "commentMention" INTEGER NOT NULL DEFAULT 1,
    "threadMention" INTEGER NOT NULL DEFAULT 1,
    "galleryMention" INTEGER NOT NULL DEFAULT 1,
    "newMessage" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSetting_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nick_key" ON "User"("nick");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_rankId_idx" ON "User"("rankId");

-- CreateIndex
CREATE INDEX "User_regionId_idx" ON "User"("regionId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- CreateIndex
CREATE INDEX "Thread_boardId_createdAt_idx" ON "Thread"("boardId", "createdAt");

-- CreateIndex
CREATE INDEX "Thread_deletedAt_idx" ON "Thread"("deletedAt");

-- CreateIndex
CREATE INDEX "Post_threadId_createdAt_idx" ON "Post"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "Post_deletedAt_idx" ON "Post"("deletedAt");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_userId_type_key" ON "Reaction"("postId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_name_key" ON "Rank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FishingMethod_name_key" ON "FishingMethod"("name");

-- CreateIndex
CREATE INDEX "UserFishingMethod_methodId_idx" ON "UserFishingMethod"("methodId");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_createdAt_idx" ON "Message"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_createdAt_idx" ON "Message"("senderId", "receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_readAt_idx" ON "Message"("receiverId", "readAt");

-- CreateIndex
CREATE INDEX "ChannelMessage_channelId_createdAt_idx" ON "ChannelMessage"("channelId", "createdAt");

-- CreateIndex
CREATE INDEX "ChannelMessage_authorId_createdAt_idx" ON "ChannelMessage"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ChannelMessage_deletedAt_idx" ON "ChannelMessage"("deletedAt");

-- CreateIndex
CREATE INDEX "ChannelMessageArchive_messageId_idx" ON "ChannelMessageArchive"("messageId");

-- CreateIndex
CREATE INDEX "ChannelMessageArchive_channelId_idx" ON "ChannelMessageArchive"("channelId");

-- CreateIndex
CREATE INDEX "ChannelMessageArchive_authorId_idx" ON "ChannelMessageArchive"("authorId");

-- CreateIndex
CREATE INDEX "FriendRequest_receiverId_status_idx" ON "FriendRequest"("receiverId", "status");

-- CreateIndex
CREATE INDEX "FriendRequest_senderId_status_idx" ON "FriendRequest"("senderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Friendship_bId_idx" ON "Friendship"("bId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_aId_bId_key" ON "Friendship"("aId", "bId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "ContentArchive_deletedAt_idx" ON "ContentArchive"("deletedAt");

-- CreateIndex
CREATE INDEX "ContentArchive_expiresAt_idx" ON "ContentArchive"("expiresAt");

-- CreateIndex
CREATE INDEX "ContentArchive_restoredAt_idx" ON "ContentArchive"("restoredAt");

-- CreateIndex
CREATE INDEX "ContentArchive_targetType_targetId_idx" ON "ContentArchive"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminLog_createdAt_idx" ON "AdminLog"("createdAt");

-- CreateIndex
CREATE INDEX "AdminLog_actorId_createdAt_idx" ON "AdminLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryItem_category_createdAt_idx" ON "GalleryItem"("category", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryItem_authorId_createdAt_idx" ON "GalleryItem"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryItem_deletedAt_idx" ON "GalleryItem"("deletedAt");

-- CreateIndex
CREATE INDEX "GalleryLike_userId_idx" ON "GalleryLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryLike_itemId_userId_key" ON "GalleryLike"("itemId", "userId");

-- CreateIndex
CREATE INDEX "GalleryComment_itemId_createdAt_idx" ON "GalleryComment"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryComment_parentId_createdAt_idx" ON "GalleryComment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryComment_authorId_createdAt_idx" ON "GalleryComment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "GalleryComment_deletedAt_idx" ON "GalleryComment"("deletedAt");

-- CreateIndex
CREATE INDEX "GalleryCommentLike_userId_idx" ON "GalleryCommentLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryCommentLike_commentId_userId_key" ON "GalleryCommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Thread" ADD CONSTRAINT "Thread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFishingMethod" ADD CONSTRAINT "UserFishingMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFishingMethod" ADD CONSTRAINT "UserFishingMethod_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "FishingMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessage" ADD CONSTRAINT "ChannelMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessageArchive" ADD CONSTRAINT "ChannelMessageArchive_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "ContentArchive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMessageArchive" ADD CONSTRAINT "ChannelMessageArchive_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendRequest" ADD CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_aId_fkey" FOREIGN KEY ("aId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_bId_fkey" FOREIGN KEY ("bId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminLog" ADD CONSTRAINT "AdminLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GalleryComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryCommentLike" ADD CONSTRAINT "GalleryCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "GalleryComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryCommentLike" ADD CONSTRAINT "GalleryCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationSetting" ADD CONSTRAINT "UserNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

