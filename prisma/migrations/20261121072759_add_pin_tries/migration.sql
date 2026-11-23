-- CreateTable
CREATE TABLE "pin_tries" (
    "id" TEXT NOT NULL,
    "pin_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "text" TEXT,
    "rating" INTEGER DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pin_tries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pin_tries_pin_id_idx" ON "pin_tries"("pin_id");

-- CreateIndex
CREATE INDEX "pin_tries_user_id_idx" ON "pin_tries"("user_id");

-- AddForeignKey
ALTER TABLE "pin_tries" ADD CONSTRAINT "pin_tries_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "pins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_tries" ADD CONSTRAINT "pin_tries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
