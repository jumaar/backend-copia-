-- CreateTable
CREATE TABLE "BASCULAS" (
    "id_bascula" SERIAL NOT NULL,
    "id_frigorifico" INTEGER NOT NULL,
    "clave_vinculacion" TEXT NOT NULL,

    CONSTRAINT "BASCULAS_pkey" PRIMARY KEY ("id_bascula")
);

-- CreateIndex
CREATE UNIQUE INDEX "BASCULAS_clave_vinculacion_key" ON "BASCULAS"("clave_vinculacion");

-- AddForeignKey
ALTER TABLE "BASCULAS" ADD CONSTRAINT "BASCULAS_id_frigorifico_fkey" FOREIGN KEY ("id_frigorifico") REFERENCES "FRIGORIFICO"("id_frigorifico") ON DELETE RESTRICT ON UPDATE CASCADE;
