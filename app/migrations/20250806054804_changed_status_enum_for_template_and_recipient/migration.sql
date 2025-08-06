/*
  Warnings:

  - You are about to drop the column `status` on the `Document` table. All the data in the column will be lost.
  - The `status` column on the `Recipient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Template` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('Draft', 'Sent', 'Completed');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('Draft', 'Recieved', 'Viewed', 'Finished');

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Recipient" DROP COLUMN "status",
ADD COLUMN     "status" "RecipientStatus" NOT NULL DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "status",
ADD COLUMN     "status" "TemplateStatus" NOT NULL DEFAULT 'Draft';

-- DropEnum
DROP TYPE "Status";
