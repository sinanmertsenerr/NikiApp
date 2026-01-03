/*
  Warnings:

  - The values [manual_deduction] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "CampaignTargetType" AS ENUM ('users', 'groups');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('campaign', 'reward', 'badge', 'order', 'system', 'balance');

-- AlterEnum
ALTER TYPE "RewardType" ADD VALUE 'manual';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('topup', 'payment', 'refund', 'reward');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "target_type" "CampaignTargetType" NOT NULL DEFAULT 'users';

-- AlterTable
ALTER TABLE "user_campaigns" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kvkk_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kvkk_accepted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "allow_negative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "negative_limit" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "is_active" SET DEFAULT false;

-- CreateTable
CREATE TABLE "campaign_groups" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "title_tr" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "message_tr" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_tr" TEXT NOT NULL,
    "description" TEXT,
    "description_tr" TEXT,
    "reward_type" "RewardType" NOT NULL,
    "reward_value" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "winner_count" INTEGER NOT NULL DEFAULT 1,
    "status" "RaffleStatus" NOT NULL DEFAULT 'pending',
    "drawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_participants" (
    "id" TEXT NOT NULL,
    "raffle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_campaign_id" TEXT,
    "used_at" TIMESTAMP(3),

    CONSTRAINT "raffle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_groups_campaign_id_idx" ON "campaign_groups"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_groups_group_id_idx" ON "campaign_groups"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_groups_campaign_id_group_id_key" ON "campaign_groups"("campaign_id", "group_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "raffles_status_idx" ON "raffles"("status");

-- CreateIndex
CREATE INDEX "raffles_end_date_idx" ON "raffles"("end_date");

-- CreateIndex
CREATE INDEX "raffle_participants_raffle_id_idx" ON "raffle_participants"("raffle_id");

-- CreateIndex
CREATE INDEX "raffle_participants_user_id_idx" ON "raffle_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "raffle_participants_raffle_id_user_id_key" ON "raffle_participants"("raffle_id", "user_id");

-- AddForeignKey
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_groups" ADD CONSTRAINT "campaign_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_participants" ADD CONSTRAINT "raffle_participants_raffle_id_fkey" FOREIGN KEY ("raffle_id") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_participants" ADD CONSTRAINT "raffle_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
