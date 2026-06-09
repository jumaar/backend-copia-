# AGENTS.md — Reglas para nuevos endpoints

## Regla de oro: Nunca escribas directamente sobre `tRANSACCIONES`

Cualquier endpoint que necesite modificar la tabla `tRANSACCIONES` **debe pasar por `TransaccionesService`**. Es el único servicio autorizado (@Global, sin controller).

## Flujo para un nuevo endpoint que toca transacciones

1. **Revisa si el `TransaccionesService` ya cubre el caso:**

2. **Si ningún método existente cubre el caso**, crea la lógica **respetando estrictamente**:
   - **[src/transacciones/README.md](src/transacciones/README.md)** — fuente canónica de signos, tipos, estados y reglas por categoría de usuario.
