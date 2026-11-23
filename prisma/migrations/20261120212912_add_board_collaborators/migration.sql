-- CreateTable
CREATE TABLE "board_collaborators" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_collaborators_user_id_idx" ON "board_collaborators"("user_id");

-- CreateIndex
CREATE INDEX "board_collaborators_board_id_idx" ON "board_collaborators"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "board_collaborators_board_id_user_id_key" ON "board_collaborators"("board_id", "user_id");

-- AddForeignKey
ALTER TABLE "board_collaborators" ADD CONSTRAINT "board_collaborators_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_collaborators" ADD CONSTRAINT "board_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
