-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WheelRewardType" ADD VALUE 'free_cookie';
ALTER TYPE "WheelRewardType" ADD VALUE 'retry';
ALTER TYPE "WheelRewardType" ADD VALUE 'second_drink_discount';
ALTER TYPE "WheelRewardType" ADD VALUE 'coffee_and_cookie';
