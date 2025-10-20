# Documentación del Estado Inicial de la Base de Datos

Este documento describe el estado de la base de datos después de ejecutar el script de `seed`. La base de datos se inicializa con un conjunto de datos de catálogo y un usuario Super Administrador, mientras que las tablas transaccionales se dejan vacías para un comienzo limpio.

---

## Tablas con Datos Iniciales (Catálogos)

Estas tablas se pueblan con datos esenciales para el funcionamiento básico de la aplicación.

-   **ROLES:** Contiene los roles de usuario del sistema.
    -   `1`: Super_Admin
    -   `2`: Admin
    -   `3`: Frigorifico
    -   `4`: Logistica
    -   `5`: Tienda

-   **PERMISOS_ROLES:** Define qué roles pueden crear otros roles.
    -   El Super Admin puede crear todos los demás roles.
    -   El Admin puede crear Frigorifico, Logistica y Tienda.
    -   Frigorifico y Logistica solo pueden crear Tienda.

-   **USUARIOS:** Contiene un único usuario inicial.
    -   `id_usuario: 1`: El Super Administrador.

-   **DEPARTAMENTO:** Lista de departamentos geográficos.

-   **CIUDAD:** Lista de ciudades, relacionadas con los departamentos.

-   **ESTADO_EMPAQUE:** Define los posibles estados de un lote de productos.

-   **TIPO_TRANSACCION:** Define los tipos de transacciones financieras.

-   **ESTADO_TRANSACCION:** Define los posibles estados de una transacción.

-   **PROMOCIONES:** Lista de promociones predefinidas.

-   **PRODUCTOS:** Catálogo de productos iniciales.

-   **ESTADO_NEVERA:** Define los posibles estados de una nevera.

-   **ESTADO_REPORTE_NEVERAS:** Define los Estados en tiempo real de las neveras (OK, Falla,temperatura, etc.).

---

## Tablas Vacías (Transaccionales)

Estas tablas se dejan vacías intencionadamente. Se llenarán a medida que los usuarios interactúen con la aplicación.

-   **TIENDAS**
-   **NEVERAS**
-   **FRIGORIFICO**
-   **LOGISTICA**
-   **EMPAQUES**
-   **REPORTE_ESTADO**
-   **TRANSACCIONES**
-   **TOKEN_REGISTRO:** (Aunque no es estrictamente transaccional, se inicia vacía y se llena a demanda).