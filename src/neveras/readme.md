# Endpoint GET /api/neveras/surtir

**Descripción**: Endpoint principal para el proceso de surtido automático de neveras. Optimiza la distribución de productos en neveras activas de ciudades especificadas basándose en demanda histórica y disponibilidad logística.

**Parámetros**:
- `id_ciudad` (query, string): IDs de ciudades separados por coma (ej: "1,2,3")
- Requiere autenticación JWT con rol 4 (Supervisor)

**Respuesta Éxito**:
```json
{
  "success": true,
  "message": "Surtido procesado exitosamente",
  "hora_calificacion": "2025-11-27T23:00:00.000Z",
  "resumen": {
    "ciudades_procesadas": [1,2,3],
    "neveras_procesadas": 15,
    "productos_procesados": 8
  }
}
```

## Proceso por Fases

### FASE 1: Recolección de Datos
1. **Parsing de Ciudades**: Convierte string a array de integers válidos
2. **Neveras Activas**: Consulta neveras con `id_estado_nevera = 2` en ciudades especificadas
3. **Stock Existente**: Obtiene registros `STOCK_NEVERA` activos para las neveras
4. **Productos en Logística**: Busca productos del usuario en tabla `EMPAQUES` con `id_estado_empaque = 2`

### FASE 2: Verificación y Creación de Registros
Para cada producto en logística:
- Si no existe registro `STOCK_NEVERA` activo para nevera+producto → Crear con calificación 'MEDIA' y valores iniciales cero

### FASE 3: Calificación de Neveras Resurtido
**Clasificación**: Neveras con `venta_semanal > 0` o `stock_en_tiempo_real > 0`

**Cálculo de Calificaciones**:

**Fórmulas de Corte**:
- `ventaMaxima = max(venta_semanal)` de neveras resurtido
- `MEDIA_corte = ventaMaxima / 2`
- `BAJA_corte = MEDIA_corte * 0.5 = ventaMaxima / 4`
- `ALTA_corte = MEDIA_corte * 1.5 = ventaMaxima * 0.75`

**Asignación de Calificación**:
- `BAJA`: `venta_semanal < BAJA_corte`
- `MEDIA`: `BAJA_corte ≤ venta_semanal < ALTA_corte`
- `ALTA`: `venta_semanal ≥ ALTA_corte`

**Ejemplos Prácticos**:

*Ejemplo 1*: Neveras con ventas semanales: [10, 20, 30, 40]
- `ventaMaxima = 40`
- `MEDIA_corte = 20`
- `BAJA_corte = 10`
- `ALTA_corte = 30`
- Resultado: Nevera 10 → BAJA, Nevera 20 → MEDIA, Neveras 30 y 40 → ALTA

*Ejemplo 2*: Neveras con ventas semanales: [5, 15, 25]
- `ventaMaxima = 25`
- `MEDIA_corte = 12.5`
- `BAJA_corte = 6.25`
- `ALTA_corte = 18.75`
- Resultado: Nevera 5 → BAJA, Nevera 15 → MEDIA, Nevera 25 → ALTA

*Ejemplo 3*: Neveras con ventas semanales: [8, 8, 8]
- `ventaMaxima = 8`
- `MEDIA_corte = 4`
- `BAJA_corte = 2`
- `ALTA_corte = 6`
- Resultado: Todas las neveras → ALTA (todas ≥ 6)

**Actualizaciones**:
- Actualiza `calificacion_surtido` (string: 'BAJA', 'MEDIA', 'ALTA') y `hora_calificacion` en cada registro `STOCK_NEVERA`
- Actualiza `media`, `baja`, `alta` (valores numéricos de cortes) en tabla `PRODUCTOS`

### FASE 4: Neveras Nuevas
Neveras con `stock_en_tiempo_real = 0` y `venta_semanal = 0` mantienen calificación 'MEDIA' (asignada en Fase 2)

### FASE 5: Distribución de Productos
**Cálculos Iniciales**:
- `stockRealTotal = sum(stock_en_tiempo_real)` de todas las neveras para el producto
- `totalDisponible = cantidadLogistica + stockRealTotal`
- `N_alta = count(calificacion_surtido = 'ALTA')`
- `N_media = count(calificacion_surtido = 'MEDIA')`
- `N_baja = count(calificacion_surtido = 'BAJA')`
- `pesoTotal = (2 * N_alta) + (1 * N_media) + (0.5 * N_baja)`

**Asignación Base**:
- `MEDIA_asig = floor(totalDisponible / pesoTotal)`
- `BAJA_asig = floor(MEDIA_asig * 0.5)`
- `ALTA_asig = floor(MEDIA_asig * 2)`

**Distribución**:
- `totalAsignado = (ALTA_asig * N_alta) + (MEDIA_asig * N_media) + (BAJA_asig * N_baja)`
- `sobrante = totalDisponible - totalAsignado`

**Reparto de Sobrante**:
- Distribuye sobrante equitativamente a neveras MEDIA (ordenadas por stock actual ascendente)
- Cada nevera MEDIA recibe +1 hasta agotar sobrante

**Actualización Final**:
Para cada nevera:
- `asignacion = ALTA_asig | MEDIA_asig + extra | BAJA_asig`
- `stock_minimo = floor(asignacion * 0.25)`
- Actualiza `stock_ideal_final`, `stock_maximo`, `stock_minimo` en `STOCK_NEVERA`

## Validaciones
- `id_ciudad` requerido y no vacío
- Al menos un `id_ciudad` válido
- Usuario debe tener logística asociada
- Debe haber productos en logística
- Debe haber neveras activas en ciudades especificadas

## Errores Comunes
- `MISSING_CIUDAD_PARAM`: Parámetro id_ciudad faltante
- `INVALID_CIUDAD_IDS`: No hay IDs de ciudad válidos
- `NO_NEVERAS_DISPONIBLES`: No hay neveras activas en ciudades
- `NO_LOGISTICA`: Usuario sin logística asociada
- `NO_PRODUCTOS_LOGISTICA`: No hay productos en logística