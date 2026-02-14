import prisma from "../utils/prisma.js";
import { IdentityService } from "./identity.service.js";

export class ThreadService {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  createThread = async (
    userId: string,
    data: { title: string; url?: string; domain?: string; imageUrl?: string }
  ) => {
    const thread = await prisma.thread.create({
      data: {
        title: data.title,
        url: data.url ?? "",
        domain: data.domain ?? "user-submitted",
        imageUrl: data.imageUrl ?? null,
        creatorId: userId,
      },
    });

    const participant = await this.identityService.getOrCreateParticipant(
      userId,
      thread.id
    );

    return {
      ...thread,
      myPseudonym: participant.pseudonym,
      myAvatarColor: participant.avatarColor,
    };
  };

  getAllThreads = async (page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;

    const [threads, total] = await Promise.all([
      prisma.thread.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { comments: true, participants: true } },
        },
      }),
      prisma.thread.count(),
    ]);

    return {
      threads,
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
          select: {
            id: true,
            pseudonym: true,
            avatarColor: true,
            joinedAt: true,
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!thread) {
      return null;
    }

    let myParticipant = null;
    if (userId) {
      myParticipant = await prisma.threadParticipant.findUnique({
        where: {
          userId_threadId: { userId, threadId },
        },
        select: {
          pseudonym: true,
          avatarColor: true,
        },
      });
    }

    return {
      ...thread,
      myPseudonym: myParticipant?.pseudonym ?? null,
      myAvatarColor: myParticipant?.avatarColor ?? null,
    };
  };
}
