# Resumen del Proyecto: Gestión de Cadena de Suministro VORAK

## 1. Descripción General del Proyecto

Este proyecto es una aplicación integral para la gestión de la cadena de suministro de productos cárnicos, desarrollada con **NestJS (Backend)** y **React + TypeScript (Frontend)**. Está diseñada para administrar el ciclo de vida completo de los productos, desde la producción en frigoríficos hasta la distribución a través de la logística y la venta final en tiendas con neveras inteligentes conectadas a la API.

El sistema cuenta con un control de acceso basado en roles (RBAC) que permite a diferentes tipos de usuarios (Super Admin, Admin, Frigorífico, Logística, Tienda) realizar acciones específicas dentro de su dominio. La aplicación proporciona una vista jerárquica de los usuarios y las unidades de producción, permitiendo a los administradores gestionar cuentas de usuario, crear y administrar instalaciones de producción y realizar un seguimiento del inventario.

## 2. Arquitectura del Sistema

### Backend (NestJS)
- **Framework:** NestJS con TypeScript
- **Base de Datos:** PostgreSQL con Prisma ORM
- **Autenticación:** JWT con estrategias de Passport
- **Validación:** Class Validator y Class Transformer
- **Documentación:** OpenAPI/Swagger integrada

### Base de Datos
- **Motor:** PostgreSQL
- **ORM:** Prisma con migraciones automatizadas
- **Esquema:** Relacional con claves foráneas y restricciones de integridad

## 3. Rutas de la API y Funciones

Toda la comunicación con la API se maneja a través de una instancia de Axios configurada en `src/services/api.ts`. La URL base para la API es `http://localhost:3000/api`. El cliente gestiona la autenticación basada en JWT, incluyendo la lógica de refresco de tokens.

### Autenticación (`/auth`)

*   `POST /auth/login`: Autentica a un usuario y devuelve un token de acceso.
*   `POST /auth/logout`: Cierra la sesión del usuario actual.
*   `POST /auth/refresh`: Refresca un token de acceso expirado.
*   `POST /auth/create-user`: Crea un nuevo usuario utilizando un token de registro.

### Gestión de Usuarios (`/gestion-usuarios`)

*   `GET /gestion-usuarios`: Obtiene la jerarquía de usuarios y los tokens de registro activos.
*   `GET /gestion-usuarios/{id}`: Obtiene la información detallada de un usuario específico.
*   `PATCH /gestion-usuarios/{id}`: Actualiza la información de un usuario.
*   `PATCH /gestion-usuarios/{id}/toggle-status`: Activa o desactiva una cuenta de usuario.
*   `DELETE /gestion-usuarios/{id}`: Elimina un usuario.

### Tokens de Registro (`/registration-tokens`)

*   `POST /registration-tokens`: Crea un nuevo token de registro para un rol de usuario específico.

### Gestión de Frigoríficos (`/frigorifico`)

*   `GET /frigorifico`: Obtiene todos los datos relacionados con el usuario de frigorífico autenticado, incluyendo empaqques en stock, emaques despachados hoy,saldos de dinero, estaciones y ultimos lotes de inventario creado .
*   `POST /frigorifico`: Crea una nueva instalación de frigorífico.
*   `PATCH /frigorifico`: Actualiza una instalación de frigorífico existente.
*   `DELETE /frigorifico`: Elimina una instalación de frigorífico.
*   `POST /frigorifico/estacion/{id}`: Crea una nueva estación de producción para un frigorífico.
*   `DELETE /frigorifico/estacion/{id}`: Elimina una estación de producción.

### Gestión de Productos (`/frigorifico/productos`)

*   `GET /frigorifico/productos`: Obtiene todos los productos asociados a un frigorífico rol 1,2,3,4.
*   `POST /frigorifico/productos`: Crea un nuevo producto solo rol 1 y 2.
*   `PATCH /frigorifico/productos/{id}`: Actualiza un producto existente solo rol 1 y 2.
*   `DELETE /frigorifico/productos/{id}`: Elimina un producto solo rol 1 y 2.
