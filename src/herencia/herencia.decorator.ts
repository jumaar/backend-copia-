import { SetMetadata } from '@nestjs/common';
import { HERENCIA_KEY, HerenciaMetadata, HerenciaScope, HerenciaEntidad } from './herencia.types';

/**
 * ─────────────────────────────────────────────────────────────────
 * @Herencia() — Decorador de jerarquía
 * ─────────────────────────────────────────────────────────────────
 *
 * Marca un endpoint para que HerenciaGuard resuelva o verifique
 * el acceso según la jerarquía de usuarios (árbol TOKEN_REGISTRO).
 *
 * ─── PARÁMETROS ─────────────────────────────────────────────────
 *
 * @param tipo   'resolver'  → Calcula los IDs accesibles según el scope
 *                             y los adjunta a req.accessibleUserIds.
 *                             El servicio solo filtra: WHERE id IN (ids).
 *               'verificar' → Verifica que el recurso en paramKey está
 *                             dentro del scope. Si no, lanza 403.
 *
 * @param scope  'propio'       → Solo el ID del usuario actual [userId].
 *              'hijos'        → Usuario + hijos directos (1 nivel en TOKEN_REGISTRO).
 *                               Rol 1 ve todos. Rol 2/4 ven sus hijos directos.
 *              'hermanos'     → Usuarios bajo el mismo padre (mismo id_usuario_creador).
 *              'descendientes'→ Árbol completo: hijos + nietos + sobrinas.
 *                               Rol 4 hereda el scope de su admin padre.
 *
 * @param entidad 'usuario' → Opera sobre IDs de la tabla USUARIOS (directo).
 *               'tienda'  → Opera sobre IDs de TIENDAS (resuelto vía tienda.id_usuario).
 *               'nevera'  → Opera sobre IDs de NEVERAS (resuelto vía nevera→tienda.id_usuario).
 *
 * @param paramKey Nombre del parámetro en la URL/query a verificar.
 *                Solo se usa con tipo='verificar'.
 *                Ej: 'id' para /entity/:id, 'id_usuario' para ?id_usuario=X
 *
 * ─── EJEMPLOS ───────────────────────────────────────────────────
 *
 * // Resolver: "Devuélveme los IDs de todos mis descendientes"
 * @Herencia({ tipo: 'resolver', scope: 'descendientes', entidad: 'usuario' })
 *
 * // Verificar: "¿Puedo acceder a ESTA nevera específica?"
 * @Herencia({ tipo: 'verificar', scope: 'descendientes', entidad: 'nevera', paramKey: 'id' })
 *
 * // Verificar: "¿Este usuario está en mi jerarquía?"
 * @Herencia({ tipo: 'verificar', scope: 'hermanos', entidad: 'usuario', paramKey: 'id_usuario' })
 *
 * // Scope propio: "Solo quiero mis datos"
 * @Herencia({ tipo: 'resolver', scope: 'propio', entidad: 'usuario' })
 *
 * ─── FLUJO INTERNO ──────────────────────────────────────────────
 *
 * Petición → JwtAuthGuard → RolesGuard → HerenciaGuard → Controller
 *                                          │
 *                               ┌──────────┴──────────┐
 *                               │ 1. Lee @Herencia()    │
 *                               │    del handler vía    │
 *                               │    Reflector          │
 *                               │ 2. Resuelve scope     │
 *                               │    vía HerenciaService│
 *                               │ 3a. (resolver) Adjunta│
 *                               │    accessibleUserIds  │
 *                               │    al request         │
 *                               │ 3b. (verificar)       │
 *                               │    Comprueba target   │
 *                               │    ∈ scope → ✅/403   │
 *                               └──────────────────────┘
 *
 * ─── PARA AGENTES IA / DESARROLLADORES ──────────────────────────
 *
 * Para agregar herencia a un NUEVO endpoint:
 *   1. Identifica qué scope necesita (propio/hijos/hermanos/descendientes)
 *   2. Identifica qué entidad opera (usuario/tienda/nevera)
 *   3. Decide si resuelves (pasas IDs al servicio) o verificas (el guard corta)
 *   4. Agrega @UseGuards(HerenciaGuard) si no está a nivel de clase
 *   5. Agrega @Herencia({ tipo, scope, entidad, paramKey? })
 *   6. Si tipo='resolver': el servicio recibe req.accessibleUserIds
 *   7. Si tipo='verificar': el guard ya validó, el controlador ejecuta normal
 *
 * Para agregar una NUEVA entidad al sistema:
 *   1. Agrega el tipo a HerenciaEntidad en herencia.types.ts
 *   2. Agrega el case en HerenciaService.verificarAccesoEntidad()
 *   3. Agrega el case en HerenciaGuard para resolver/verificar
 */
export const Herencia = (metadata: HerenciaMetadata) =>
  SetMetadata(HERENCIA_KEY, metadata);
