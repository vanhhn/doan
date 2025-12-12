/*
  Warnings:

  - You are about to drop the column `charge_level` on the `slots` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `reservations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "batteries" ALTER COLUMN "status" SET DEFAULT 'in_stock';

-- AlterTable
-- First add column as nullable
ALTER TABLE "reservations" ADD COLUMN "expires_at" TIMESTAMPTZ;
-- Set default value for existing rows (reserved_time + 15 minutes)
UPDATE "reservations" SET "expires_at" = "reserved_time" + INTERVAL '15 minutes' WHERE "expires_at" IS NULL;
-- Make column required
ALTER TABLE "reservations" ALTER COLUMN "expires_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "slots" DROP COLUMN "charge_level";

-- AlterTable
ALTER TABLE "transaction_logs" ALTER COLUMN "cost" SET DEFAULT 7000;
