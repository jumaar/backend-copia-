/*
  Warnings:

  - Made the column `id_admin` on table `BIBLIOTECA` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `CIUDAD` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `DEPARTAMENTO` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `EMPAQUES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `ESTACIONES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `FRIGORIFICO` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `ITEMS_DE_REPRODUCCION` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `LISTA_DE_REPRODUCCION` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `LOGISTICA` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `NEVERAS` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `PRODUCTOS` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `PROMOCIONES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `REPORTE_ESTADO_NEVERAS` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `STOCK_NEVERA` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `TIENDAS` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `TRANSACCIONES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_admin` on table `USUARIOS` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."BIBLIOTECA" DROP CONSTRAINT "BIBLIOTECA_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."CIUDAD" DROP CONSTRAINT "CIUDAD_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."DEPARTAMENTO" DROP CONSTRAINT "DEPARTAMENTO_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "EMPAQUES_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."ESTACIONES" DROP CONSTRAINT "ESTACIONES_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."FRIGORIFICO" DROP CONSTRAINT "FRIGORIFICO_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."ITEMS_DE_REPRODUCCION" DROP CONSTRAINT "ITEMS_DE_REPRODUCCION_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."LISTA_DE_REPRODUCCION" DROP CONSTRAINT "LISTA_DE_REPRODUCCION_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."LOGISTICA" DROP CONSTRAINT "LOGISTICA_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."NEVERAS" DROP CONSTRAINT "NEVERAS_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."PRODUCTOS" DROP CONSTRAINT "PRODUCTOS_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."PROMOCIONES" DROP CONSTRAINT "PROMOCIONES_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" DROP CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."STOCK_NEVERA" DROP CONSTRAINT "STOCK_NEVERA_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."TIENDAS" DROP CONSTRAINT "TIENDAS_id_admin_fkey";

-- DropForeignKey
ALTER TABLE "public"."TRANSACCIONES" DROP CONSTRAINT "TRANSACCIONES_id_admin_fkey";

-- AlterTable
ALTER TABLE "BIBLIOTECA" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "CIUDAD" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "DEPARTAMENTO" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "EMPAQUES" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "ESTACIONES" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "FRIGORIFICO" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "ITEMS_DE_REPRODUCCION" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "LISTA_DE_REPRODUCCION" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "LOGISTICA" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "NEVERAS" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "PRODUCTOS" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "PROMOCIONES" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "REPORTE_ESTADO_NEVERAS" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "STOCK_NEVERA" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "TIENDAS" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "TRANSACCIONES" ALTER COLUMN "id_admin" SET NOT NULL;

-- AlterTable
ALTER TABLE "USUARIOS" ALTER COLUMN "id_admin" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DEPARTAMENTO" ADD CONSTRAINT "DEPARTAMENTO_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CIUDAD" ADD CONSTRAINT "CIUDAD_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TIENDAS" ADD CONSTRAINT "TIENDAS_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FRIGORIFICO" ADD CONSTRAINT "FRIGORIFICO_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOGISTICA" ADD CONSTRAINT "LOGISTICA_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NEVERAS" ADD CONSTRAINT "NEVERAS_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRODUCTOS" ADD CONSTRAINT "PRODUCTOS_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PROMOCIONES" ADD CONSTRAINT "PROMOCIONES_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STOCK_NEVERA" ADD CONSTRAINT "STOCK_NEVERA_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BIBLIOTECA" ADD CONSTRAINT "BIBLIOTECA_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LISTA_DE_REPRODUCCION" ADD CONSTRAINT "LISTA_DE_REPRODUCCION_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEMS_DE_REPRODUCCION" ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ESTACIONES" ADD CONSTRAINT "ESTACIONES_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
