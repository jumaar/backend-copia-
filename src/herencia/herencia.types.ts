/**
 * ─────────────────────────────────────────────────────────────────
 * @module HerenciaTypes
 * ─────────────────────────────────────────────────────────────────
 * Tipos, enums e interfaces para el sistema centralizado de herencia jerárquica.
 *
 * JERARQUÍA DE ROLES:
 *   Rol 1 (Super Admin) → dueño de todo el sistema
 *     └── Rol 2 (Admin) → administrador regional
 *          ├── Rol 3 (Frigorífico) → hijo directo del admin
 *          └── Rol 4 (Logística) → hijo directo del admin
 *               └── Rol 5 (Tienda) → nieto del admin (vía rol 4)
 *                    └── Neveras → entidades hijas de la tienda (sin rol)
 *
 * CADENA DE FK PARA RESOLUCIÓN DE ENTIDADES:
 *   nevera → tienda.id_usuario → usuario
 *   tienda → id_usuario → usuario
 *   usuario → directo
 *
 * CÓMO EXTENDER PARA NUEVAS ENTIDADES:
 *   1. Agregar el nuevo valor al enum `HerenciaEntidad`.
 *   2. Agregar el case en `HerenciaService.resolverScopeEntidad()`.
 *   3. Agregar el case en `HerenciaGuard.verificarAccesoEntidad()`.
 *   4. Si la entidad tiene una cadena de FK distinta, documentarla aquí.
 */

/**
 * Alcance de la jerarquía a resolver.
 *
 * ┌────────────────┬──────────────────────────────────────────────────┐
 * │ Scope          │ Qué resuelve                                     │
 * ├────────────────┼──────────────────────────────────────────────────┤
 * │ 'propio'       │ Solo el ID del usuario actual                    │
 * │ 'hijos'        │ Usuario + hijos directos vía TOKEN_REGISTRO      │
 * │ 'hermanos'     │ Usuarios bajo el mismo padre (mismo creador)     │
 * │ 'descendientes'│ Árbol completo: hijos + nietos + sobrinas         │
 * │                │ NOTA: Rol 4 delega al scope de su admin padre    │
 * └────────────────┴──────────────────────────────────────────────────┘
 */
export type HerenciaScope = 'propio' | 'hijos' | 'hermanos' | 'descendientes';

/**
 * Tipo de entidad sobre la que se opera.
 * Determina cómo se recorre la cadena de FK para verificar/resolver.
 */
export type HerenciaEntidad = 'usuario' | 'tienda' | 'nevera';

/**
 * Modo de operación del guard:
 * - 'resolver': Calcula los IDs accesibles y los adjunta a `req.accessibleUserIds`.
 *               El controlador/servicio los usa para filtrar consultas.
 * - 'verificar': Verifica que un recurso específico (identificado por `paramKey`)
 *                está dentro del scope. Si no, lanza 403 Forbidden.
 */
export type HerenciaTipo = 'resolver' | 'verificar';

/**
 * Metadatos que el decorador @Herencia() adjunta al handler.
 * El guard lee estos metadatos vía Reflector para decidir qué hacer.
 */
export interface HerenciaMetadata {
  /** Modo: resolver scope o verificar acceso a un recurso específico */
  tipo: HerenciaTipo;

  /** Qué tan profundo en la jerarquía resolver */
  scope: HerenciaScope;

  /** Tipo de entidad objetivo (usuario, tienda, nevera) */
  entidad: HerenciaEntidad;

  /**
   * Nombre del parámetro en la URL/query que contiene el ID a verificar.
   * Solo requerido cuando `tipo === 'verificar'`.
   * Ejemplos: 'id', 'id_usuario', 'id_nevera'
   */
  paramKey?: string;
}

/**
 * Key usada por SetMetadata/Reflector para el decorador @Herencia().
 */
export const HERENCIA_KEY = 'herencia';

/**
 * Constantes de roles para legibilidad.
 */
export const ROL = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  FRIGORIFICO: 3,
  LOGISTICA: 4,
  TIENDA: 5,
} as const;

/**
 * Interfaz del usuario en el request (inyectado por JwtAuthGuard).
 */
export interface HerenciaRequestUser {
  id_usuario: number;
  roleId: number;
  email?: string;
}

/**
 * Extensión del Request de Express con los campos inyectados por HerenciaGuard.
 *
 * USO EN CONTROLADORES:
 *   @Get('endpoint')
 *   @Herencia({ tipo: 'resolver', scope: 'descendientes', entidad: 'usuario' })
 *   miMetodo(@Req() req: HerenciaRequest) {
 *     const ids = req.accessibleUserIds; // → number[]
 *     // filtrar consultas con WHERE id IN (ids)
 *   }
 */
export interface HerenciaRequest extends Request {
  user: HerenciaRequestUser;
  accessibleUserIds: number[];
}
