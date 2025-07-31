-- AlterTable
ALTER TABLE "DocumentEdit" ADD COLUMN     "signRoleId" TEXT;

-- AlterTable
ALTER TABLE "SignRole" ADD COLUMN     "color" TEXT;

-- AddForeignKey
ALTER TABLE "DocumentEdit" ADD CONSTRAINT "DocumentEdit_signRoleId_fkey" FOREIGN KEY ("signRoleId") REFERENCES "SignRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
