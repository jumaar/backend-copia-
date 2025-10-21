/*
  Warnings:

  - You are about to drop the `TOKENS_REVOCADOS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."TOKENS_REVOCADOS";

-- CreateTable
CREATE TABLE "REFRESH_TOKENS" (
    "id_refresh_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "REFRESH_TOKENS_pkey" PRIMARY KEY ("id_refresh_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "REFRESH_TOKENS_token_key" ON "REFRESH_TOKENS"("token");

-- AddForeignKey
ALTER TABLE "REFRESH_TOKENS" ADD CONSTRAINT "REFRESH_TOKENS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
