/*
  Warnings:

  - You are about to drop the column `id_frigorifico` on the `EMPAQUES` table. All the data in the column will be lost.
  - Added the required column `id_estacion` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "EMPAQUES_id_frigorifico_fkey";

-- AlterTable
ALTER TABLE "EMPAQUES" DROP COLUMN "id_frigorifico",
ADD COLUMN     "id_estacion" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_estacion_fkey" FOREIGN KEY ("id_estacion") REFERENCES "ESTACIONES"("id_estacion") ON DELETE RESTRICT ON UPDATE CASCADE;
