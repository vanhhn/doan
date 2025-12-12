/*
  Warnings:

  - You are about to drop the column `charge_level` on the `slots` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "batteries" ALTER COLUMN "status" SET DEFAULT 'in_stock';

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "expires_at" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "slots" DROP COLUMN "charge_level";

-- AlterTable
ALTER TABLE "transaction_logs" ALTER COLUMN "cost" SET DEFAULT 7000;
