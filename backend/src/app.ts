import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import threadRoutes from "./routes/thread.routes.js";
import commentRoutes from "./routes/comment.routes.js";

const app = express();

app.use(cors({
  origin: process.env["CLIENT_URL"] ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api", commentRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
