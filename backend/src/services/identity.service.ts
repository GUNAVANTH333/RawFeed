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

  getOrCreateParticipant = async (userId: string, threadId: string) => {
    const existing = await prisma.threadParticipant.findUnique({
      where: {
        userId_threadId: { userId, threadId },
      },
    });

    if (existing) {
      return existing;
    }

    const pseudonym = this.generatePseudonym(userId, threadId);
    const avatarColor = this.generateAvatarColor(userId, threadId);

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
