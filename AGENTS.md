# AGENTS.md — Reglas para nuevos endpoints que mnodifican la tabla `tRANSACCIONES`

## Regla de oro: Nunca escribas directamente sobre `tRANSACCIONES`

Cualquier endpoint que necesite modificar la tabla `tRANSACCIONES` **debe pasar por `TransaccionesService`**. Es el único servicio autorizado (@Global, sin controller).

## Flujo para un nuevo endpoint que toca transacciones

1. **Revisa si el `TransaccionesService` ya cubre el caso:**

2. **Si ningún método existente cubre el caso**, crea la lógica **respetando estrictamente**:
   - **[src/transacciones/README.md](src/transacciones/README.md)** — fuente canónica de signos, tipos, estados y reglas por categoría de usuario.

## Regla para consultas de transacciones (GET) con filtro de mes

Todo endpoint que consulte `tRANSACCIONES` por `id_usuario` + mes/año debe seguir esta lógica de 2 pasos:

1. **Base**: `WHERE id_usuario AND (fecha BETWEEN mes OR estado = 1)` si es mes actual; solo `BETWEEN` si es mes concreto. Esto asegura que las pendientes de meses anteriores nunca se oculten.
2. **Reverse**: `WHERE id_usuario AND id_transaccion_rel IN (ids del paso 1) AND id_transaccion NOT IN (ids del paso 1)`. Captura transacciones de meses anteriores que fueron consolidadas en el mes consultado (estado 2 con `id_transaccion_rel` apuntando a un ticket del mes actual).

> **Motivo**: una consolidación en el mes actual marca pendientes viejas como estado 2 y las vincula al ticket del mes actual. Sin el paso reverse, el frontend muestra el consolidado con valor pero la tabla vacía.

Referencia: `getCuentasTransacciones()` y `getEmpaquesPendientesPorNevera()` en `logistica.service.ts`.
