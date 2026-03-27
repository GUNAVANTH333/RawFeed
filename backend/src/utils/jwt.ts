import jwt from "jsonwebtoken";
import type { Response } from "express";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret";

export const generateToken = (res: Response, userId: string): void => {
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true, 
    secure: process.env["NODE_ENV"] === "production", 
    sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax", 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearToken = (res: Response): void => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: process.env["NODE_ENV"] === "production" ? "none" : "lax",
    expires: new Date(0),
  });
};