-- ============================================================
-- Paso 4 (Opción C): Índices compuestos en id_admin
-- Reemplaza el particionamiento. PostgreSQL usa estos índices
-- para Index Scan cuando filtra WHERE id_admin = X
-- ============================================================

-- ─── TRANSACCIONES: índices por admin ────────────────────────
CREATE INDEX "TRANSACCIONES_id_admin_usuario_idx"
  ON "TRANSACCIONES" ("id_admin", "id_usuario");

CREATE INDEX "TRANSACCIONES_id_admin_hora_idx"
  ON "TRANSACCIONES" ("id_admin", "hora_transaccion");

CREATE INDEX "TRANSACCIONES_id_admin_estado_idx"
  ON "TRANSACCIONES" ("id_admin", "estado_transaccion");

CREATE INDEX "TRANSACCIONES_id_admin_empaque_idx"
  ON "TRANSACCIONES" ("id_admin", "id_empaque");

CREATE INDEX "TRANSACCIONES_id_admin_nevera_idx"
  ON "TRANSACCIONES" ("id_admin", "id_nevera");

-- ─── EMPAQUES: índices por admin ─────────────────────────────
CREATE INDEX "EMPAQUES_id_admin_estado_idx"
  ON "EMPAQUES" ("id_admin", "id_estado_empaque");

CREATE INDEX "EMPAQUES_id_admin_nevera_idx"
  ON "EMPAQUES" ("id_admin", "id_nevera");

CREATE INDEX "EMPAQUES_id_admin_logistica_idx"
  ON "EMPAQUES" ("id_admin", "id_logistica");

CREATE INDEX "EMPAQUES_id_admin_producto_idx"
  ON "EMPAQUES" ("id_admin", "id_producto");
