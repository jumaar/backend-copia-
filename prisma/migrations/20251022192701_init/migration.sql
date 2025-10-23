-- CreateEnum
CREATE TYPE "TipoMedia" AS ENUM ('IMAGEN', 'VIDEO');

-- CreateTable
CREATE TABLE "ROLES" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT,

    CONSTRAINT "ROLES_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "PERMISOS_ROLES" (
    "id_rol_creador" INTEGER NOT NULL,
    "id_rol_creable" INTEGER NOT NULL,

    CONSTRAINT "PERMISOS_ROLES_pkey" PRIMARY KEY ("id_rol_creador","id_rol_creable")
);

-- CreateTable
CREATE TABLE "TOKEN_REGISTRO" (
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
CREATE TABLE "USUARIOS" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_usuario" TEXT,
    "apellido_usuario" TEXT,
    "identificacion_usuario" TEXT,
    "celular" DECIMAL(65,30),
    "email" TEXT NOT NULL,
    "contraseña" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_modifi" TIMESTAMP(3) NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "USUARIOS_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "DEPARTAMENTO" (
    "id__departamento" SERIAL NOT NULL,
    "nombre_departamento" TEXT,

    CONSTRAINT "DEPARTAMENTO_pkey" PRIMARY KEY ("id__departamento")
);

-- CreateTable
CREATE TABLE "CIUDAD" (
    "id_ciudad" SERIAL NOT NULL,
    "nombre_ciudad" TEXT,
    "id__departamento" INTEGER NOT NULL,

    CONSTRAINT "CIUDAD_pkey" PRIMARY KEY ("id_ciudad")
);

-- CreateTable
CREATE TABLE "TIENDAS" (
    "id_tienda" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_tienda" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "id_ciudad" INTEGER NOT NULL,

    CONSTRAINT "TIENDAS_pkey" PRIMARY KEY ("id_tienda")
);

-- CreateTable
CREATE TABLE "FRIGORIFICO" (
    "id_frigorifico" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_frigorifico" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "id_ciudad" INTEGER NOT NULL,

    CONSTRAINT "FRIGORIFICO_pkey" PRIMARY KEY ("id_frigorifico")
);

-- CreateTable
CREATE TABLE "LOGISTICA" (
    "id_logistica" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_empresa" TEXT NOT NULL,
    "placa_vehiculo" TEXT NOT NULL,

    CONSTRAINT "LOGISTICA_pkey" PRIMARY KEY ("id_logistica")
);

-- CreateTable
CREATE TABLE "ESTADO_NEVERA" (
    "id_estado_nevera" SERIAL NOT NULL,
    "estado_nevera" TEXT NOT NULL,

    CONSTRAINT "ESTADO_NEVERA_pkey" PRIMARY KEY ("id_estado_nevera")
);

-- CreateTable
CREATE TABLE "NEVERAS" (
    "id_nevera" SERIAL NOT NULL,
    "contraseña" TEXT NOT NULL,
    "id_estado_nevera" INTEGER NOT NULL,
    "id_tienda" INTEGER NOT NULL,
    "version_software" DECIMAL(65,30) NOT NULL,
    "ultima_conexion" TIMESTAMP(3),
    "id_lista_reproduccion" INTEGER,

    CONSTRAINT "NEVERAS_pkey" PRIMARY KEY ("id_nevera")
);

-- CreateTable
CREATE TABLE "PRODUCTOS" (
    "id_producto" SERIAL NOT NULL,
    "nombre_producto" TEXT NOT NULL,
    "descripcion_producto" TEXT,
    "peso_nominal_g" INTEGER NOT NULL,
    "precio_venta" DECIMAL(65,30) NOT NULL,
    "dias_vencimiento" INTEGER NOT NULL,
    "precio_frigorifico" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PRODUCTOS_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "ESTADO_EMPAQUE" (
    "id_estado_empaque" SERIAL NOT NULL,
    "nombre_estado" TEXT,

    CONSTRAINT "ESTADO_EMPAQUE_pkey" PRIMARY KEY ("id_estado_empaque")
);

-- CreateTable
CREATE TABLE "PROMOCIONES" (
    "id_promocion" SERIAL NOT NULL,
    "nombre" TEXT,
    "tipo" TEXT,
    "valor" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PROMOCIONES_pkey" PRIMARY KEY ("id_promocion")
);

-- CreateTable
CREATE TABLE "EMPAQUES" (
    "id_empaque" SERIAL NOT NULL,
    "EPC_id" TEXT NOT NULL,
    "fecha_empaque_1" TIMESTAMP(3) NOT NULL,
    "id_frigorifico" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "peso_exacto_g" DECIMAL(65,30) NOT NULL,
    "precio_venta_total" DECIMAL(65,30) NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "costo_frigorifico" DECIMAL(65,30) NOT NULL,
    "id_logistica" INTEGER,
    "hora_en_logistica_2" TIMESTAMP(3),
    "id_nevera" INTEGER,
    "hora_en_nevera_3" TIMESTAMP(3),
    "hora_pendiente_pago_4" TIMESTAMP(3),
    "hora_para_cambio_5" TIMESTAMP(3),
    "fridge_id_final" INTEGER,
    "hora_surtido_final_6" TIMESTAMP(3),
    "fecha_finalizacion_7_8" TIMESTAMP(3),
    "id_estado_empaque" INTEGER NOT NULL,
    "promocion_id" INTEGER,

    CONSTRAINT "EMPAQUES_pkey" PRIMARY KEY ("id_empaque")
);

-- CreateTable
CREATE TABLE "TEMPERATURA_NEVERA" (
    "id_temperatura_nevera" SERIAL NOT NULL,
    "nombre_estado" TEXT,

    CONSTRAINT "TEMPERATURA_NEVERA_pkey" PRIMARY KEY ("id_temperatura_nevera")
);

-- CreateTable
CREATE TABLE "REPORTE_ESTADO_NEVERAS" (
    "id_reporte_estado" SERIAL NOT NULL,
    "id_nevera" INTEGER NOT NULL,
    "hora_reporte" TIMESTAMP(3) NOT NULL,
    "evento" TEXT,
    "temperatura_c" DOUBLE PRECISION NOT NULL,
    "id_temperatura_nevera" INTEGER NOT NULL,

    CONSTRAINT "REPORTE_ESTADO_NEVERAS_pkey" PRIMARY KEY ("id_reporte_estado")
);

-- CreateTable
CREATE TABLE "TIPO_TRANSACCION" (
    "id_tipo" SERIAL NOT NULL,
    "nombre_codigo" TEXT NOT NULL,
    "descripcion_amigable" TEXT,

    CONSTRAINT "TIPO_TRANSACCION_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "ESTADO_TRANSACCION" (
    "id_estado_transaccion" SERIAL NOT NULL,
    "nombre_estado" TEXT NOT NULL,

    CONSTRAINT "ESTADO_TRANSACCION_pkey" PRIMARY KEY ("id_estado_transaccion")
);

-- CreateTable
CREATE TABLE "TRANSACCIONES" (
    "id_transaccion" SERIAL NOT NULL,
    "id_empaque" INTEGER,
    "id_usuario" INTEGER NOT NULL,
    "id_transaccion_rel" INTEGER,
    "monto" DECIMAL(65,30) NOT NULL,
    "hora_transaccion" TIMESTAMP(3) NOT NULL,
    "id_tipo_transaccion" INTEGER NOT NULL,
    "nota_opcional" TEXT,
    "estado_transaccion" INTEGER NOT NULL,

    CONSTRAINT "TRANSACCIONES_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateTable
CREATE TABLE "STOCK_NEVERA_PRODUCTO" (
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
CREATE TABLE "BIBLIOTECA" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoMedia" NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "BIBLIOTECA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LISTA_DE_REPRODUCCION" (
    "id_lista_reproduccion" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "lista_json" JSONB,

    CONSTRAINT "LISTA_DE_REPRODUCCION_pkey" PRIMARY KEY ("id_lista_reproduccion")
);

-- CreateTable
CREATE TABLE "ITEMS_DE_REPRODUCCION" (
    "id" SERIAL NOT NULL,
    "id_lista_reproduccion" INTEGER NOT NULL,
    "id_biblioteca" INTEGER NOT NULL,
    "tiempo_reproduccion_s" INTEGER NOT NULL,
    "orden_reproduccion" INTEGER NOT NULL,

    CONSTRAINT "ITEMS_DE_REPRODUCCION_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "REFRESH_TOKENS" (
    "id_refresh_token" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "REFRESH_TOKENS_pkey" PRIMARY KEY ("id_refresh_token")
);

-- CreateIndex
CREATE UNIQUE INDEX "TOKEN_REGISTRO_token_key" ON "TOKEN_REGISTRO"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TOKEN_REGISTRO_id_usuario_nuevo_key" ON "TOKEN_REGISTRO"("id_usuario_nuevo");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_identificacion_usuario_key" ON "USUARIOS"("identificacion_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_celular_key" ON "USUARIOS"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIOS_email_key" ON "USUARIOS"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TIENDAS_direccion_key" ON "TIENDAS"("direccion");

-- CreateIndex
CREATE UNIQUE INDEX "FRIGORIFICO_direccion_key" ON "FRIGORIFICO"("direccion");

-- CreateIndex
CREATE UNIQUE INDEX "LOGISTICA_placa_vehiculo_key" ON "LOGISTICA"("placa_vehiculo");

-- CreateIndex
CREATE UNIQUE INDEX "EMPAQUES_EPC_id_key" ON "EMPAQUES"("EPC_id");

-- CreateIndex
CREATE UNIQUE INDEX "REFRESH_TOKENS_token_key" ON "REFRESH_TOKENS"("token");

-- AddForeignKey
ALTER TABLE "PERMISOS_ROLES" ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creador_fkey" FOREIGN KEY ("id_rol_creador") REFERENCES "ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PERMISOS_ROLES" ADD CONSTRAINT "PERMISOS_ROLES_id_rol_creable_fkey" FOREIGN KEY ("id_rol_creable") REFERENCES "ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_creador_fkey" FOREIGN KEY ("id_usuario_creador") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_rol_nuevo_usuario_fkey" FOREIGN KEY ("id_rol_nuevo_usuario") REFERENCES "ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOKEN_REGISTRO" ADD CONSTRAINT "TOKEN_REGISTRO_id_usuario_nuevo_fkey" FOREIGN KEY ("id_usuario_nuevo") REFERENCES "USUARIOS"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "USUARIOS" ADD CONSTRAINT "USUARIOS_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "ROLES"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CIUDAD" ADD CONSTRAINT "CIUDAD_id__departamento_fkey" FOREIGN KEY ("id__departamento") REFERENCES "DEPARTAMENTO"("id__departamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TIENDAS" ADD CONSTRAINT "TIENDAS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TIENDAS" ADD CONSTRAINT "TIENDAS_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "CIUDAD"("id_ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FRIGORIFICO" ADD CONSTRAINT "FRIGORIFICO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FRIGORIFICO" ADD CONSTRAINT "FRIGORIFICO_id_ciudad_fkey" FOREIGN KEY ("id_ciudad") REFERENCES "CIUDAD"("id_ciudad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LOGISTICA" ADD CONSTRAINT "LOGISTICA_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NEVERAS" ADD CONSTRAINT "NEVERAS_id_tienda_fkey" FOREIGN KEY ("id_tienda") REFERENCES "TIENDAS"("id_tienda") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NEVERAS" ADD CONSTRAINT "NEVERAS_id_estado_nevera_fkey" FOREIGN KEY ("id_estado_nevera") REFERENCES "ESTADO_NEVERA"("id_estado_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NEVERAS" ADD CONSTRAINT "NEVERAS_id_lista_reproduccion_fkey" FOREIGN KEY ("id_lista_reproduccion") REFERENCES "LISTA_DE_REPRODUCCION"("id_lista_reproduccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_frigorifico_fkey" FOREIGN KEY ("id_frigorifico") REFERENCES "FRIGORIFICO"("id_frigorifico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "PRODUCTOS"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_logistica_fkey" FOREIGN KEY ("id_logistica") REFERENCES "LOGISTICA"("id_logistica") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "NEVERAS"("id_nevera") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_id_estado_empaque_fkey" FOREIGN KEY ("id_estado_empaque") REFERENCES "ESTADO_EMPAQUE"("id_estado_empaque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMPAQUES" ADD CONSTRAINT "EMPAQUES_promocion_id_fkey" FOREIGN KEY ("promocion_id") REFERENCES "PROMOCIONES"("id_promocion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REPORTE_ESTADO_NEVERAS" ADD CONSTRAINT "REPORTE_ESTADO_NEVERAS_id_temperatura_nevera_fkey" FOREIGN KEY ("id_temperatura_nevera") REFERENCES "TEMPERATURA_NEVERA"("id_temperatura_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_empaque_fkey" FOREIGN KEY ("id_empaque") REFERENCES "EMPAQUES"("id_empaque") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_transaccion_rel_fkey" FOREIGN KEY ("id_transaccion_rel") REFERENCES "TRANSACCIONES"("id_transaccion") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_estado_transaccion_fkey" FOREIGN KEY ("estado_transaccion") REFERENCES "ESTADO_TRANSACCION"("id_estado_transaccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TRANSACCIONES" ADD CONSTRAINT "TRANSACCIONES_id_tipo_transaccion_fkey" FOREIGN KEY ("id_tipo_transaccion") REFERENCES "TIPO_TRANSACCION"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STOCK_NEVERA_PRODUCTO" ADD CONSTRAINT "STOCK_NEVERA_PRODUCTO_id_nevera_fkey" FOREIGN KEY ("id_nevera") REFERENCES "NEVERAS"("id_nevera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "STOCK_NEVERA_PRODUCTO" ADD CONSTRAINT "STOCK_NEVERA_PRODUCTO_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "PRODUCTOS"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEMS_DE_REPRODUCCION" ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_lista_reproduccion_fkey" FOREIGN KEY ("id_lista_reproduccion") REFERENCES "LISTA_DE_REPRODUCCION"("id_lista_reproduccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEMS_DE_REPRODUCCION" ADD CONSTRAINT "ITEMS_DE_REPRODUCCION_id_biblioteca_fkey" FOREIGN KEY ("id_biblioteca") REFERENCES "BIBLIOTECA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "REFRESH_TOKENS" ADD CONSTRAINT "REFRESH_TOKENS_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIOS"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
