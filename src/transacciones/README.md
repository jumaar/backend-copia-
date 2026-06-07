# Módulo Transacciones — Guía Definitiva

## 1. Estructura de la Tabla `TRANSACCIONES`

| Campo | Tipo | Descripción |
|---|---|---|
| `id_transaccion` | Int (PK, autoincrement) | Identificador único |
| `id_empaque` | Int? (FK → EMPAQUES) | Empaque asociado (ventas) |
| `id_usuario` | Int (FK → USUARIOS) | Usuario afectado |
| `id_transaccion_rel` | Int? (self-ref FK) | Vincula transacciones entre sí (ticket ↔ pago, pagador ↔ receptor) |
| `id_nevera` | Int? (FK → NEVERAS) | Nevera asociada |
| `monto` | Decimal | **Positivo = recibe/debe**, **Negativo = entrega/crédito a favor empresa** |
| `hora_transaccion` | DateTime | Timestamp |
| `id_tipo_transaccion` | Int (FK → TIPO_TRANSACCION) | Categoría de la transacción |
| `nota_opcional` | String? | Descripción libre |
| `estado_transaccion` | Int (FK → ESTADO_TRANSACCION) | Ciclo de vida |

### Tipos de Transacción

| id | Constante | Significado |
|---|---|---|
| 1 | `TIPO_VENTA` | Venta de empaque en tienda |
| 2 | `TIPO_COSTO_FRIGORIFICO` | Costo frigorífico / Saldo exclusivo consolidación frigorífico |
| 3 | `TIPO_TICKET_CONSOLIDADO` | Ticket de consolidación (resumen contable) |
| 4 | `TIPO_DINERO_RECIBIDO` | Dinero recibido (quien cobra) |
| 5 | `TIPO_DINERO_ENTREGADO` | Dinero entregado (quien paga) |

### Estados de Transacción

| id | Constante | Significado |
|---|---|---|
| 1 | `ESTADO_PENDIENTE` | Pendiente de liquidación |
| 2 | `ESTADO_PAGADO` | Liquidado / cerrado |
| 4 | `ESTADO_CONSOLIDADO` | Ticket consolidado (cierre contable) |

---

## 2. Principio Contable: La Ley del Cero

> **Para cualquier usuario, la suma de TODAS sus transacciones en estado 2 (PAGADO) debe ser exactamente 0.**

El **ticket de consolidación** (tipo 3, estado 4, monto negativo) es el mecanismo que garantiza esta invariante. Cada vez que se liquidan transacciones pendientes de un usuario, se crea un ticket con valor `-Σ(pendientes)` para ese mismo usuario:

```
Σ(tx individuales estado 2) + ticket(negativo, estado 4) = 0
```

### Convención de Signos

| Signo | Significado |
|---|---|
| **Positivo (+)** | El usuario recibe dinero O la empresa le debe |
| **Negativo (-)** | El usuario entrega dinero O tiene crédito a favor de la empresa |

---

## 3. Puerta de Entrada Única

`TransaccionesService` (`src/transacciones/transacciones.service.ts`) es el **único servicio autorizado** para crear o modificar registros en la tabla. Es un módulo `@Global()`, sin controller propio.

Toda escritura directa a `prisma.tRANSACCIONES` desde otros módulos ha sido centralizada en los siguientes métodos del servicio:

### Métodos de escritura

| Método | Operación |
|---|---|
| `crearTransaccion()` | Crea una transacción individual |
| `crearTransaccionEnTx(tx, params)` | Crea dentro de una transacción Prisma existente |
| `consolidar()` | Motor de consolidación (ver §5) |
| `transferenciaDirecta()` | Transferencia directa entre dos usuarios |
| `actualizarNota(id, nota)` | Actualiza `nota_opcional` de una transacción |
| `vincularRelEnTx(tx, id, idRel)` | Actualiza `id_transaccion_rel` dentro de una tx |
| `marcarPagadasEnTx(tx, ids, idTicket)` | Marca transacciones como estado 2 y las vincula a un ticket |

### Métodos de lectura

| Método | Operación |
|---|---|
| `getPendientes()` | Consulta transacciones en estado 1 |
| `getPendientesVinculadas()` | Transacciones vinculadas entre dos usuarios |
| `countPendientes()` | Conteo de pendientes por usuario/nevera |

---

## 4. Endpoints POST que Generan Transacciones

| # | Endpoint | Rol | Método | Operación |
|---|---|---|---|---|
| 1 | `POST /api/frigorifico/empaques/cambiar-estado` | 4 | `cambiarEstadoEmpaques()` | Despacho → tipo 2, estado 1 para **frigorífico** |
| 2 | `POST /api/logistica/cuentas` | 2, 4 | `consolidarCuentas()` | Adelanto o consolidación de frigorífico |
| 3 | `POST /api/logistica/consolidar-admin` | 2, 4 | `consolidarAdmin()` | Ingreso admin→logística o consolidación logística→admin |
| 4 | `POST /api/logistica/cuentas/nevera/:id_nevera` | 2, 4 | `liquidarNevera()` | Liquidación de nevera (tienda→logística) |

**No existen PUT, PATCH, DELETE que modifiquen `TRANSACCIONES`.**

---

## 5. Los 3 Tipos de Interacción

### 🔵 CASO 1: Admin ↔ Logística

#### 1A. Admin entrega dinero a Logística (ingreso)

**Endpoint:** `POST /api/logistica/consolidar-admin` (`tipo_movimiento: "ingreso"`)
**Ejecutor:** Admin (rol 2)
**Método:** `transferenciaDirecta()`

```
Transferencia directa Admin → Logística:

  Admin (pagador):       tipo=5 (entregado),  monto=-X, estado=1
                         id_transaccion_rel ↔ logística

  Logística (receptor):  tipo=4 (recibido),   monto=+X, estado=1
                         id_transaccion_rel ↔ admin
```

#### 1B. Logística consolida con Admin (cuadre de caja)

**Endpoint:** `POST /api/logistica/consolidar-admin` (`tipo_movimiento: "consolidacion"`)
**Ejecutor:** Logística (rol 4)
**Método:** `consolidar()` con `mutualLink: true`

**⚠️ REGLA CRÍTICA:** Solo se consolidan las transacciones pendientes del **usuario logística**. Las transacciones del admin NO se tocan (permanecen en estado 1 hasta que exista un consolidado de admin — ver §7.1).

**Acepta monto = 0** como caso válido (cuando el logístico ya cuadró exactamente lo que recibió y entregó).

```
FLUJO DE CONSOLIDACIÓN LOGÍSTICA → ADMIN:

1. Se obtienen SOLO las transacciones pendientes (estado 1) del logística
   con id_transaccion_rel (tipos 4 y 5).

2. TICKET CONSOLIDADO:
   Usuario: logística
   Tipo: 3 (ticket_consolidado)
   Monto: -Σ(pendientes logística)   ← negativo para cumplir suma 0
   Estado: 4 (consolidado)

   → El ticket FUNCIONA COMO LA TRANSACCIÓN DE PAGO del logístico.
     No se crea una tx separada de pago (tipo 5) para el logístico.
     El ticket negativo ES el pago desde la perspectiva contable.

3. ADMIN (receptor del dinero):
   Usuario: admin
   Tipo: 4 (dinero_recibido)
   Monto: +montoPagado
   Estado: 1 (pendiente)
   id_transaccion_rel ↔ ticket

4. Pendientes del logística → estado=2 (pagado), vinculadas al ticket.

5. SOLO si montoPagado ≠ Σ(pendientes logística):
   → SALDO al usuario logística:
     Tipo: 4 o 5 (según dirección)
     • Saldo positivo → logística aún debe (tipo 4)
     • Saldo negativo → empresa le debe a logística (tipo 5)
     Estado: 1
     id_transaccion_rel ↔ ticket
```

```
VERIFICACIÓN CONTABLE (usuario logística):
  Σ(pendientes consolidadas) + ticket(-Σ) = 0 ✓
```

---

### 🟢 CASO 2: Logística ↔ Frigorífico

#### 2A. Despacho de empaques (crea deuda del frigorífico)

**Endpoint:** `POST /api/frigorifico/empaques/cambiar-estado`
**Ejecutor:** Logística (rol 4)
**Qué hace:** Cambia empaques estado 1 → 2 (stock → despachado).

```
Para cada empaque despachado:
  Usuario: FRIGORÍFICO (extraído del id_estacion)
  Tipo: 2 (costo_frigorifico)
  Monto: +costo_frigorifico del empaque
  Estado: 1 (pendiente)
  id_empaque: empaque.id_empaque
```

#### 2B. Logística/Admin paga al Frigorífico

**Endpoint:** `POST /api/logistica/cuentas`
**Ejecutor:** Admin (rol 2) o Logística (rol 4)
**Método:** `consolidarCuentas()` → `consolidar()`

**Subcaso A — Sin pendientes (adelanto):**
```
Frigorífico:  tipo=2, monto=-X, estado=1   (adelanto pendiente)
Pagador:      tipo=5, monto=-X, estado=1, id_rel ↔ frigorífico
```

**Subcaso B — Con pendientes (consolidación):**
```
TICKET:    usuario=frigorífico, tipo=3, monto=-Σpendientes, estado=4
RECEPTOR:  usuario=pagador,     tipo=4, monto=+montoPagado, estado=1
Pendientes → estado=2, vinculadas al ticket

SALDO (solo si montoPagado ≠ Σpendientes):
  usuario=frigorífico, tipo=2 (costo_frigorifico), monto=diferencia, estado=1
  • Positivo = frigorífico aún debe
  • Negativo = frigorífico tiene adelanto a favor
```

> **NOTA:** El tipo 2 como saldo **solo aplica en la consolidación frigorífico**.
> En los demás casos (admin, tienda) los saldos son tipo 4 o 5 según la dirección del dinero.

#### 2C. Admin ↔ Frigorífico

Idéntica mecánica que 2B. El mismo endpoint `POST /api/logistica/cuentas` invocado por Admin (rol 2). El `id_usuario_credenciales` (pagador) es el admin en vez del logístico.

---

### 🟡 CASO 3: Tienda ↔ Logística

**Endpoint:** `POST /api/logistica/cuentas/nevera/:id_nevera`
**Ejecutor:** Logística (rol 4) — quien cobra a la tienda
**Método:** `liquidarNevera()`

#### Caso A: Liquidación CON empaques (estado 4 → 8)

```
PASO 1: Cálculo por empaque
───────────────────────────
Para cada empaque en estado 4 (pendiente de pago) de la nevera:

  precioVenta         = empaque.precio_venta_total
  valorPromocion      = empaque.promocion?.valor || 0
  descuento           = Math.ceil(precioVenta × valorPromocion / 100)
  precioConDescuento  = precioVenta - descuento
  tiendaComision      = Math.ceil(precioConDescuento × precioTienda% / 100)
  liquidar            = precioConDescuento - tiendaComision

  totalLiquidar += liquidar
```

> Las promociones se aplican sobre `precio_venta_total` del empaque **antes** de calcular
> la comisión de la tienda. La promoción proviene de `EMPAQUES.promocion_id` (FK a `PROMOCIONES`).

```
PASO 2: Incorporar transacciones pendientes previas de la tienda
────────────────────────────────────────────────────────────────
Se buscan TODAS las transacciones en estado 1 (pendiente)
de la tienda para esa nevera (sin filtrar por tipo).
Su monto se SUMA al totalLiquidar.

Esto garantiza:
"Antes de consolidar se deben considerar TODAS las
transacciones en estado 1 del usuario a consolidar."
```

```
PASO 3: Ejecución atómica (_ejecutarLiquidacion)
──────────────────────────────────────────────────

3a. TRANSACCIONES DE VENTA INDIVIDUALES (por cada empaque):
    Usuario: tienda
    Tipo: 1 (venta)
    Monto: +liquidar (calculado en paso 1)
    Estado: 2 (pagado)
    id_empaque: empaque
    id_rel: ticket
    id_nevera: nevera

3b. TICKET CONSOLIDADO (basado en ventas + pendientes previos):
    Usuario: tienda
    Tipo: 3 (ticket_consolidado)
    Monto: -totalLiquidar
    Estado: 4 (consolidado)
    id_nevera: nevera

3c. PENDIENTES PREVIAS → estado=2 (pagado), vinculadas al ticket

3d. LOGÍSTICA (receptor del dinero):
    Usuario: logística
    Tipo: 4 (dinero_recibido)
    Monto: +montoPagado
    Estado: 1 (pendiente)
    id_rel: ticket
    id_nevera: nevera

3e. EMPAQUES → estado=8 (finalizado), se registra costo_tienda

3f. SALDO (solo si montoPagado ≠ totalLiquidar):
    Usuario: tienda
    Tipo: 4 o 5 (según dirección del flujo)
    Monto: diferencia
    Estado: 1 (pendiente)
    id_rel: ticket
    id_nevera: nevera

    • Sobre el consolidado: tienda tiene adelanto
    • Bajo el consolidado: tienda aún debe
    → Visible en la próxima consolidación (paso 2)
```

```
VERIFICACIÓN CONTABLE (usuario tienda):
  Σ(tx venta estado 2) + Σ(pendientes previas → estado 2) + ticket(-totalLiquidar) = 0 ✓
```

#### Caso B: Liquidación SIN empaques (solo pendientes)

Cuando la tienda no tiene empaques en estado 4 pero realiza un abono.

```
1. Se buscan transacciones pendientes (estado 1) de la tienda
   para la nevera (sin filtrar por tipo).

2. SI HAY PENDIENTES → consolidación estándar con consolidar():
   TICKET:      usuario=tienda, tipo=3, monto=-Σpendientes, estado=4
   RECEPTOR:    usuario=logística, tipo=4, monto=+montoPagado, estado=1
   SALDO:       usuario=tienda, tipo=4/5, monto=diferencia, estado=1
   Pendientes → estado=2, vinculadas al ticket

3. SI NO HAY PENDIENTES → transferenciaDirecta():
   Tienda (pagador):     tipo=5, monto=-X, estado=1
   Logística (receptor): tipo=4, monto=+X, estado=1, id_rel ↔ tienda
```

---

## 6. Reglas de Negocio

| # | Regla |
|---|---|
| 1 | Toda transacción tiene `id_usuario` obligatorio |
| 2 | En estado 2 (pagado), Σ(montos del usuario) = 0 |
| 3 | El ticket consolidado (tipo 3) siempre es **negativo** y en estado 4 |
| 4 | `id_transaccion_rel` vincula transacciones formando grupos contables |
| 5 | Los empaques en estado 4 se liquidan y pasan a estado 8 (finalizado) |
| 6 | Antes de consolidar, se consideran TODAS las transacciones en estado 1 del usuario a consolidar |
| 7 | Si el pago difiere de lo consolidado, se genera un saldo en estado 1 |
| 8 | Saldo positivo = usuario debe; saldo negativo = usuario tiene a favor |
| 9 | El tipo 2 como saldo **solo aplica en consolidación frigorífico**. Para admin/tienda se usa tipo 4 o 5 |
| 10 | Las promociones se toman de `EMPAQUES.promocion_id` (FK a `PROMOCIONES`) y se aplican sobre `precio_venta_total` antes de calcular comisiones |
| 11 | El endpoint de consolidación logística→admin **debe aceptar monto = 0** |
| 12 | En la consolidación logística→admin, el ticket (tipo 3 negativo) **hace las veces de la transacción de pago** del logístico — no se crea un tipo 5 separado |
| 13 | En caso B de liquidación de nevera (sin empaques ni pendientes), se usa `transferenciaDirecta()` en vez de crear transacciones sueltas |

---

## 7. Pendientes y Mejoras

### 7.1 Consolidación del Admin (PENDIENTE)

Cuando el admin entrega dinero a logística (`transferenciaDirecta`), se crean transacciones en estado 1 para el admin. Actualmente NO existe un endpoint que cierre/consolide las cuentas del admin.

**Problema:** El admin acumula transacciones tipo 4 (recibido) y tipo 5 (entregado) en estado 1 que nunca se liquidan.

**Solución requerida:** Crear un endpoint `POST /api/logistica/consolidar-admin-cierre` que:
- Consolide SOLO las transacciones pendientes del admin
- Genere ticket consolidado (tipo 3, negativo) para el admin
- Marque pendientes como estado 2
- Cree saldo si hay diferencia (tipo 4 o 5, estado 1)

### 7.2 Desincronización Entity ↔ Prisma Schema

La entity `Transaccion` (`entities/transaccion.entity.ts`) tiene un campo `promocion_id` que **no existe en el modelo Prisma** de `TRANSACCIONES`. Esto es correcto conceptualmente — la promoción pertenece al empaque, no a la transacción. La entity debe limpiarse eliminando ese campo.

La entity `Promocion` (`entities/promocion.entity.ts`) tiene campos (`condiciones`, `fecha_inicio`, `fecha_fin`, `activo`) que no existen en el modelo Prisma actual. Debe decidirse si se migra el schema o se limpia la entity.
