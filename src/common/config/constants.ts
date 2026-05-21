/**
 * Umbrales de vencimiento para ciclo de vida de empaques.
 * Modificar aqui para cambiar el comportamiento global.
 * Futuro: pueden leerse desde base de datos o variables de entorno.
 */
export const UMBRAL_PARA_CAMBIO = 75;  // ≥75% vida util → estado 5 (PARA CAMBIO)
export const UMBRAL_VENCIDO = 100;     // ≥100% vida util → vencido
