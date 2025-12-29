-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'manual_deduction';

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;
