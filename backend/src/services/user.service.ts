import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";

export class UserService {
  private readonly SALT_ROUNDS = 10;

  createUser = async (email: string, password: string, username: string) => {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    return user;
  };

  findByEmail = async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  };

  findByUsername = async (username: string) => {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    return user;
  };

  findById = async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  };

  getProfile = async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        profilePhoto: true,
        createdAt: true,
        shadowScore: true,
        isBanned: true,
      },
    });

    return user;
  };

  comparePasswords = async (plainText: string, hashed: string) => {
    return bcrypt.compare(plainText, hashed);
  };

  updateUsername = async (id: string, username: string) => {
    return prisma.user.update({
      where: { id },
      data: { username },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        profilePhoto: true,
        createdAt: true,
      },
    });
  };

  updateProfile = async (id: string, bio?: string | null, profilePhoto?: string | null) => {
    return prisma.user.update({
      where: { id },
      data: {
        ...(bio !== undefined && { bio }),
        ...(profilePhoto !== undefined && { profilePhoto }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        profilePhoto: true,
        createdAt: true,
      },
    });
  };

  getPublicProfile = async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        profilePhoto: true,
        createdAt: true,
      },
    });
  };
}
