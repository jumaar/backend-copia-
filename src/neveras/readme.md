# Endpoints de Neveras

## Nuevo Endpoint: validacionDosaTres

### Descripción
Este endpoint permite validar empaques que están entrando a una nevera específica. Recibe información sobre los empaques que se están colocando en la nevera y actualiza su estado en la base de datos.

### Ruta
```
POST /api/neveras/validacionDosaTres
```

### Requisitos de Autenticación
- Token JWT válido (generado en el endpoint de activación)

### Parámetros de Entrada (Body)
```json
{
  "fridge_id": 12,
  "timestamp": 1700000000,
  "pending_packages": [
    {
      "epc": "ABC123DEF456GHI789JKL012",
      "id_empaque": null
    },
    {
      "epc": null,
      "id_empaque": 456
    },
    {
      "epc": "XYZ987ABC654DEF321GHI000",
      "id_empaque": null
    }
  ]
}
```

### Descripción de Campos
- `fridge_id`: ID de la nevera donde se colocan los empaques
- `timestamp`: Timestamp Unix indicando cuándo se colocó el empaque en la nevera
- `pending_packages`: Array de empaques a validar
  - `epc`: Código EPC del empaque (opcional si se proporciona id_empaque)
  - `id_empaque`: ID del empaque (opcional si se proporciona epc)

### Procesamiento
1. Actualiza la tabla `neveras` con la fecha de última conexión (`ultima_conexion`)
2. Para cada empaque en el array:
   - Busca el empaque por EPC o ID
   - Verifica que esté en estado 2 (en logística)
   - Actualiza el estado a 3 (en nevera)
   - Establece el campo `hora_en_nevera_3` con el timestamp recibido
   - Asigna el `fridge_id` al empaque

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Validación de empaques completada exitosamente",
  "empaques": [
    {
      "id_empaque": 123,
      "epc": "ABC123DEF456GHI789JKL012",
      "peso_exacto_g": 500,
      "id_producto": 456,
      "nombre_producto": "Producto Ejemplo",
      "peso_nominal_g": 500
    }
  ]
}
```

### Ejemplo de Respuesta Esperada por Frontend
```json
{
  "success": true,
  "message": "Validación de empaques completada exitosamente",
  "empaques": [
    {
      "id_empaque": 123,
      "epc": "ABC123DEF456GHI789JKL012",
      "peso_exacto_g": 500,
      "id_producto": 456,
      "nombre_producto": "Producto Ejemplo"
    },
    {
      "id_empaque": 456,
      "epc": "XYZ987ABC654DEF321GHI000",
      "peso_exacto_g": 300,
      "id_producto": 789,
      "nombre_producto": "Otro Producto"
    }
  ]
}
```

### Ejemplo de Respuesta de Error
```json
{
  "success": false,
  "error": "Algunos empaques no pudieron ser procesados",
  "code": "VALIDACION_EMPAQUES_FALLIDOS",
  "empaques_invalidos": [
    {
      "epc": "XYZ987ABC654DEF321GHI000",
      "id_empaque": null,
      "error": "Empaque no encontrado: XYZ987ABC654DEF321GHI000"
    }
  ]
}
```

### Ejemplo de Respuesta Exitosa con Procesamiento Parcial
```json
{
  "success": true,
  "message": "Validación de empaques completada exitosamente",
  "empaques_procesados": [
    {
      "id_empaque": 123,
      "epc": "ABC123DEF456GHI789JKL012",
      "peso_exacto_g": 500,
      "id_producto": 456,
      "nombre_producto": "Producto Ejemplo"
    }
  ],
  "empaques_no_procesados": []
}
```

### Errores Posibles
- `EMPAQUE_NO_ENCONTRADO`: El empaque no existe en la base de datos
- `EMPAQUE_NO_EN_LOGISTICA`: El empaque no está en estado de logística (estado 2)
- `CONTRASENA_INCORRECTA`: Token inválido o expirado
- `ESTADO_NO_PERMITIDO`: Usuario sin permisos suficientes

### Comportamiento ante empaques no encontrados
Cuando se envía un array con 50 empaques y 2 de ellos no se encuentran en la base de datos, el sistema procesará los 48 empaques válidos y devolverá información sobre los 2 que no se pudieron procesar. Esto permite al frontend conocer exactamente qué empaques tuvieron problemas sin perder los datos válidos.