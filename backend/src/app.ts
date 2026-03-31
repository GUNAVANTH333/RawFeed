import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./utils/googleOAuth.js";
import userRoutes from "./routes/user.routes.js";
import threadRoutes from "./routes/thread.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

const app = express();

app.use(cors({
  origin: [process.env["CLIENT_URL"] as string, "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api", commentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
