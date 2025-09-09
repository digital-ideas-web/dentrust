/*
  Warnings:

  - You are about to drop the column `socialSecurityNumber` on the `PhoneNumber` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,Id_image]` on the table `KYC` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,phoneNumber,id_number]` on the table `PhoneNumber` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_number` to the `PhoneNumber` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Transactions_userId_status_key";

-- AlterTable
ALTER TABLE "PhoneNumber" DROP COLUMN "socialSecurityNumber",
ADD COLUMN     "id_number" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Deposit_userId_plan_idx" ON "Deposit"("userId", "plan");

-- CreateIndex
CREATE UNIQUE INDEX "KYC_userId_Id_image_key" ON "KYC"("userId", "Id_image");

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_userId_phoneNumber_id_number_key" ON "PhoneNumber"("userId", "phoneNumber", "id_number");
