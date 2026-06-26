-- Add TikTok display and stats columns to account table
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "bio_description" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "following_count" INTEGER;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "likes_count" INTEGER;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "video_count" INTEGER;
