/*
  Warnings:

  - You are about to drop the column `key` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "key",
DROP COLUMN "url";
