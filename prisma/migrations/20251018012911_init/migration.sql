-- CreateTable
CREATE TABLE "public"."ROLES" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT,

    CONSTRAINT "ROLES_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "public"."USUARIOS" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "apellido_usuario" TEXT,
    "identificacion_usuario" TEXT NOT NULL,
    "celular" DECIMAL(65,30) NOT NULL,
    "email" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_modifi" TIMESTAMP(3) NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "USUARIOS_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."DEPARTAMENTO" (
    "id__departamento" SERIAL NOT NULL,
    "nombre_departamento" TEXT,

    CONSTRAINT "DEPARTAMENTO_pkey" PRIMARY KEY ("id__departamento")
);

-- CreateTable
CREATE TABLE "public"."CIUDAD" (
    "id_ciudad" SERIAL NOT NULL,
    "nombre_ciudad" TEXT,
    "id__departamento" INTEGER NOT NULL,

    CONSTRAINT "CIUDAD_pkey" PRIMARY KEY ("id_ciudad")
);

-- CreateTable
CREATE TABLE "public"."TIENDAS" (
    "id_tienda" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_tienda" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "id_ciudad" INTEGER NOT NULL,

    CONSTRAINT "TIENDAS_pkey" PRIMARY KEY ("id_tienda")
);

-- CreateTable
CREATE TABLE "public"."FRIGORIFICO" (
    "id_frigorifico" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_frigorifico" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,

    CONSTRAINT "FRIGORIFICO_pkey" PRIMARY KEY ("id_frigorifico")
);

-- CreateTable
CREATE TABLE "public"."LOGISTICA" (
    "id_logistica" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "placa_vehiculo" TEXT NOT NULL,

    CONSTRAINT "LOGISTICA_pkey" PRIMARY KEY ("id_logistica")
);

-- CreateTable
CREATE TABLE "public"."NEVERAS" (
    "id_nevera" SERIAL NOT NULL,
    "id_tienda" INTEGER NOT NULL,
    "marca" TEXT,
    "version_software" DECIMAL(65,30) NOT NULL,
    "ultima_conexion" TIMESTAMP(3),

    CONSTRAINT "NEVERAS_pkey" PRIMARY KEY ("id_nevera")
);

-- CreateTable
CREATE TABLE "public"."PRODUCTOS" (
    "id_producto" SERIAL NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio_venta_por_gramo_actual" DECIMAL(65,30) NOT NULL,
    "precio_costo_por_gramo_actual" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PRODUCTOS_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "public"."ESTADO_LOTE" (
    "estado_lote" SERIAL NOT NULL,
    "nombre_estado" TEXT,

    CONSTRAINT "ESTADO_LOTE_pkey" PRIMARY KEY ("estado_lote")
);

-- CreateTable
CREATE TABLE "public"."PROMOCIONES" (
    "id_promocion" SERIAL NOT NULL,
    "nombre" TEXT,
    "tipo" TEXT,
    "valor" DECIMAL(65,30) NOT NULL,
    "condiciones" JSONB NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL,

    CONSTRAINT "PROMOCIONES_pkey" PRIMARY KEY ("id_promocion")
);

-- CreateTable
CREATE TABLE "public"."EMPAQUES" (
    "id_empaque" SERIAL NOT NULL,
    "EPC_id" TEXT NOT NULL,
    "fecha_empaque_1" TIMESTAMP(3),
    "id_frigorifico" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "peso_exacto" DECIMAL(65,30) NOT NULL,
    "costo_frigorifico_congelado" DECIMAL(65,30) NOT NULL,
    "precio_venta_congelado" DECIMAL(65,30) NOT NULL,
    "fecha_vencimiento" DATE,
    "hora_en_logistica_2" TIMESTAMP(3),
    "id_logistica" INTEGER NOT NULL,
    "fridge_id" INTEGER NOT NULL,
    "hora_en_nevera_3" TIMESTAMP(3),
    "hora_pendiente_pago_4" TIMESTAMP(3),
    "hora_para_cambio_5" TIMESTAMP(3),
    "fridge_id_final" INTEGER,
    "hora_surtido_final_6" TIMESTAMP(3),
    "fecha_finalizacion_7_8" TIMESTAMP(3),
    "estado_lote" INTEGER NOT NULL,
    "promocion" INTEGER,

    CONSTRAINT "EMPAQUES_pkey" PRIMARY KEY ("id_empaque")
);

-- CreateTable
CREATE TABLE "public"."TEMPERATURA_NEVERA" (
    "id_estatus_code" SERIAL NOT NULL,
    "id_nevera" INTEGER NOT NULL,
    "temperatura" DECIMAL(65,30) NOT NULL,
    "fecha_lectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TEMPERATURA_NEVERA_pkey" PRIMARY KEY ("id_estatus_code")
);

-- CreateTable
CREATE TABLE "public"."TIPO_TRANSACCION" (
    "id_tipo" SERIAL NOT NULL,
    "nombre_codigo" TEXT NOT NULL,
    "descripcion_amigable" TEXT,

    CONSTRAINT "TIPO_TRANSACCION_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "public"."ESTADO_TRANSACCION" (
    "id_estado_transaccion" SERIAL NOT NULL,
    "nombre_estado" TEXT NOT NULL,

    CONSTRAINT "ESTADO_TRANSACCION_pkey" PRIMARY KEY ("id_estado_transaccion")
);

-- CreateTable
CREATE TABLE "public"."TRANSACCIONES" (
    "id_transaccion" SERIAL NOT NULL,
    "id_empaque" INTEGER,
    "id_usuario" INTEGER NOT NULL,
    "id_transaccion_rel" INTEGER,
    "monto" DECIMAL(65,30) NOT NULL,
    "hora_transaccion" TIMESTAMP(3),
    "descripcion" TEXT,
    "estado_transaccion" INTEGER NOT NULL,
    "id_tipo_transaccion" INTEGER NOT NULL,
    "promocion_id" INTEGER,

    CONSTRAINT "TRANSACCIONES_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateTable
CREATE TABLE "public"."PROVEEDORES" (
    "id_proveedor" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_proveedor" TEXT NOT NULL,
    "nit" TEXT NOT NULL,

    CONSTRAINT "PROVEEDORES_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_identificacion_usuario_key" ON "public"."USUARIOS"("identificacion_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_celular_key" ON "public"."USUARIOS"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_email_key" ON "public"."USUARIOS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TIENDAS_direccion_key" ON "public"."TIENDAS"("direccion");

-- CreateIndex
CREATE UNIQUE INDEX "FRIGORIFICO_direccion_key" ON "public"."FRIGORIFICO"("direccion");

-- CreateIndex
CREATE UNIQUE INDEX "LOGISTICA_placa_vehiculo_key" ON "public"."LOGISTICA"("placa_vehiculo");

-- CreateIndex
CREATE UNIQUE INDEX "EMPAQUES_EPC_id_key" ON "public"."EMPAQUES"("EPC_id");

-- CreateIndex
CREATE UNIQUE INDEX "PROVEEDORES_nit_key" ON "public"."PROVEEDORES"("nit");

-- AddForeignKey
ALTER TABLE "public"."USUARIOS" ADD CONSTRAINT "USUARIOS_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CIUDAD" ADD CONSTRAINT "CIUDAD_id__departamento_fkey" FOREIGN KEY ("id__departamento") REFERENCES "public"."DEPARTAMENTO"("id__departamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TIENDAS" ADD CONSTRAINT "TIENDAS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TIENDAS" ADD CONSTRAINT "TIENDAS_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "public"."CIUDAD"("id_ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FRIGORIFICO" ADD CONSTRAINT "FRIGORIFICO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LOGISTICA" ADD CONSTRAINT "LOGISTICA_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NEVERAS" ADD CONSTRAINT "NEVERAS_id_tienda_fkey" FOREIGN KEY ("id_tienda") REFERENCES "public"."TIENDAS"("id_tienda") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_frigorifico_fkey" FOREIGN KEY ("id_frigorifico") REFERENCES "public"."FRIGORIFICO"("id_frigorifico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."PRODUCTOS"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_logistica_fkey" FOREIGN KEY ("id_logistica") REFERENCES "public"."LOGISTICA"("id_logistica") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "fridge_id" FOREIGN KEY ("fridge_id") REFERENCES "public"."NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "EMPAQUES_estado_lote_fkey" FOREIGN KEY ("estado_lote") REFERENCES "public"."ESTADO_LOTE"("estado_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EMPAQUES" ADD CONSTRAINT "promocion" FOREIGN KEY ("promocion") REFERENCES "public"."PROMOCIONES"("id_promocion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TEMPERATURA_NEVERA" ADD CONSTRAINT "TEMPERATURA_NEVERA_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "public"."NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_empaque_fkey" FOREIGN KEY ("id_empaque") REFERENCES "public"."EMPAQUES"("id_empaque") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_transaccion_rel_fkey" FOREIGN KEY ("id_transaccion_rel") REFERENCES "public"."TRANSACCIONES"("id_transaccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_estado_transaccion_fkey" FOREIGN KEY ("estado_transaccion") REFERENCES "public"."ESTADO_TRANSACCION"("id_estado_transaccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_tipo_transaccion_fkey" FOREIGN KEY ("id_tipo_transaccion") REFERENCES "public"."TIPO_TRANSACCION"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_promocion_id_fkey" FOREIGN KEY ("promocion_id") REFERENCES "public"."PROMOCIONES"("id_promocion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PROVEEDORES" ADD CONSTRAINT "PROVEEDORES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
