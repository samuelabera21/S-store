-- AlterTable
ALTER TABLE "pins" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "cook_time" INTEGER,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "media_type" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "pin_type" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "review_count" INTEGER DEFAULT 0,
ADD COLUMN     "servings" INTEGER,
ADD COLUMN     "video_url" TEXT;

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "pin_id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_pin_id_idx" ON "analytics_events"("pin_id");

-- CreateIndex
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- CreateIndex
CREATE INDEX "pins_media_type_idx" ON "pins"("media_type");

-- CreateIndex
CREATE INDEX "pins_pin_type_idx" ON "pins"("pin_type");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
