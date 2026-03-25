-- CreateTable
CREATE TABLE "thread_likes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "thread_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "thread_likes_userId_threadId_key" ON "thread_likes"("userId", "threadId");

-- AddForeignKey
ALTER TABLE "thread_likes" ADD CONSTRAINT "thread_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thread_likes" ADD CONSTRAINT "thread_likes_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
