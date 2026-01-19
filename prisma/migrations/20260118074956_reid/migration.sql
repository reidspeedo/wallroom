-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "admin_password_hash" TEXT NOT NULL,
    "board_public_token" TEXT NOT NULL,
    "poll_interval_seconds" INTEGER NOT NULL DEFAULT 10,
    "layout_columns" INTEGER NOT NULL DEFAULT 3,
    "time_zone" TEXT,
    "booking_durations" INTEGER[] DEFAULT ARRAY[15, 30, 60, 90, 120]::INTEGER[],
    "extend_increments" INTEGER[] DEFAULT ARRAY[15, 30]::INTEGER[],

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "layout_x" INTEGER NOT NULL DEFAULT 0,
    "layout_y" INTEGER NOT NULL DEFAULT 0,
    "layout_w" INTEGER NOT NULL DEFAULT 20,
    "layout_h" INTEGER NOT NULL DEFAULT 20,
    "capacity" INTEGER,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "room_id" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "ended_early_at" TIMESTAMP(3),
    "extended_from_booking_id" TEXT,
    "source" VARCHAR(20) NOT NULL DEFAULT 'board',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "admin" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_board_public_token_key" ON "user_settings"("board_public_token");

-- CreateIndex
CREATE INDEX "rooms_is_active_display_order_idx" ON "rooms"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "bookings_room_id_start_time_idx" ON "bookings"("room_id", "start_time");

-- CreateIndex
CREATE INDEX "bookings_room_id_status_start_time_idx" ON "bookings"("room_id", "status", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
