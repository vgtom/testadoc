/*
  Warnings:

  - Made the column `documentId` on table `Template` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "documentId" SET NOT NULL;
