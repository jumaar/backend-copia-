/*
  Warnings: 

  - Added the required column `costo_tienda` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio_tienda` to the `PRODUCTOS` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "EMPAQUES" ADD COLUMN     "costo_tienda" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PRODUCTOS" ADD COLUMN     "precio_tienda" DECIMAL(65,30) NOT NULL DEFAULT 0;
