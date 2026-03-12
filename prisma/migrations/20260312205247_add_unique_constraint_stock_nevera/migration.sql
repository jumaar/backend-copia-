-- Agregar restricción única en STOCK_NEVERA para (id_nevera, id_producto)
ALTER TABLE "STOCK_NEVERA" ADD CONSTRAINT stock_nevera_unique_id_nevera_id_producto UNIQUE (id_nevera, id_producto);