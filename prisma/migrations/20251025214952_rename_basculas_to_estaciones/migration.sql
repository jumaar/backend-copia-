/*
  Warnings:

  - You are about to drop the `BASCULAS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."BASCULAS" DROP CONSTRAINT "BASCULAS_id_frigorifico_fkey";

-- DropTable
DROP TABLE "public"."BASCULAS";

-- CreateTable
CREATE TABLE "ESTACIONES" (
    "id_estacion" SERIAL NOT NULL,
    "id_frigorifico" INTEGER NOT NULL,
    "clave_vinculacion" TEXT NOT NULL,

    CONSTRAINT "ESTACIONES_pkey" PRIMARY KEY ("id_estacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "ESTACIONES_clave_vinculacion_key" ON "ESTACIONES"("clave_vinculacion");

-- AddForeignKey
ALTER TABLE "ESTACIONES" ADD CONSTRAINT "ESTACIONES_id_frigorifico_fkey" FOREIGN KEY ("id_frigorifico") REFERENCES "FRIGORIFICO"("id_frigorifico") ON DELETE RESTRICT ON UPDATE CASCADE;
