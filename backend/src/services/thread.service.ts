import prisma from "../utils/prisma.js";
import { IdentityService } from "./identity.service.js";

export class ThreadService {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  createThread = async (
    userId: string,
    data: { title: string; description?: string; url?: string; domain?: string; imageUrl?: string; isAnonymous?: boolean }
  ) => {
    const thread = await prisma.thread.create({
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url || null,
        domain: data.domain || null,
        imageUrl: data.imageUrl || null,
        isAnonymous: data.isAnonymous ?? false,
        creatorId: userId,
      },
    });

    const participant = await this.identityService.getOrCreateParticipant(
      userId,
      thread.id,
      !data.isAnonymous
    );

    return {
      ...thread,
      myPseudonym: participant.pseudonym,
      myAvatarColor: participant.avatarColor,
    };
  };

  getAllThreads = async (page: number = 1, limit: number = 20, userId?: string) => {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { comments: true, participants: true, likes: true } },
          creator: { select: { username: true } },
          likes: userId ? { where: { userId }, select: { id: true } } : false,
        },
      }),
      prisma.thread.count(),
    ]);

    return {
      threads: threads.map((t:any) => ({
        ...t,
        likeCount: t._count.likes,
        isLiked: userId ? t.likes.length > 0 : false,
        likes: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  getThreadsByUser = async (username: string, page: number = 1, limit: number = 20, viewerId?: string) => {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        where: { creator: { username } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { comments: true, participants: true, likes: true } },
          creator: { select: { username: true } },
          likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
        },
      }),
      prisma.thread.count({ where: { creator: { username } } }),
    ]);

    return {
      threads: threads.map((t) => ({
        ...t,
        likeCount: t._count.likes,
        isLiked: viewerId ? t.likes.length > 0 : false,
        likes: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  };

  getThreadById = async (threadId: string, userId?: string) => {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        participants: {
          select: { id: true, pseudonym: true, avatarColor: true, joinedAt: true },
        },
        creator: { select: { username: true } },
        _count: { select: { comments: true, likes: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    });

    if (!thread) return null;

    let myParticipant = null;
    if (userId) {
      myParticipant = await prisma.threadParticipant.findUnique({
        where: { userId_threadId: { userId, threadId } },
        select: { pseudonym: true, avatarColor: true },
      });
    }

    return {
      ...thread,
      likeCount: thread._count.likes,
      isLiked: userId ? thread.likes.length > 0 : false,
      likes: undefined,
      myPseudonym: myParticipant?.pseudonym ?? null,
      myAvatarColor: myParticipant?.avatarColor ?? null,
    };
  };

  deleteThread = async (threadId: string, userId: string) => {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { creatorId: true },
    });

    if (!thread) {
      throw new Error("NOT_FOUND");
    }

    if (thread.creatorId !== userId) {
      throw new Error("FORBIDDEN");
    }

    await prisma.thread.delete({ where: { id: threadId } });
  };

  updateThread = async (
    threadId: string,
    userId: string,
    data: { title?: string; url?: string; imageUrl?: string }
  ) => {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { creatorId: true },
    });

    if (!thread) throw new Error("NOT_FOUND");
    if (thread.creatorId !== userId) throw new Error("FORBIDDEN");

    const updated = await prisma.thread.update({
      where: { id: threadId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });

    return updated;
  };

  toggleLike = async (threadId: string, userId: string) => {
    const existing = await prisma.threadLike.findUnique({
      where: { userId_threadId: { userId, threadId } },
    });

    if (existing) {
      await prisma.threadLike.delete({
        where: { userId_threadId: { userId, threadId } },
      });
    } else {
      await prisma.threadLike.create({
        data: { userId, threadId },
      });
    }

    const likeCount = await prisma.threadLike.count({ where: { threadId } });
    return { liked: !existing, likeCount };
  };
}
