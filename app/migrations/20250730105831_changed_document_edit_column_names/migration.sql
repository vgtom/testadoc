/*
  Warnings:

  - You are about to drop the column `signRoleId` on the `DocumentEdit` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DocumentEdit" DROP CONSTRAINT "DocumentEdit_signRoleId_fkey";

-- AlterTable
ALTER TABLE "DocumentEdit" DROP COLUMN "signRoleId",
ADD COLUMN     "roleId" TEXT;

-- AddForeignKey
ALTER TABLE "DocumentEdit" ADD CONSTRAINT "DocumentEdit_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "SignRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
