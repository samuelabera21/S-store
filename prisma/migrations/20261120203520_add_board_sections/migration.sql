-- AlterTable
ALTER TABLE "board_pins" ADD COLUMN     "section_id" TEXT;

-- CreateTable
CREATE TABLE "board_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_sections_board_id_idx" ON "board_sections"("board_id");

-- CreateIndex
CREATE INDEX "board_pins_section_id_idx" ON "board_pins"("section_id");

-- AddForeignKey
ALTER TABLE "board_sections" ADD CONSTRAINT "board_sections_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_pins" ADD CONSTRAINT "board_pins_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "board_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
