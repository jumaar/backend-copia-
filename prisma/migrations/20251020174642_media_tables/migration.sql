/*
  Warnings:

  - You are about to drop the column `fridge_id` on the `EMPAQUES` table. All the data in the column will be lost.
  - The primary key for the `NEVERAS` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fridge_id` on the `NEVERAS` table. All the data in the column will be lost.
  - You are about to drop the column `fridge_id` on the `REPORTE_ESTADO_NEVERAS` table. All the data in the column will be lost.
  - Added the required column `id_nevera` to the `REPORTE_ESTADO_NEVERAS` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TipoMedia" AS ENUM ('IMAGEN', 'VIDEO');

-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "fridge_id";

-- DropForeignKey
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" DROP CONSTRAINT "REPORTE_ESTADO_NEVERAS_fridge_id_fkey";

-- AlterTable
ALTER TABLE "public"."EMPAQUES" DROP COLUMN "fridge_id",
ADD COLUMN     "id_nevera" INTEGER;

-- AlterTable
ALTER TABLE "public"."NEVERAS" DROP CONSTRAINT "NEVERAS_pkey",
DROP COLUMN "fridge_id",
ADD COLUMN     "id_lista_reproduccion" INTEGER,
ADD COLUMN     "id_nevera" SERIAL NOT NULL,
ADD CONSTRAINT "NEVERAS_pkey" PRIMARY KEY ("id_nevera");

-- AlterTable
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" DROP COLUMN "fridge_id",
ADD COLUMN     "id_nevera" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."STOCK_NEVERA_PRODUCTO" (
    "id" SERIAL NOT NULL,
    "id_nevera" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "stock_minimo" INTEGER NOT NULL DEFAULT 2,
    "stock_maximo" INTEGER NOT NULL DEFAULT 5,
    "venta_semanal" INTEGER NOT NULL DEFAULT 0,
    "stock_ideal_final" INTEGER NOT NULL,
    "calificacion_sutido" TEXT NOT NULL,
    "mensaje_sistema" TEXT,
    "stock_en_tiempo_real" INTEGER NOT NULL,

    CONSTRAINT "STOCK_NEVERA_PRODUCTO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BIBLIOTECA" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "public"."TipoMedia" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "BIBLIOTECA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LISTA_DE_REPRODUCCION" (
    "id_lista_reproduccion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "LISTA_DE_REPRODUCCION_pkey" PRIMARY KEY ("id_lista_reproduccion")
);

-- CreateTable
CREATE TABLE "public"."ITEMS_DE_REPRODUCCION" (
    "id" SERIAL NOT NULL,
    "id_lista_reproduccion" INTEGER NOT NULL,
    "id_biblioteca" INTEGER NOT NULL,
    "tiempo_reproduccion_s" INTEGER NOT NULL,
    "orden_reproduccion" INTEGER NOT NULL,

    CONSTRAINT "ITEMS_DE_REPRODUCCION_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."NEVERAS" ADD CONSTRAINT "NEVERAS_id_lista_reproduccion_fkey" FOREIGN KEY ("id_lista_reproduccion") REFERENCES "public"."LISTA_DE_REPRODUCCION"("id_lista_reproduccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "public"."NEVERAS"("id_nevera") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "public"."NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."STOCK_NEVERA_PRODUCTO" ADD CONSTRAINT "STOCK_NEVERA_PRODUCTO_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "public"."NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."STOCK_NEVERA_PRODUCTO" ADD CONSTRAINT "STOCK_NEVERA_PRODUCTO_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."PRODUCTOS"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ITEMS_DE_REPRODUCCION" ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_lista_reproduccion_fkey" FOREIGN KEY ("id_lista_reproduccion") REFERENCES "public"."LISTA_DE_REPRODUCCION"("id_lista_reproduccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ITEMS_DE_REPRODUCCION" ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_biblioteca_fkey" FOREIGN KEY ("id_biblioteca") REFERENCES "public"."BIBLIOTECA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
