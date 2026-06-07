-- CreateTable
CREATE TABLE "command_center_state" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "setup_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_setup_tasks" TEXT[],
    "setup_progress" INTEGER NOT NULL DEFAULT 0,
    "focus_areas" TEXT[],
    "daily_upload_target" INTEGER NOT NULL DEFAULT 1,
    "weekly_upload_target" INTEGER NOT NULL DEFAULT 3,
    "enabled_features" TEXT[],
    "widget_layout" JSONB,
    "current_workflow" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "command_center_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_task" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "estimated_time" INTEGER NOT NULL,
    "expected_outcome" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "deadline" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "period_type" TEXT NOT NULL,
    "videos_created" INTEGER NOT NULL DEFAULT 0,
    "videos_uploaded" INTEGER NOT NULL DEFAULT 0,
    "total_watch_time" INTEGER NOT NULL DEFAULT 0,
    "subscribers_gained" INTEGER NOT NULL DEFAULT 0,
    "subscribers_lost" INTEGER NOT NULL DEFAULT 0,
    "total_subscribers" INTEGER NOT NULL DEFAULT 0,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "average_view_duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_comments" INTEGER NOT NULL DEFAULT 0,
    "total_shares" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upload_consistency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daily_activity_streak" INTEGER NOT NULL DEFAULT 0,
    "weekly_upload_streak" INTEGER NOT NULL DEFAULT 0,
    "content_creation_streak" INTEGER NOT NULL DEFAULT 0,
    "click_through_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "command_center_state_user_id_key" ON "command_center_state"("user_id");

-- CreateIndex
CREATE INDEX "daily_task_user_id_scheduled_date_idx" ON "daily_task"("user_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "user_metrics_user_id_period_type_idx" ON "user_metrics"("user_id", "period_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_metrics_user_id_period_start_period_end_period_type_key" ON "user_metrics"("user_id", "period_start", "period_end", "period_type");

-- CreateIndex
CREATE INDEX "user_activity_user_id_type_idx" ON "user_activity"("user_id", "type");

-- CreateIndex
CREATE INDEX "user_activity_user_id_timestamp_idx" ON "user_activity"("user_id", "timestamp");

-- AddForeignKey
ALTER TABLE "command_center_state" ADD CONSTRAINT "command_center_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task" ADD CONSTRAINT "daily_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_metrics" ADD CONSTRAINT "user_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
