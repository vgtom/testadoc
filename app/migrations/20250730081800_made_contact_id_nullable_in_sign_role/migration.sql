-- DropForeignKey
ALTER TABLE "SignRole" DROP CONSTRAINT "SignRole_contactId_fkey";

-- AlterTable
ALTER TABLE "SignRole" ALTER COLUMN "contactId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SignRole" ADD CONSTRAINT "SignRole_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
