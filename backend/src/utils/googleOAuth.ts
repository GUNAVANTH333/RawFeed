import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? "";
const API_URL = process.env["API_URL"] ?? "http://localhost:3001";

function buildUsername(displayName: string, email: string): string {
  // Try to build a username from displayname, falling back to email prefix
  const base = displayName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 25);

  if (base.length >= 3) return base;
  return email.split("@")[0]!.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 25);
}

async function makeUsernameUnique(base: string): Promise<string> {
  // Check if the username is taken; if so add a number suffix
  let candidate = base;
  let attempts = 0;
  while (attempts < 100) {
    const existing = await prisma.user.findUnique({ where: { username: candidate } });
    if (!existing) return candidate;
    attempts++;
    candidate = `${base}_${attempts}`;
  }
  // Fallback: use timestamp suffix
  return `${base}_${Date.now()}`.slice(0, 30);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${API_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName ?? "User";
        const photo = profile.photos?.[0]?.value ?? null;

        if (!email) {
          return done(new Error("Google account has no email address"), undefined);
        }

        // 1. Check if there is a user with this googleId already
        let user = await prisma.user.findUnique({ where: { googleId } });

        if (user) {
          return done(null, user);
        }

        // 2. Check if there is a user with this email (they registered without Google)
        user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Link their google account
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, profilePhoto: user.profilePhoto ?? photo },
          });
          return done(null, user);
        }

        // 3. Create a brand new user
        const rawUsername = buildUsername(displayName, email);
        const username = await makeUsernameUnique(rawUsername);

        user = await prisma.user.create({
          data: {
            email,
            username,
            googleId,
            profilePhoto: photo,
            password: null,
          },
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

// Minimal session support: just serialize/deserialize by id
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
