/*
  Warnings:

  - You are about to drop the column `fridge_id_final` on the `EMPAQUES` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EMPAQUES" DROP COLUMN "fridge_id_final",
ADD COLUMN     "id_nevera_anterior" INTEGER;
