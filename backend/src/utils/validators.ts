import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const UpdateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

export const UpdateProfileSchema = z.object({
  bio: z.string().max(500, "Bio must be at most 500 characters").optional().nullable(),
  profilePhoto: z.string().url("Invalid image URL").optional().nullable(),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const CreateThreadSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(300, "Title must be at most 300 characters"),
  url: z.string().url("Invalid URL format").optional(),
  domain: z.string().optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  isAnonymous: z.boolean().optional(),
});

export const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(5000, "Comment must be at most 5000 characters"),
  parentId: z.string().uuid("Invalid parent comment ID").optional(),
  useRealName: z.boolean().optional(),
});

export const VoteSchema = z.object({
  type: z.enum(["up", "down"], {
    message: "Vote type must be 'up' or 'down'",
  }),
});
