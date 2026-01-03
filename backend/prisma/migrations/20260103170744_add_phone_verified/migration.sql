-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_verified_at" TIMESTAMP(3);

-- Set existing email-verified users as phone-verified (backward compatibility)
UPDATE "users" SET "phone_verified" = true, "phone_verified_at" = "email_verified_at" WHERE "email_verified" = true;
