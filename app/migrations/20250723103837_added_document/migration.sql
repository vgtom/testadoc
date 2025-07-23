/*
  Warnings:

  - You are about to drop the column `key` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnailUrl` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Document` table. All the data in the column will be lost.
  - The `status` column on the `Document` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "key",
DROP COLUMN "thumbnailUrl",
DROP COLUMN "type",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft';

-- DropEnum
DROP TYPE "Status";
