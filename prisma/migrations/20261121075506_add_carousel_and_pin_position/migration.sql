-- AlterTable
ALTER TABLE "board_pins" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "pins" ADD COLUMN     "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
