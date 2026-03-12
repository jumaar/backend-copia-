-- Crear función trigger para actualizar stock_nevera
CREATE OR REPLACE FUNCTION update_stock_nevera_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso entrada: empaque entra a nevera (estado 3)
    IF NEW.id_estado_empaque = 3 AND (OLD.id_estado_empaque IS NULL OR OLD.id_estado_empaque != 3) AND NEW.id_nevera IS NOT NULL THEN
        RAISE NOTICE 'Trigger entrada: id_empaque=%, id_nevera=%, id_producto=%, old_estado=%, new_estado=%', NEW.id_empaque, NEW.id_nevera, NEW.id_producto, OLD.id_estado_empaque, NEW.id_estado_empaque;
        INSERT INTO "STOCK_NEVERA" (id_nevera, id_producto, stock_en_tiempo_real, stock_ideal_final, calificacion_surtido)
        VALUES (NEW.id_nevera, NEW.id_producto, 1, 0, 'pendiente')
        ON CONFLICT (id_nevera, id_producto) DO UPDATE SET stock_en_tiempo_real = "STOCK_NEVERA".stock_en_tiempo_real + 1;
    END IF;

    -- Caso salida: empaque sale de nevera (de estado 3 a otro)
    IF OLD.id_estado_empaque = 3 AND (NEW.id_estado_empaque IS NULL OR NEW.id_estado_empaque != 3) AND OLD.id_nevera IS NOT NULL THEN
        RAISE NOTICE 'Trigger salida: id_empaque=%, id_nevera=%, id_producto=%, old_estado=%, new_estado=%', OLD.id_empaque, OLD.id_nevera, OLD.id_producto, OLD.id_estado_empaque, NEW.id_estado_empaque;
        UPDATE "STOCK_NEVERA" SET stock_en_tiempo_real = stock_en_tiempo_real - 1
        WHERE id_nevera = OLD.id_nevera AND id_producto = OLD.id_producto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
CREATE TRIGGER update_stock_nevera
AFTER UPDATE ON "EMPAQUES"
FOR EACH ROW
EXECUTE FUNCTION update_stock_nevera_trigger();