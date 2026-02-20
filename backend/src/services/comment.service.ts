import prisma from "../utils/prisma.js";
import { IdentityService } from "./identity.service.js";

export class CommentService {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  createComment = async (
    userId: string,
    threadId: string,
    content: string,
    parentId?: string
  ) => {
    const participant = await this.identityService.getOrCreateParticipant(
      userId,
      threadId
    );

    const comment = await prisma.comment.create({
      data: {
        content,
        participantId: participant.id,
        threadId,
        ...(parentId !== undefined && { parentId }),
      },
      include: {
        participant: {
          select: {
            pseudonym: true,
            avatarColor: true,
          },
        },
      },
    });

    return {
      ...comment,
      isMe: true,
    };
  };

  getCommentsByThread = async (threadId: string, userId?: string) => {
    const comments = await prisma.comment.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      include: {
        participant: {
          select: {
            id: true,
            userId: true,
            pseudonym: true,
            avatarColor: true,
          },
        },
        _count: { select: { replies: true } },
      },
    });

    const userShadowScores = new Map<string, number>();

    if (comments.length > 0) {
      const participantUserIds = [
        ...new Set(comments.map((c) => c.participant.userId)),
      ];

      const users = await prisma.user.findMany({
        where: { id: { in: participantUserIds } },
        select: { id: true, shadowScore: true },
      });

      for (const user of users) {
        userShadowScores.set(user.id, user.shadowScore);
      }
    }

    const enrichedComments = comments.map((comment) => {
      const shadowScore =
        userShadowScores.get(comment.participant.userId) ?? 0;
      const isHidden = shadowScore < -50;

      const { participant, ...rest } = comment;

      return {
        ...rest,
        participant: {
          id: participant.id,
          pseudonym: participant.pseudonym,
          avatarColor: participant.avatarColor,
        },
        content: isHidden
          ? "[Hidden by Community Standards]"
          : comment.content,
        isHidden,
        isMe: userId ? participant.userId === userId : false,
      };
    });

    return enrichedComments;
  };

  voteComment = async (
    userId: string,
    commentId: string,
    type: "up" | "down"
  ) => {
    const existing = await prisma.vote.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });

    if (existing) {
      if (existing.type === type) {
        await prisma.$transaction([
          prisma.vote.delete({
            where: { id: existing.id },
          }),
          prisma.comment.update({
            where: { id: commentId },
            data: {
              ...(type === "up"
                ? { upvotes: { decrement: 1 } }
                : { downvotes: { decrement: 1 } }),
            },
          }),
        ]);

        return { action: "removed", type };
      }

      await prisma.$transaction([
        prisma.vote.update({
          where: { id: existing.id },
          data: { type },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: {
            ...(type === "up"
              ? { upvotes: { increment: 1 }, downvotes: { decrement: 1 } }
              : { upvotes: { decrement: 1 }, downvotes: { increment: 1 } }),
          },
        }),
      ]);

      return { action: "changed", type };
    }

    await prisma.$transaction([
      prisma.vote.create({
        data: { userId, commentId, type },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: {
          ...(type === "up"
            ? { upvotes: { increment: 1 } }
            : { downvotes: { increment: 1 } }),
        },
      }),
    ]);

    return { action: "voted", type };
  };
}
