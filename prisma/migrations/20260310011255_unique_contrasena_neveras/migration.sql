/*
  Warnings:

  - A unique constraint covering the columns `[contraseña]` on the table `NEVERAS` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NEVERAS_contraseña_key" ON "NEVERAS"("contraseña");
