# Módulo Transacciones

## 1. Schema

| Campo | Tipo | Descripción |
|---|---|---|
| `id_transaccion` | Int (PK) | Autoincremental |
| `id_empaque` | Int? (FK → EMPAQUES) | Empaque asociado (solo ventas) |
| `id_usuario` | Int (FK → USUARIOS) | Usuario afectado |
| `id_transaccion_rel` | Int? (self-ref FK) | Vincula transacciones entre sí |
| `id_nevera` | Int? (FK → NEVERAS) | Nevera asociada |
| `monto` | Decimal |   administrativo admin/logistica: **Positivo = recibe**, **Negativo = entrega** | proveedores/frigorificos(solo recibe dinero) **Positivo = saldo a favor/la empresa le debe**, **Negativo = crédito a favor/debe a la empresa** | tiendas/clientes (solo entregan dinero) **Positivo = debe a la empresa**, **Negativo = crédito a favor/la empresa le debe** |
| `hora_transaccion` | DateTime | Timestamp |
| `id_tipo_transaccion` | Int (FK → TIPO_TRANSACCION) | Categoría |
| `nota_opcional` | String? | Descripción libre |
| `estado_transaccion` | Int (FK → ESTADO_TRANSACCION) | Ciclo de vida |

> **Convención de entrada:** Todos los endpoints reciben montos **positivos** (lo que el usuario entregó o recibió). El signo en la BD lo calcula el sistema internamente según el tipo de transacción y el rol. La única excepción es `monto = 0` en el cuadre de caja logística → admin.

### Tipos

| id | Constante | Uso |
|---|---|---|
| 1 | `TIPO_VENTA` | Venta de empaque en tienda |
| 2 | `TIPO_COSTO_FRIGORIFICO` | Costo frigorífico / saldo exclusivo de frigorífico |
| 3 | `TIPO_TICKET_CONSOLIDADO` | Ticket de consolidación (cierre contable) |
| 4 | `TIPO_DINERO_RECIBIDO` | Dinero recibido |
| 5 | `TIPO_DINERO_ENTREGADO` | Dinero entregado |

### Estados

| id | Constante | Significado |
|---|---|---|
| 1 | `ESTADO_PENDIENTE` | Pendiente de liquidación |
| 2 | `ESTADO_PAGADO` | Liquidado / cerrado |
| 4 | `ESTADO_CONSOLIDADO` | Ticket consolidado |

---

## 2. Ley del Cero

> **Para cualquier usuario, `Σ(tx en estado 2) + ticket(tipo 3, estado 4) = 0`.**

El ticket de consolidación (tipo 3, estado 4, **siempre negativo**) es el mecanismo que garantiza esta invariante. Cada vez que se liquidan transacciones pendientes de un usuario, se crea un ticket con valor `-Σ(pendientes)` para ese mismo usuario.


---

## 3. API del Servicio (`TransaccionesService`)

Único servicio autorizado para escribir en `tRANSACCIONES`. Módulo `@Global()`, sin controller.

### Escritura

| Método | Qué hace |
|---|---|
| `crearTransaccion(params)` | Crea una tx individual |
| `crearTransaccionEnTx(tx, params)` | Crea dentro de una tx Prisma existente |
| `consolidar(params)` | Motor de consolidación — ver §5 |
| `consolidarEnTx(tx, params)` | Motor de consolidación dentro de tx Prisma |
| `transferenciaDirecta(params)` | Transferencia directa entre dos usuarios |
| `marcarPagadasEnTx(tx, ids, idTicket)` | Marca txs como estado 2 y las vincula al ticket |
| `actualizarNota(id, nota)` | Actualiza `nota_opcional` |
| `vincularRelEnTx(tx, id, idRel)` | Actualiza `id_transaccion_rel` |

### Lectura

| Método | Qué hace |
|---|---|
| `getPendientes({ idUsuario, idNevera?, idTipoTransaccion?, idTransaccionRelNotNull? })` | Tx en estado 1 |
| `countPendientes({ idUsuario, idNevera })` | Conteo de pendientes |

---

## 4. Endpoints

| # | Endpoint | Roles | Método Service | Operación |
|---|---|---|---|---|
| 1 | `POST /api/frigorifico/empaques/cambiar-estado` | 4 | `empaqueDeUnoaDos()` | Despacho → tipo 2 estado 1 para frigorífico |
| 2 | `POST /api/logistica/cuentas` | 2, 4 | `consolidarCuentas()` | Pago o adelanto a frigorífico |
| 3 | `POST /api/logistica/consolidar-admin` | 2, 4 | `consolidarAdmin()` | egreso admin→logística o cuadre de caja |
| 4 | `POST /api/logistica/cuentas/nevera/:id_nevera` | 2, 4 | `liquidarNevera()` | Liquidación de nevera (tienda→logística) |

---

## 5. Guía por Categoría

> Cada categoría de usuario tiene reglas de signo, tipos de transacción y parámetros de consolidación distintos. Esta sección es la referencia canónica para crear endpoints y detectar errores.

---

### 5.1 PROVEEDORES / Frigorífico (rol 3)

**Tipos:** solo 2 (`costo_frigorifico`) y 3 (ticket). **Nunca** 4 ni 5.

| Signo | Significado |
|---|---|
| **Positivo (+)** | saldo a favor/la empresa le debe |
| **Negativo (-)** | Adelanto / debe a la empresa |

**Generación de deuda** — `POST /api/frigorifico/empaques/cambiar-estado`:
```
se crea una transaccion a cada empaque despachado → tipo 2 costo_frigorifico, +costo_frigorifico, estado 1
id_usuario extraído del id_estacion (formato XXXX00XXX)
```

**Pago con pendientes** — `consolidar()`:
```
idUsuarioTicket    = frigorífico
idUsuarioPagador   = quien paga (admin o logística)
// NO pasar idTipoTransaccionSaldo → usa default (2)
// NO pasar idTipoTransaccionSaldoNegativo → usa default (2)
```
Resultado: ticket (frigorífico, tipo 3, `-Σ`, estado 4) + pagador (tipo 5, `-monto`, estado 1) + saldo si difiere (tipo 2).

**Adelanto (sin pendientes)** — `transferenciaDirecta()`:
```
tipoReceptor = 2, montoReceptorNegativo = true
→ frigorífico: tipo 2, -monto, estado 1 (adelanto)
```

**⚠️ `consolidarCuentas()` es compartido entre Admin y Logística para pagar al frigorífico.**

---

### 5.2 CLIENTES / TIENDAS (rol 5)

**Tipo base:** 1 (`venta`). Saldos: tipo 4 (debe) o 5 (a favor). **Nunca** tipo 2.

| Signo | Significado |
|---|---|
| **Positivo (+)** | Debe dinero |
| **Negativo (-)** | Adelanto a favor |

**Liquidación CON empaques (estado 4 → 8):**

```
monto por empaque = precioVenta - descuentoPromocion - comisionTienda
totalLiquidar = Σ(montos empaques) + Σ(pendientes previas tienda/nevera)
```

Usa `consolidarEnTx()`:
```
idUsuarioTicket              = tienda
idUsuarioReceptor            = logística
idTipoTransaccionSaldo       = 4
idTipoTransaccionSaldoNegativo = 5
montoConsolidado             = totalLiquidar
idsPendientes                = ids pendientes previas
```

Luego: una tx tipo 1 por empaque (estado 2, `id_rel` = ticket). Empaques → estado 8.

**Liquidación SIN empaques:**
- Con pendientes → `consolidar()` con mismos parámetros de arriba
- Sin pendientes (adelanto) → `transferenciaDirecta()` estándar ,genera dos transacciones en estado 1 para cada usuario y id_transaccion_rel

**⚠️** `getPendientes()` para tienda se llama con `{ idUsuario, idNevera }` **sin filtro de tipo**.

---

### 5.3 ADMINISTRACIÓN / Admin (rol 2) + Logística (rol 4)

**Tipos:** 4 (`recibido`) y 5 (`entregado`).

| Signo | Significado |
|---|---|
| **Positivo (+)** | Recibe dinero |
| **Negativo (-)** | Entrega dinero |

**Ingreso admin → logística** — `transferenciaDirecta()`:
```
idUsuarioPagador  = admin    → tipo 5, -monto, estado 1
idUsuarioReceptor = logística → tipo 4, +monto, estado 1
id_transaccion_rel cruzado entre ambos
```

**Cuadre de caja logística → admin** — `consolidar()`:
```
Paso 1: getPendientes({ idUsuario: logistica })
        // SIN filtros. Devuelve TODAS las tx en estado 1 del logístico.

Paso 2: idUsuarioTicket              = logística
        idUsuarioReceptor            = admin
        idTipoTransaccionSaldo       = 4
        idTipoTransaccionSaldoNegativo = 5
```
Resultado: ticket (logística, tipo 3, `-Σ`, estado 4) + receptor/admin (tipo 4, `+montoPagado`, estado 1) + saldo si difiere (tipo 5 si el monto es negativo / crédito a favor, tipo 4 si el monto es positivo / deuda pendiente para logística). Acepta `monto = 0`(un logistica puede gastar exactamente lo que recibe).

**Admin paga a frigorífico:** comparte `consolidarCuentas()` con logística (ver §5.1).

**⚠️ El admin no tiene endpoint de consolidación propio (§6.1).** Sus tx tipo 4/5 en estado 1 quedan abiertas.


---

## 6. Pendientes

### 6.1 Consolidación del Admin

El admin acumula transacciones tipo 4 y 5 en estado 1 que **nunca se liquidan**. No existe endpoint de cierre.

**Requerido:** `POST /api/logistica/consolidar-admin-cierre` que:
- Obtenga `getPendientes({ idUsuario: admin })` sin filtros
- Genere ticket consolidado (tipo 3, negativo) para el admin
- Marque pendientes → estado 2
- Cree saldo si hay diferencia (tipo 4 o 5, estado 1)


