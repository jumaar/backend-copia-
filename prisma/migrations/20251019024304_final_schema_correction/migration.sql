/*
  Warnings:

  - You are about to drop the column `costo_frigorifico_congelado` on the `EMPAQUES` table. All the data in the column will be lost.
  - You are about to drop the column `estado_lote` on the `EMPAQUES` table. All the data in the column will be lost.
  - You are about to drop the column `peso_exacto` on the `EMPAQUES` table. All the data in the column will be lost.
  - You are about to drop the column `precio_venta_congelado` on the `EMPAQUES` table. All the data in the column will be lost.
  - You are about to drop the column `promocion` on the `EMPAQUES` table. All the data in the column will be lost.
  - The primary key for the `NEVERAS` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_nevera` on the `NEVERAS` table. All the data in the column will be lost.
  - You are about to drop the column `marca` on the `NEVERAS` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `PRODUCTOS` table. All the data in the column will be lost.
  - You are about to drop the column `precio_costo_por_gramo_actual` on the `PRODUCTOS` table. All the data in the column will be lost.
  - You are about to drop the column `precio_venta_por_gramo_actual` on the `PRODUCTOS` table. All the data in the column will be lost.
  - You are about to drop the column `activo` on the `PROMOCIONES` table. All the data in the column will be lost.
  - You are about to drop the column `condiciones` on the `PROMOCIONES` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_fin` on the `PROMOCIONES` table. All the data in the column will be lost.
  - You are about to drop the column `fecha_inicio` on the `PROMOCIONES` table. All the data in the column will be lost.
  - The primary key for the `TEMPERATURA_NEVERA` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fecha_lectura` on the `TEMPERATURA_NEVERA` table. All the data in the column will be lost.
  - You are about to drop the column `id_estatus_code` on the `TEMPERATURA_NEVERA` table. All the data in the column will be lost.
  - You are about to drop the column `id_nevera` on the `TEMPERATURA_NEVERA` table. All the data in the column will be lost.
  - You are about to drop the column `temperatura` on the `TEMPERATURA_NEVERA` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `TRANSACCIONES` table. All the data in the column will be lost.
  - You are about to drop the column `promocion_id` on the `TRANSACCIONES` table. All the data in the column will be lost.
  - You are about to drop the `ESTADO_LOTE` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PROVEEDORES` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `costo_frigorifico` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_estado_empaque` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peso_exacto_g` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio_venta_total` to the `EMPAQUES` table without a default value. This is not possible if the table is not empty.
  - Made the column `fecha_empaque_1` on table `EMPAQUES` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha_vencimiento` on table `EMPAQUES` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `id_ciudad` to the `FRIGORIFICO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contraseña` to the `NEVERAS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_estado_nevera` to the `NEVERAS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dias_vencimiento` to the `PRODUCTOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `peso_nominal_g` to the `PRODUCTOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio_frigorifico` to the `PRODUCTOS` table without a default value. This is not possible if the table is not empty.
  - Added the required column `precio_venta` to the `PRODUCTOS` table without a default value. This is not possible if the table is not empty.
  - Made the column `hora_transaccion` on table `TRANSACCIONES` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "EMPAQUES_estado_lote_fkey";

-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "EMPAQUES_id_logistica_fkey";

-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "fridge_id";

-- DropForeignKey
ALTER TABLE "public"."EMPAQUES" DROP CONSTRAINT "promocion";

-- DropForeignKey
ALTER TABLE "public"."PROVEEDORES" DROP CONSTRAINT "PROVEEDORES_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."TEMPERATURA_NEVERA" DROP CONSTRAINT "TEMPERATURA_NEVERA_id_nevera_fkey";

-- DropForeignKey
ALTER TABLE "public"."TRANSACCIONES" DROP CONSTRAINT "TRANSACCIONES_promocion_id_fkey";

-- AlterTable
ALTER TABLE "public"."EMPAQUES" DROP COLUMN "costo_frigorifico_congelado",
DROP COLUMN "estado_lote",
DROP COLUMN "peso_exacto",
DROP COLUMN "precio_venta_congelado",
DROP COLUMN "promocion",
ADD COLUMN     "costo_frigorifico" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "id_estado_empaque" INTEGER NOT NULL,
ADD COLUMN     "peso_exacto_g" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "precio_venta_total" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "promocion_id" INTEGER,
ALTER COLUMN "fecha_empaque_1" SET NOT NULL,
ALTER COLUMN "fecha_vencimiento" SET NOT NULL,
ALTER COLUMN "id_logistica" DROP NOT NULL,
ALTER COLUMN "fridge_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."FRIGORIFICO" ADD COLUMN     "id_ciudad" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."NEVERAS" DROP CONSTRAINT "NEVERAS_pkey",
DROP COLUMN "id_nevera",
DROP COLUMN "marca",
ADD COLUMN     "contraseña" TEXT NOT NULL,
ADD COLUMN     "fridge_id" SERIAL NOT NULL,
ADD COLUMN     "id_estado_nevera" INTEGER NOT NULL,
ADD CONSTRAINT "NEVERAS_pkey" PRIMARY KEY ("fridge_id");

-- AlterTable
ALTER TABLE "public"."PRODUCTOS" DROP COLUMN "descripcion",
DROP COLUMN "precio_costo_por_gramo_actual",
DROP COLUMN "precio_venta_por_gramo_actual",
ADD COLUMN     "descripcion_producto" TEXT,
ADD COLUMN     "dias_vencimiento" INTEGER NOT NULL,
ADD COLUMN     "peso_nominal_g" INTEGER NOT NULL,
ADD COLUMN     "precio_frigorifico" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "precio_venta" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "public"."PROMOCIONES" DROP COLUMN "activo",
DROP COLUMN "condiciones",
DROP COLUMN "fecha_fin",
DROP COLUMN "fecha_inicio";

-- AlterTable
ALTER TABLE "public"."TEMPERATURA_NEVERA" DROP CONSTRAINT "TEMPERATURA_NEVERA_pkey",
DROP COLUMN "fecha_lectura",
DROP COLUMN "id_estatus_code",
DROP COLUMN "id_nevera",
DROP COLUMN "temperatura",
ADD COLUMN     "id_temperatura_nevera" SERIAL NOT NULL,
ADD COLUMN     "nombre_estado" TEXT,
ADD CONSTRAINT "TEMPERATURA_NEVERA_pkey" PRIMARY KEY ("id_temperatura_nevera");

-- AlterTable
ALTER TABLE "public"."TRANSACCIONES" DROP COLUMN "descripcion",
DROP COLUMN "promocion_id",
ADD COLUMN     "nota_opcional" TEXT,
ALTER COLUMN "hora_transaccion" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."USUARIOS" ALTER COLUMN "nombre_usuario" DROP NOT NULL,
ALTER COLUMN "identificacion_usuario" DROP NOT NULL,
ALTER COLUMN "celular" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ESTADO_LOTE";

-- DropTable
DROP TABLE "public"."PROVEEDORES";

-- CreateTable
CREATE TABLE "public"."PERMISOS_ROLES" (
    "id_rol_creador" INTEGER NOT NULL,
    "id_rol_creable" INTEGER NOT NULL,

    CONSTRAINT "PERMISOS_ROLES_pkey" PRIMARY KEY ("id_rol_creador","id_rol_creable")
);

-- CreateTable
CREATE TABLE "public"."TOKEN_REGISTRO" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "es_usado" BOOLEAN NOT NULL DEFAULT false,
    "id_usuario_creador" INTEGER NOT NULL,
    "id_rol_nuevo_usuario" INTEGER NOT NULL,
    "id_usuario_nuevo" INTEGER,

    CONSTRAINT "TOKEN_REGISTRO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ESTADO_NEVERA" (
    "id_estado_nevera" SERIAL NOT NULL,
    "estado_nevera" TEXT NOT NULL,

    CONSTRAINT "ESTADO_NEVERA_pkey" PRIMARY KEY ("id_estado_nevera")
);

-- CreateTable
CREATE TABLE "public"."ESTADO_EMPAQUE" (
    "id_estado_empaque" SERIAL NOT NULL,
    "nombre_estado" TEXT,

    CONSTRAINT "ESTADO_EMPAQUE_pkey" PRIMARY KEY ("id_estado_empaque")
);

-- CreateTable
CREATE TABLE "public"."REPORTE_ESTADO_NEVERAS" (
    "id_reporte_estado" SERIAL NOT NULL,
    "fridge_id" INTEGER NOT NULL,
    "hora_reporte" TIMESTAMP(3) NOT NULL,
    "evento" TEXT,
    "temperatura_c" DOUBLE PRECISION NOT NULL,
    "id_temperatura_nevera" INTEGER NOT NULL,

    CONSTRAINT "REPORTE_ESTADO_NEVERAS_pkey" PRIMARY KEY ("id_reporte_estado")
);

-- CreateIndex
CREATE UNIQUE INDEX "TOKEN_REGISTRO_token_key" ON "public"."TOKEN_REGISTRO"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TOKEN_REGISTRO_id_usuario_nuevo_key" ON "public"."TOKEN_REGISTRO"("id_usuario_nuevo");

-- AddForeignKey
ALTER TABLE "public"."PERMISOS_ROLES" ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creador_fkey" FOREIGN KEY ("id_rol_creador") REFERENCES "public"."ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PERMISOS_ROLES" ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creable_fkey" FOREIGN KEY ("id_rol_creable") REFERENCES "public"."ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_creador_fkey" FOREIGN KEY ("id_usuario_creador") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_rol_nuevo_usuario_fkey" FOREIGN KEY ("id_rol_nuevo_usuario") REFERENCES "public"."ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_nuevo_fkey" FOREIGN KEY ("id_usuario_nuevo") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FRIGORIFICO" ADD CONSTRAINT "FRIGORIFICO_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "public"."CIUDAD"("id_ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NEVERAS" ADD CONSTRAINT "NEVERAS_id_estado_nevera_fkey" FOREIGN KEY ("id_estado_nevera") REFERENCES "public"."ESTADO_NEVERA"("id_estado_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_logistica_fkey" FOREIGN KEY ("id_logistica") REFERENCES "public"."LOGISTICA"("id_logistica") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "fridge_id" FOREIGN KEY ("fridge_id") REFERENCES "public"."NEVERAS"("fridge_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_estado_empaque_fkey" FOREIGN KEY ("id_estado_empaque") REFERENCES "public"."ESTADO_EMPAQUE"("id_estado_empaque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_promocion_id_fkey" FOREIGN KEY ("promocion_id") REFERENCES "public"."PROMOCIONES"("id_promocion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "public"."NEVERAS"("fridge_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_temperatura_nevera_fkey" FOREIGN KEY ("id_temperatura_nevera") REFERENCES "public"."TEMPERATURA_NEVERA"("id_temperatura_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;
