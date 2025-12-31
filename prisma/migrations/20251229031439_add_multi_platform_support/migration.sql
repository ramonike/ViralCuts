-- AlterTable
ALTER TABLE "upload" ADD COLUMN     "bytes_uploaded" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size" BIGINT,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "platforms" TEXT[] DEFAULT ARRAY['youtube']::TEXT[],
ADD COLUMN     "session_uri" TEXT,
ADD COLUMN     "youtube_video_id" TEXT,
ALTER COLUMN "platform" SET DEFAULT 'youtube';

-- CreateTable
CREATE TABLE "platform_upload_status" (
    "id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "platform_video_id" TEXT,
    "platform_video_url" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_upload_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_upload_status_upload_id_platform_key" ON "platform_upload_status"("upload_id", "platform");

-- AddForeignKey
ALTER TABLE "platform_upload_status" ADD CONSTRAINT "platform_upload_status_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
