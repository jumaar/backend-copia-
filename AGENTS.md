# AGENTS.md — Reglas para nuevos endpoints que mnodifican la tabla `tRANSACCIONES`

## Firma JWT: por qué `idAdmin` varía según el rol

El campo `idAdmin` en el JWT (`req.user.idAdmin`) determina el alcance de TODAS las consultas. Se asigna así en `auth.service.ts` (login y refreshToken):

| Rol | `idAdmin` en JWT | Significado |
|---|---|---|
| 1 (Super Admin) | `0` | `idAdmin !== 0` → false → **sin filtro**, ve todo |
| 2 (Admin/Bloque) | `id_usuario` propio | `id_admin = id_usuario` → solo su bloque |
| 3, 4, 5 | `USUARIOS.id_admin` | `id_admin = id_admin` → bloque de su admin padre |

**Motivo:** el dueño del bloque es el rol 2, identificado por su `id_usuario`. Sus subordinados (roles 3/4/5) heredan ese `id_usuario` como `id_admin` en la tabla USUARIOS. El super admin (rol 1) recibe `0` para que el guard `idAdmin !== 0` desactive cualquier filtro y sus consultas sean globales.

**Consecuencia en queries:** TODOS los endpoints usan el mismo patrón directo:
```typescript
...(idAdmin !== 0 && { id_admin: idAdmin })
```
Sin condicionales de rol, sin OR compuestos, sin effectiveIdAdmin. La lógica se resuelve en el JWT, no en cada query.

**Consecuencia en creación de entidades:** al crear tiendas, neveras, frigoríficos, productos o transacciones, el `id_admin` debe asignarse así:
```typescript
id_admin: usuario.id_rol === 2 ? id_usuario : usuario.id_admin
```
Solo el rol 2 usa su `id_usuario` (él ES el bloque). Los demás usan su `USUARIOS.id_admin` heredado. El super admin (rol 1) cae en el else y usa su `id_admin` normal, ya que su visibilidad es global por JWT.

**Regla para nuevos endpoints:** no repliques lógica de roles en los filtros. Usá `req.user.idAdmin` directamente con el patrón `idAdmin !== 0 && { id_admin: idAdmin }`. La firma del JWT ya resolvió el alcance.

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