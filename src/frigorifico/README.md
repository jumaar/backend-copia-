# Módulo Frigorífico

## Sistema de IDs Compuestos para Estaciones

### ¿Qué es un ID Compuesto?

Los IDs de las estaciones están compuestos por tres partes separadas por el delimitador `00`:

```
{NÚMERO_ESTACIÓN}00{ID_USUARIO}
```

### Ejemplos de IDs Compuestos

- `1004` → Estación número 1, Usuario ID 4
- `200034766` → Estación número 20, Usuario ID 34766
- `500123456789` → Estación número 5, Usuario ID 123456789

### ¿Cómo se Generan los IDs?

1. **Búsqueda del Número Más Alto**: El sistema busca todas las estaciones existentes y encuentra el número de estación más alto.

2. **Incremento**: Suma 1 al número más alto encontrado.

3. **Composición**: Crea el ID compuesto con el formato `{nuevo_numero}00{id_usuario}`.

### Lógica de Parsing

Para extraer información de un ID compuesto:

```typescript
const idCompuesto = "200034766";
const indexSeparador = idCompuesto.lastIndexOf('00'); // Busca desde la derecha
const numeroEstacion = parseInt(idCompuesto.substring(0, indexSeparador)); // 20
const idUsuario = parseInt(idCompuesto.substring(indexSeparador + 2)); // 34766
```

### Claves de Vinculación

Las claves de vinculación son más complejas e incluyen información adicional para la jerarquía completa:

```
{NÚMERO_ESTACIÓN}00{ID_FRIGORÍFICO}00{ID_USUARIO}{TOKEN_ALEATORIO}
```

**Ejemplo**: `100030043DfE233uXZr`
- `10` = Número de estación
- `00` = Separador
- `3` = ID del frigorífico
- `00` = Separador
- `43` = ID del usuario
- `DfE233uXZr` = Token aleatorio de 10 caracteres (siempre comienza con letra)

### Beneficios del Sistema

1. **Optimización de Consultas**: No necesitas JOINs para obtener el usuario propietario
2. **Escalabilidad**: Maneja IDs de cualquier longitud
3. **Jerarquía Clara**: Toda la información de propiedad está embebida
4. **Transacciones Masivas**: Procesamiento eficiente sin consultas adicionales

### Uso en Transacciones

Cuando una estación envía su ID compuesto, el sistema puede:
- Extraer el ID de usuario directamente
- Crear transacciones masivas sin consultar la base de datos
- Mantener integridad referencial completa

### Consideraciones de Seguridad

- Los tokens aleatorios en las claves de vinculación previenen colisiones
- Los IDs compuestos son únicos por definición
- La información de jerarquía está protegida por la unicidad de las claves

## Dashboard de Frigoríficos

### Endpoint: `GET /api/frigorifico`

Devuelve un dashboard completo con estadísticas y datos del usuario autenticado.

### Estadísticas Principales (3 Cards)

#### 1. Empaques en Stock
```typescript
// Consulta optimizada usando IDs compuestos
const lotesEnStock = await this.databaseService.eMPAQUES.aggregate({
  where: {
    estacion: {
      frigorifico: {
        id_frigorifico: { in: frigorificoIds }, // IDs de frigoríficos del usuario
      },
    },
    id_estado_empaque: 1, // Estado "EN STOCK"
  },
  _count: { id_empaque: true },
  _sum: { peso_exacto_g: true },
});
```

**Resultado:**
- `cantidad`: Número total de empaques en stock
- `peso_total_g`: Peso total en gramos

#### 2. Empaques Despachados Hoy
```typescript
// Filtra por fecha del día actual
const hoy = new Date();
hoy.setHours(0, 0, 0, 0);
const manana = new Date(hoy);
manana.setDate(hoy.getDate() + 1);

const lotesDespachados = await this.databaseService.eMPAQUES.aggregate({
  where: {
    estacion: {
      frigorifico: {
        id_frigorifico: { in: frigorificoIds },
      },
    },
    id_estado_empaque: 2, // Estado "DESPACHADO"
    fecha_empaque_1: {
      gte: hoy,      // Desde medianoche
      lt: manana,    // Hasta medianoche siguiente
    },
  },
  _count: { id_empaque: true },
  _sum: { peso_exacto_g: true },
});
```

**Resultado:**
- `cantidad`: Empaques despachados hoy
- `peso_total_g`: Peso total despachado hoy

#### 3. Saldo Total ($)
```typescript
// Suma de todas las transacciones del usuario
const totalTransacciones = await this.databaseService.tRANSACCIONES.aggregate({
  where: { id_usuario: idUsuario },
  _sum: { monto: true },
});
```

**Resultado:**
- `total_transacciones`: Suma total de todos los montos en transacciones

### Tabla: Últimos Lotes Creados en Stock

Muestra el inventario agrupado por producto con información detallada:

```typescript
// Agrupación por producto con estadísticas
const inventarioPorProducto = await this.databaseService.eMPAQUES.groupBy({
  by: ['id_producto'],
  where: {
    estacion: {
      frigorifico: {
        id_frigorifico: { in: frigorificoIds },
      },
    },
    id_estado_empaque: 1, // Solo productos en stock
  },
  _count: { id_empaque: true },
  _max: { fecha_empaque_1: true },
});

// Enriquecimiento con datos del producto y último EPC
const inventarioDetallado = await Promise.all(
  inventarioPorProducto.map(async (item) => {
    const producto = await this.databaseService.pRODUCTOS.findUnique({
      where: { id_producto: item.id_producto },
      select: { nombre_producto: true, peso_nominal_g: true },
    });

    // Último empaque por fecha para obtener EPC
    const ultimoEmpaque = item._max?.fecha_empaque_1 ? await this.databaseService.eMPAQUES.findFirst({
      where: { /* filtros para encontrar el último */ },
      select: { EPC_id: true },
    }) : null;

    return {
      id_producto: item.id_producto,
      nombre_producto: producto?.nombre_producto || '',
      peso_nominal_g: producto?.peso_nominal_g || 0,
      cantidad: item._count.id_empaque,
      ultima_fecha: item._max.fecha_empaque_1,
      epc_id_ultimo: ultimoEmpaque?.EPC_id || '',
    };
  })
);
```

**Columnas de la tabla:**
- **Producto**: Nombre del producto
- **Peso Nominal**: Peso estándar en gramos
- **Cantidad**: Número total de empaques en stock
- **Última Fecha**: Fecha del último empaque creado
- **EPC Último**: Código EPC del último empaque

### Optimizaciones Implementadas

1. **IDs Compuestos**: Eliminan consultas JOIN innecesarias
2. **Filtros Eficientes**: Usan índices de base de datos
3. **Agregaciones Optimizadas**: Una sola consulta por estadística
4. **Paginación Implícita**: Limitada a productos relevantes
5. **Caché de Resultados**: Los datos se calculan una vez por request

### Estructura de Respuesta

```json
{
  "frigorificos": [...],
  "ciudades_disponibles": [...],
  "lotes_en_stock": {
    "cantidad": 150,
    "peso_total_g": 75000
  },
  "lotes_despachados": {
    "cantidad": 25,
    "peso_total_g": 12500
  },
  "total_transacciones": 125000.50,
  "inventario_por_producto": [...]
}
```