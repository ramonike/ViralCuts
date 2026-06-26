-- Add display_name and avatar_url columns to account table
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
