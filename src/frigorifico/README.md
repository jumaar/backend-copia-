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

### Información del Usuario Actual

Se incluye información completa del usuario autenticado:

```typescript
// Consulta para obtener datos del usuario
const usuarioActual = await this.databaseService.uSUARIOS.findUnique({
  where: { id_usuario: idUsuario },
  include: {
    rol: {
      select: {
        nombre_rol: true,
      },
    },
  },
});
```

**Campos incluidos:**
- `id`: ID único del usuario
- `nombre_completo`: Concatenación de nombre y apellido
- `celular`: Número de teléfono
- `rol`: Nombre del rol (ej: "Admin", "Usuario", etc.)
- `activo`: Estado de activación de la cuenta

### Estructura de Respuesta Completa

```json
{
  "usuario_actual": {
    "id": 3,
    "nombre_completo": "admin arcila",
    "celular": "2222222222",
    "rol": "Admin",
    "activo": true
  },
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

## API Endpoints - Documentación Completa

### Autenticación y Autorización
Todos los endpoints requieren autenticación JWT. Los roles se verifican automáticamente.

### 1. GET /api/frigorifico
**Descripción**: Dashboard principal del frigorífico con estadísticas generales
**Roles permitidos**: 1, 2, 3
**Parámetros**: Ninguno (usa usuario autenticado)

**Respuesta (200)**:
```json
{
  "usuario_actual": {
    "id": 3,
    "nombre_completo": "admin arcila",
    "celular": "2222222222",
    "rol": "Admin",
    "activo": true
  },
  "frigorificos": [
    {
      "id_frigorifico": 1,
      "nombre_frigorifico": "Frigorífico Central",
      "direccion": "Calle 123 #45-67",
      "ciudad": {
        "id_ciudad": 1,
        "nombre_ciudad": "Bogotá",
        "departamento": {
          "id__departamento": 1,
          "nombre_departamento": "Cundinamarca"
        }
      },
      "estaciones": [
        {
          "id_estacion": "1008",
          "clave_vinculacion": "1008001FrigorificoCentral"
        }
      ]
    }
  ],
  "ciudades_disponibles": [
    {
      "id_ciudad": 1,
      "nombre_ciudad": "Bogotá"
    }
  ],
  "lotes_en_stock": {
    "cantidad": 150,
    "peso_total_g": 75000
  },
  "lotes_despachados": {
    "cantidad": 25,
    "peso_total_g": 12500
  },
  "total_transacciones": 125000.50,
  "inventario_por_producto": [
    {
      "id_producto": 1,
      "nombre_producto": "Pollo Entero",
      "cantidad": 45,
      "ultima_fecha": "2025-11-08T12:25:55.000Z",
      "epc_id_ultimo": "E28011608000021C84A1988E"
    }
  ]
}
```

### 2. POST /api/frigorifico
**Descripción**: Crear un nuevo frigorífico
**Roles permitidos**: 3
**Body**:
```json
{
  "nombre_frigorifico": "Frigorífico Nuevo",
  "direccion": "Dirección del frigorífico",
  "id_ciudad": 1
}
```

**Respuesta (201)**:
```json
{
  "id_frigorifico": 2,
  "id_usuario": 3,
  "nombre_frigorifico": "Frigorífico Nuevo",
  "direccion": "Dirección del frigorífico",
  "id_ciudad": 1
}
```

### 3. PATCH /api/frigorifico
**Descripción**: Actualizar datos del frigorífico
**Roles permitidos**: 3
**Body**:
```json
{
  "id_frigorifico": 1,
  "nombre_frigorifico": "Frigorífico Actualizado",
  "direccion": "Nueva dirección"
}
```

**Respuesta (200)**: Similar al POST

### 4. DELETE /api/frigorifico
**Descripción**: Eliminar un frigorífico
**Roles permitidos**: 3
**Body**:
```json
{
  "id_frigorifico": 1
}
```

**Respuesta (200)**:
```json
{
  "id_frigorifico": 1,
  "nombre_frigorifico": "Frigorífico Eliminado"
}
```

### 5. POST /api/frigorifico/productos
**Descripción**: Crear un nuevo producto
**Roles permitidos**: 1, 2
**Body**:
```json
{
  "nombre_producto": "Nuevo Producto",
  "descripcion_producto": "Descripción del producto",
  "peso_nominal_g": 1000,
  "precio_venta": "50000.00",
  "dias_vencimiento": 30,
  "precio_frigorifico": "10.00"
}
```

**Respuesta (201)**: Objeto del producto creado

### 6. GET /api/frigorifico/productos
**Descripción**: Obtener todos los productos
**Roles permitidos**: 1, 2, 3, 4

**Respuesta (200)**:
```json
[
  {
    "id_producto": 1,
    "nombre_producto": "Pollo Entero",
    "descripcion_producto": "Pollo entero fresco",
    "peso_nominal_g": 1500,
    "precio_venta": "45000.00",
    "dias_vencimiento": 7,
    "precio_frigorifico": "15.00"
  }
]
```

### 7. PATCH /api/frigorifico/productos/:id
**Descripción**: Actualizar un producto
**Roles permitidos**: 1, 2
**Parámetros**: id (ID del producto)

**Respuesta (200)**: Producto actualizado

### 8. DELETE /api/frigorifico/productos/:id
**Descripción**: Eliminar un producto
**Roles permitidos**: 1, 2
**Parámetros**: id (ID del producto)

**Respuesta (200)**: Producto eliminado

### 9. POST /api/frigorifico/estacion/:frigorificoId
**Descripción**: Crear una nueva estación para un frigorífico
**Roles permitidos**: 3
**Parámetros**: frigorificoId (ID del frigorífico)

**Respuesta (201)**:
```json
{
  "id_estacion": "1008",
  "clave_vinculacion": "1008001FrigorificoCentral",
  "activa": false
}
```

### 10. DELETE /api/frigorifico/estacion/:estacionId
**Descripción**: Eliminar una estación
**Roles permitidos**: 3
**Parámetros**: estacionId (ID de la estación)

**Respuesta (200)**: Estación eliminada

### 11. GET /api/frigorifico/estacion/:estacionId
**Descripción**: Obtener historial de empaques de una estación (solo para estaciones autenticadas)
**Roles permitidos**: Ninguno (solo tokens de tipo 'estacion')
**Parámetros**: estacionId (ID de la estación)

**Respuesta (200)**:
```json
{
  "productos": [
    {
      "id_producto": 1,
      "nombre_producto": "Pollo Entero",
      "peso_nominal_g": 1500,
      "cantidad_total": 10,
      "empaques": [
        {
          "epc": "E28011608000021C84A1988E",
          "peso_g": "1450.50",
          "precio_venta_total": 45000,
          "fecha_empaque": "2025-11-08T12:25:55.000Z"
        }
      ]
    }
  ]
}
```

### 12. DELETE /api/frigorifico/estacion/:estacionId/empaque/:epc
**Descripción**: Eliminar un empaque específico por EPC
**Roles permitidos**:estaciones o usuarios rol 3
**Parámetros**:
- estacionId (ID de la estación)
- epc (Código EPC del empaque)

**Respuesta (200)**:
```json
{
  "deleted": true,
  "epc": "E28011608000021C84A1988E"
}
```

### 13. GET /api/frigorifico/gestion
**Descripción**: Vista de gestión completa organizada por estaciones (solo productos en stock estado 1)
**Roles permitidos**: 3

**Respuesta (200)**:
```json
{
  "usuario_actual": {
    "id": 3,
    "nombre_completo": "admin arcila",
    "celular": "2222222222",
    "rol": "Frigorifico",
    "activo": true
  },
  "frigorificos": [
    {
      "id_frigorifico": 1,
      "nombre_frigorifico": "Frigorífico Central",
      "direccion": "Calle 123 #45-67",
      "ciudad": {
        "id_ciudad": 1,
        "nombre_ciudad": "Bogotá",
        "departamento": {
          "id__departamento": 1,
          "nombre_departamento": "Cundinamarca"
        }
      },
      "lotes_en_stock": {
        "cantidad": 150,
        "peso_total_g": 75000
      },
      "lotes_despachados": {
        "cantidad": 25,
        "peso_total_g": 12500
      },
      "total_transacciones": 5000000,
      "estaciones": [
        {
          "id_estacion": "1008",
          "clave_vinculacion": "1008001FrigorificoCentral",
          "activa": true,
          "total_empaques": 45,
          "peso_total_g": 22500,
          "productos": [
            {
              "id_producto": 1,
              "nombre_producto": "Pollo Entero",
              "peso_nominal_g": 1500,
              "cantidad_total": 15,
              "peso_total_g": 22500,
              "empaques": [
                {
                  "epc": "E28011608000021C84A1988E",
                  "peso_g": "1450.50",
                  "precio_venta_total": 45000,
                  "fecha_empaque": "2025-11-08T12:25:55.000Z"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "ciudades_disponibles": [
    {
      "id_ciudad": 1,
      "nombre_ciudad": "Bogotá"
    }
  ]
}
```

## Estados de Empaque
- **1**: En stock (en frigorífico)
- **2**: Despachado/logistica

## Códigos de Error Comunes
- `FRIGORIFICO_NOT_FOUND`: Frigorífico no encontrado
- `EMPAQUE_NOT_FOUND`: Empaque no encontrado
- `ESTACION_NO_AUTORIZADA`: Estación no pertenece al usuario
- `CLAVE_INVALIDA`: Clave de vinculación inválida