-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "key" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "key" SET DEFAULT '';
