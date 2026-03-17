-- AlterTable: ChannelMessage - add moderation/soft-delete columns
ALTER TABLE "ChannelMessage" ADD COLUMN "hiddenAt" TIMESTAMP(3);
ALTER TABLE "ChannelMessage" ADD COLUMN "hiddenById" INTEGER;
ALTER TABLE "ChannelMessage" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ChannelMessage" ADD COLUMN "deletedById" INTEGER;

-- CreateIndex for ChannelMessage.deletedAt
CREATE INDEX "ChannelMessage_deletedAt_idx" ON "ChannelMessage"("deletedAt");

-- CreateTable: GalleryItem
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "category" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GalleryLike
CREATE TABLE "GalleryLike" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GalleryComment
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

-- CreateTable: GalleryCommentLike
CREATE TABLE "GalleryCommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for GalleryItem
CREATE INDEX "GalleryItem_category_createdAt_idx" ON "GalleryItem"("category", "createdAt");
CREATE INDEX "GalleryItem_authorId_createdAt_idx" ON "GalleryItem"("authorId", "createdAt");
CREATE INDEX "GalleryItem_deletedAt_idx" ON "GalleryItem"("deletedAt");

-- CreateIndex for GalleryLike
CREATE UNIQUE INDEX "GalleryLike_itemId_userId_key" ON "GalleryLike"("itemId", "userId");
CREATE INDEX "GalleryLike_userId_idx" ON "GalleryLike"("userId");

-- CreateIndex for GalleryComment
CREATE INDEX "GalleryComment_itemId_createdAt_idx" ON "GalleryComment"("itemId", "createdAt");
CREATE INDEX "GalleryComment_parentId_createdAt_idx" ON "GalleryComment"("parentId", "createdAt");
CREATE INDEX "GalleryComment_deletedAt_idx" ON "GalleryComment"("deletedAt");

-- CreateIndex for GalleryCommentLike
CREATE UNIQUE INDEX "GalleryCommentLike_commentId_userId_key" ON "GalleryCommentLike"("commentId", "userId");
CREATE INDEX "GalleryCommentLike_userId_idx" ON "GalleryCommentLike"("userId");

-- AddForeignKey for GalleryItem
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for GalleryLike
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryLike" ADD CONSTRAINT "GalleryLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey for GalleryComment
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "GalleryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryComment" ADD CONSTRAINT "GalleryComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "GalleryComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for GalleryCommentLike
ALTER TABLE "GalleryCommentLike" ADD CONSTRAINT "GalleryCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "GalleryComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GalleryCommentLike" ADD CONSTRAINT "GalleryCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
