# AGENTS.md — Reglas para nuevos endpoints que mnodifican la tabla `tRANSACCIONES`

## Regla de oro: Nunca escribas directamente sobre `tRANSACCIONES`

Cualquier endpoint que necesite modificar la tabla `tRANSACCIONES` **debe pasar por `TransaccionesService`**. Es el único servicio autorizado (@Global, sin controller).

## Flujo para un nuevo endpoint que toca transacciones

1. **Revisa si el `TransaccionesService` ya cubre el caso:**

2. **Si ningún método existente cubre el caso**, crea la lógica **respetando estrictamente**:
   - **[src/transacciones/README.md](src/transacciones/README.md)** — fuente canónica de signos, tipos, estados y reglas por categoría de usuario.

## Regla para consultas de transacciones (GET) con filtro de mes

Todo endpoint que consulte `tRANSACCIONES` por `id_usuario` + mes/año debe seguir esta lógica de 2 pasos y devolver 2 arrays:

1. **Base**: `WHERE id_usuario AND (fecha BETWEEN mes OR estado = 1)` si es mes actual; solo `BETWEEN` si es mes concreto. Esto asegura que las pendientes de meses anteriores nunca se oculten (solo en mes actual).
2. **Consolidados del mes**: si en el resultado base hay transacciones de tipo `ticket_consolidado`, traer **todas** las transacciones cuyo `id_transaccion_rel` apunte a esos tickets (`WHERE id_usuario AND id_transaccion_rel IN (ids_consolidados) AND id_transaccion NOT IN (ids_base)`). Esto trae todas las transacciones relacionadas al consolidado, sin importar su mes de origen.

La respuesta debe incluir dos arrays:
- **`transacciones`**: las del paso base + las relacionadas del paso 2, **excluyendo** las que van a `consolidados_posteriores`. Son las que entran en la contabilidad del mes.
- **`consolidados_posteriores`**: transacciones del paso base en **estado 2** (PAGADO) con `id_transaccion_rel` apuntando a un ticket que **no** está en el resultado (por ser de un mes posterior). No incluye pendientes (estado 1) ni tickets consolidados. Cada entrada incluye `consolidado_posterior: { id_transaccion, fecha_consolidacion, nota_opcional }`. El frontend las muestra como trabajo de ese mes pero no entran en liquidación (se liquidaron en otro mes).

> **Motivo**: al consultar un mes, las transacciones consolidadas en ese mes deben verse completas (ticket + todas sus relacionadas, que pueden ser de meses anteriores). Las transacciones consolidadas en un mes posterior solo aparecen al consultar ese mes posterior (no se "cuelan" hacia atrás), pero se listan por separado en `consolidados_posteriores` para que el historial del mes muestre todo el trabajo realizado. Las pendientes (estado 1) de meses anteriores solo se muestran al consultar el mes actual.

Referencia: `getCuentasTransacciones()`, `getFinanzas()` y `getEmpaquesPendientesPorNevera()` en `logistica.service.ts`.
