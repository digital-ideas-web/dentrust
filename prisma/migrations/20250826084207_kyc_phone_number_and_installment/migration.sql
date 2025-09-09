/*
  Warnings:

  - You are about to drop the column `paymentHistory` on the `Installment` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Installment` table. All the data in the column will be lost.
  - You are about to drop the column `targetAmount` on the `Installment` table. All the data in the column will be lost.
  - You are about to drop the `UserPlan` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,status]` on the table `Installment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_userId_fkey";

-- DropIndex
DROP INDEX "Installment_userId_plan_status_key";

-- AlterTable
ALTER TABLE "Installment" DROP COLUMN "paymentHistory",
DROP COLUMN "plan",
DROP COLUMN "targetAmount",
ALTER COLUMN "amountPaid" DROP NOT NULL,
ALTER COLUMN "amountPaid" DROP DEFAULT;

-- DropTable
DROP TABLE "UserPlan";

-- CreateTable
CREATE TABLE "PhoneNumber" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "socialSecurityNumber" TEXT NOT NULL,

    CONSTRAINT "PhoneNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KYC" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "Id_type" TEXT NOT NULL,
    "Id_image" TEXT NOT NULL,

    CONSTRAINT "KYC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhoneNumber_userId_key" ON "PhoneNumber"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KYC_userId_key" ON "KYC"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_userId_status_key" ON "Installment"("userId", "status");

-- AddForeignKey
ALTER TABLE "PhoneNumber" ADD CONSTRAINT "PhoneNumber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KYC" ADD CONSTRAINT "KYC_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
