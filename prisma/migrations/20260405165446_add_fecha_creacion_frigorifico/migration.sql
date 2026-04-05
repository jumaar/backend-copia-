-- DropIndex
DROP INDEX "public"."stock_nevera_unique_id_nevera_id_producto";

-- AlterTable
ALTER TABLE "EMPAQUES" ALTER COLUMN "costo_tienda" DROP DEFAULT;

-- AlterTable
ALTER TABLE "FRIGORIFICO" ADD COLUMN     "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PRODUCTOS" ALTER COLUMN "precio_tienda" DROP DEFAULT;
