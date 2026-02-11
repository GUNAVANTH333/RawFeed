import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";

export class UserService {
  private readonly SALT_ROUNDS = 10;

  createUser = async (email: string, password: string) => {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
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
}
