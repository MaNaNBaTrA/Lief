/*
  Warnings:

  - You are about to drop the column `position` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "position",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "number" TEXT;
