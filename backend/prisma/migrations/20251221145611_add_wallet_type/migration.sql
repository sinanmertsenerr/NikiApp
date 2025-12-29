/*
  Warnings:

  - You are about to drop the column `niki_credits` on the `wallets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,wallet_type]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('IEU', 'NIKI');

-- DropIndex
DROP INDEX "wallets_user_id_key";

-- Step 1: Add new columns
ALTER TABLE "wallets" ADD COLUMN "balance" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "wallets" ADD COLUMN "wallet_type" "WalletType" NOT NULL DEFAULT 'IEU';

-- Step 2: Migrate existing niki_credits to balance (for IEU wallet)
UPDATE "wallets" SET "balance" = "niki_credits";

-- Step 3: Drop old column
ALTER TABLE "wallets" DROP COLUMN "niki_credits";

-- Step 4: Create unique index for user_id + wallet_type
CREATE UNIQUE INDEX "wallets_user_id_wallet_type_key" ON "wallets"("user_id", "wallet_type");

-- Step 5: Create NIKI wallets for existing users (with 0 balance)
INSERT INTO "wallets" ("id", "user_id", "wallet_type", "balance", "qr_code", "created_at", "updated_at")
SELECT 
  gen_random_uuid(),
  "user_id",
  'NIKI',
  0,
  'NIKI-' || UPPER(LEFT("user_id"::text, 8)) || '-' || UPPER(LEFT(gen_random_uuid()::text, 4)),
  NOW(),
  NOW()
FROM "wallets"
WHERE "wallet_type" = 'IEU';

-- Step 6: Update existing IEU wallet QR codes to have IEU prefix
UPDATE "wallets" 
SET "qr_code" = 'IEU-' || UPPER(LEFT("user_id"::text, 8)) || '-' || UPPER(LEFT(gen_random_uuid()::text, 4))
WHERE "wallet_type" = 'IEU' AND "qr_code" NOT LIKE 'IEU-%';
