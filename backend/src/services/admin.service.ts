import prisma from "../utils/prisma.js";

export class AdminService {
  getReports = async (page: number, limit: number, resolved?: boolean) => {
    const where = resolved !== undefined ? { resolved } : {};
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { id: true, username: true } },
          reportedUser: { select: { id: true, username: true, shadowScore: true, isBanned: true } },
          thread: { select: { id: true, title: true } },
          comment: { select: { id: true, content: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
  };

  resolveReport = async (reportId: string, action: string, adminId: string) => {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error("NOT_FOUND");
    if (report.resolved) throw new Error("ALREADY_RESOLVED");

    return prisma.report.update({
      where: { id: reportId },
      data: { resolved: true, resolvedAt: new Date(), resolvedById: adminId, action },
    });
  };

  banUser = async (targetUserId: string) => {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new Error("NOT_FOUND");
    if (user.role === "ADMIN") throw new Error("CANNOT_BAN_ADMIN");

    return prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: true },
      select: { id: true, username: true, isBanned: true, shadowScore: true },
    });
  };

  unbanUser = async (targetUserId: string) => {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new Error("NOT_FOUND");

    return prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: false },
      select: { id: true, username: true, isBanned: true, shadowScore: true },
    });
  };

  adjustShadowScore = async (targetUserId: string, delta: number) => {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { shadowScore: true },
    });
    if (!user) throw new Error("NOT_FOUND");

    const newScore = Math.max(0, Math.min(100, user.shadowScore + delta));

    return prisma.user.update({
      where: { id: targetUserId },
      data: { shadowScore: newScore },
      select: { id: true, username: true, shadowScore: true, isBanned: true },
    });
  };

  forceDeleteThread = async (threadId: string) => {
    const thread = await prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("NOT_FOUND");
    await prisma.thread.delete({ where: { id: threadId } });
  };

  forceDeleteComment = async (commentId: string) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error("NOT_FOUND");
    await prisma.comment.delete({ where: { id: commentId } });
  };

  getUsers = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          shadowScore: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { reportsReceived: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  };
}
