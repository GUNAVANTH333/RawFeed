-- Add the new column as NULLABLE first so existing rows are not rejected.
ALTER TABLE "thread_participants" ADD COLUMN "isAnonymous" BOOLEAN;

-- Backfill: a participant is anonymous when their stored pseudonym differs
-- from their user's current username (the historical definition of anonymity).
UPDATE "thread_participants" tp
SET "isAnonymous" = (tp."pseudonym" <> u."username")
FROM "users" u
WHERE tp."userId" = u."id";

-- Exception: this user joined under their real name (vamsi_kummara) and later
-- renamed to "kkkkk". The rename made pseudonym != username, which would have
-- incorrectly flagged them anonymous. Force them to NOT anonymous.
UPDATE "thread_participants" tp
SET "isAnonymous" = false
FROM "users" u
WHERE tp."userId" = u."id"
  AND u."username" = 'kkkkk'
  AND tp."pseudonym" = 'vamsi_kummara';

-- Safety net: any row still NULL (e.g. a participant with no matching user)
-- defaults to anonymous. None expected (0 orphans verified before migration).
UPDATE "thread_participants" SET "isAnonymous" = true WHERE "isAnonymous" IS NULL;

-- Now that every row has a value, enforce the NOT NULL constraint to match the schema.
ALTER TABLE "thread_participants" ALTER COLUMN "isAnonymous" SET NOT NULL;
