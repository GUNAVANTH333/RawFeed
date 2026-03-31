import prisma from "../utils/prisma.js";
import { IdentityService } from "./identity.service.js";
import { createNotification } from "./notification.service.js";

export class CommentService {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  createComment = async (
    userId: string,
    threadId: string,
    content: string,
    parentId?: string,
    useRealName?: boolean
  ) => {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { creatorId: true },
    });

    const participant = await this.identityService.getOrCreateParticipant(
      userId,
      threadId,
      useRealName
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
            user: {
              select: { username: true, profilePhoto: true }
            }
          },
        },
      },
    });

    const isAnonymous = comment.participant.pseudonym !== comment.participant.user.username;

    // --- Fire notifications (non-blocking, best-effort) ---
    const thread_full = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { creatorId: true, title: true },
    });

    if (thread_full) {
      const actorPseudonym = comment.participant.pseudonym;

      if (parentId) {
        // Reply to a comment: notify the parent comment's author
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          include: { participant: { select: { userId: true } } },
        });
        const parentAuthorId = parentComment?.participant.userId;
        if (parentAuthorId && parentAuthorId !== userId) {
          createNotification({
            type: "REPLY_TO_COMMENT",
            recipientId: parentAuthorId,
            actorPseudonym,
            threadId,
            threadTitle: thread_full.title,
            commentId: comment.id,
          }).catch(() => {});
        }
      } else {
        // Top-level comment: notify the thread creator
        if (thread_full.creatorId !== userId) {
          createNotification({
            type: "COMMENT_ON_THREAD",
            recipientId: thread_full.creatorId,
            actorPseudonym,
            threadId,
            threadTitle: thread_full.title,
            commentId: comment.id,
          }).catch(() => {});
        }
      }
    }
    // -------------------------------------------------------

    return {
      ...comment,
      participant: {
        pseudonym: comment.participant.pseudonym,
        avatarColor: comment.participant.avatarColor,
        profilePhoto: isAnonymous ? null : comment.participant.user.profilePhoto,
        isAnonymous,
      },
      isMe: true,
      isCreator: thread?.creatorId === userId,
    };
  };

  getCommentsByThread = async (threadId: string, userId?: string) => {
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: { creatorId: true },
    });

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
            user: {
              select: { username: true, profilePhoto: true }
            }
          },
        },
        _count: { select: { replies: true } },
        votes: userId
          ? {
              where: { userId },
              select: { type: true },
            }
          : false,
      },
    });

    const userShadowScores = new Map<string, number>();

    if (comments.length > 0) {
      const participantUserIds = [
        ...new Set(comments.map((c:any) => c.participant.userId)),
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

      const { participant, votes, ...rest } = comment;
      const myVote = Array.isArray(votes) && votes.length > 0 ? votes[0]?.type ?? null : null;
      const isAnonymous = participant.pseudonym !== participant.user.username;

      return {
        ...rest,
        participant: {
          id: participant.id,
          pseudonym: participant.pseudonym,
          avatarColor: participant.avatarColor,
          profilePhoto: isAnonymous ? null : participant.user?.profilePhoto,
          isAnonymous,
        },
        content: isHidden
          ? "[Hidden by Community Standards]"
          : comment.content,
        isHidden,
        isMe: userId ? participant.userId === userId : false,
        isCreator: participant.userId === thread?.creatorId,
        myVote,
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

  deleteComment = async (commentId: string, userId: string) => {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        participant: { select: { userId: true } },
      },
    });

    if (!comment) {
      throw new Error("NOT_FOUND");
    }

    if (comment.participant.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    await prisma.comment.delete({ where: { id: commentId } });
  };
}
