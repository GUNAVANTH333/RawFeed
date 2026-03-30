import { Router } from "express";
import type { Request, Response } from "express";
import passport from "../utils/googleOAuth.js";
import { generateToken } from "../utils/jwt.js";

const router = Router();

const CLIENT_URL = process.env["CLIENT_URL"] ?? "http://localhost:3000";
const GOOGLE_SCOPES = ["profile", "email"];

// Step 1: Redirect user to Google's consent screen
router.get(
  "/google",
  passport.authenticate("google", { scope: GOOGLE_SCOPES, session: false })
);

// Step 2: Google redirects back here with a code
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${CLIENT_URL}/login?error=oauth_failed`, session: false }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string } | undefined;

    if (!user) {
      res.redirect(`${CLIENT_URL}/login?error=oauth_failed`);
      return;
    }

    // Issue our standard JWT cookie — same as normal login
    generateToken(res, user.id);

    // Redirect to home page after successful sign in
    res.redirect(`${CLIENT_URL}/`);
  }
);

export default router;
