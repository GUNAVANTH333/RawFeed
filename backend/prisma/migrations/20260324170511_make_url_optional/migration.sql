-- DropIndex
DROP INDEX "threads_url_key";

-- AlterTable
ALTER TABLE "threads" ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "domain" DROP NOT NULL;
