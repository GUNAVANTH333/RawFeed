import prisma from "../utils/prisma.js";

export async function getNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, isRead: false },
  });

  return { notifications, unreadCount };
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
}

export async function markOneRead(notificationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: userId },
    data: { isRead: true },
  });
}

export async function createNotification(data: {
  type: "COMMENT_ON_THREAD" | "REPLY_TO_COMMENT";
  recipientId: string;
  actorPseudonym: string;
  threadId: string;
  threadTitle: string;
  commentId: string;
}) {
  // Never notify someone about their own action
  await prisma.notification.create({ data });
}
