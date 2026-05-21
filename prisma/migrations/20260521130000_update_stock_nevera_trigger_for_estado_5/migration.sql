-- Actualizar el trigger 'update_stock_nevera' para que cuente
-- empaques en estado 3 (EN NEVERA) y 5 (PARA CAMBIO) como stock fisico.
-- Ambos estados representan empaques que estan fisicamente en la nevera.

CREATE OR REPLACE FUNCTION update_stock_nevera_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso entrada: empaque entra a nevera (estado 3 o 5)
    IF NEW.id_estado_empaque IN (3, 5) AND (OLD.id_estado_empaque IS NULL OR OLD.id_estado_empaque NOT IN (3, 5)) AND NEW.id_nevera IS NOT NULL THEN
        INSERT INTO "STOCK_NEVERA" (id_nevera, id_producto, stock_en_tiempo_real, stock_ideal_final, calificacion_surtido)
        VALUES (NEW.id_nevera, NEW.id_producto, 1, 0, 'pendiente')
        ON CONFLICT (id_nevera, id_producto) DO UPDATE SET stock_en_tiempo_real = "STOCK_NEVERA".stock_en_tiempo_real + 1;
    END IF;

    -- Caso salida: empaque sale de nevera (de estado 3 o 5 a otro estado)
    IF OLD.id_estado_empaque IN (3, 5) AND (NEW.id_estado_empaque IS NULL OR NEW.id_estado_empaque NOT IN (3, 5)) AND OLD.id_nevera IS NOT NULL THEN
        UPDATE "STOCK_NEVERA" SET stock_en_tiempo_real = stock_en_tiempo_real - 1
        WHERE id_nevera = OLD.id_nevera AND id_producto = OLD.id_producto;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
