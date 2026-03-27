import { createHmac } from "node:crypto";
import prisma from "../utils/prisma.js";
import { hashToReadableName, hashToAvatarColor } from "../utils/name-bank.js";

const IDENTITY_SECRET = process.env["IDENTITY_SECRET"] ?? "fallback_identity_secret";

export class IdentityService {
  generateHash(userId: string, threadId: string): string {
    return createHmac("sha256", IDENTITY_SECRET)
      .update(userId + threadId)
      .digest("hex");
  }

  generatePseudonym(userId: string, threadId: string): string {
    const hash = this.generateHash(userId, threadId);
    return hashToReadableName(hash);
  }

  generateAvatarColor(userId: string, threadId: string): string {
    const hash = this.generateHash(userId, threadId);
    return hashToAvatarColor(hash);
  }

  getOrCreateParticipant = async (
    userId: string,
    threadId: string,
    useRealName?: boolean
  ) => {
    const existing = await prisma.threadParticipant.findUnique({
      where: {
        userId_threadId: { userId, threadId },
      },
    });

    if (existing) {
      return existing;
    }

    let pseudonym: string;
    let avatarColor: string;

    if (useRealName) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, email: true },
      });
      pseudonym = user?.username || user?.email?.split("@")[0] || "User";
      avatarColor = this.generateAvatarColor(userId, threadId);
    } else {
      pseudonym = this.generatePseudonym(userId, threadId);
      avatarColor = this.generateAvatarColor(userId, threadId);
    }

    const participant = await prisma.threadParticipant.create({
      data: {
        userId,
        threadId,
        pseudonym,
        avatarColor,
      },
    });

    return participant;
  };
}
