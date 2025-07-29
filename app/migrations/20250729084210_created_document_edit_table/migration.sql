-- CreateEnum
CREATE TYPE "EditType" AS ENUM ('TEXT', 'IMAGE', 'PLACEHOLDER');

-- CreateTable
CREATE TABLE "DocumentEdit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "EditType" NOT NULL,
    "value" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "xPercent" DOUBLE PRECISION NOT NULL,
    "yPercent" DOUBLE PRECISION NOT NULL,
    "widthPercent" DOUBLE PRECISION NOT NULL,
    "heightPercent" DOUBLE PRECISION NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "DocumentEdit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocumentEdit" ADD CONSTRAINT "DocumentEdit_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
