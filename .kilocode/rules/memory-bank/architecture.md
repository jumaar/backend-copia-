# Arquitectura del Sistema

## 1. Estructura General del Sistema

La aplicación sigue una arquitectura cliente-servidor con separación clara entre backend (NestJS) y frontend (React). El sistema está diseñado para gestionar la cadena de suministro de productos cárnicos con control de acceso basado en roles.

## 2. Arquitectura del Backend (NestJS)

### Estructura del Código Fuente

*   **`main.ts`**: Punto de entrada de la aplicación NestJS. Configura el servidor y middlewares globales.
*   **`app.module.ts`**: Módulo raíz que importa todos los módulos de la aplicación.

### `src/auth/`
Gestiona la autenticación y autorización:
*   `auth.controller.ts`: Endpoints de login, logout, refresh y creación de usuarios
*   `auth.service.ts`: Lógica de negocio de autenticación
*   `auth.module.ts`: Configuración del módulo de autenticación
*   `strategies/jwt.strategy.ts`: Estrategia JWT para Passport
*   `guards/`: Guards para protección de rutas (JWT, Roles)
*   `decorators/roles.decorator.ts`: Decorador para roles

### `src/database/`
Configuración de la base de datos:
*   `database.service.ts`: Servicio de conexión a Prisma con logs
*   `database.module.ts`: Configuración del módulo de base de datos

### `src/gestion-usuarios/`
Gestión de usuarios y jerarquía:
*   `gestion-usuarios.controller.ts`: Endpoints CRUD de usuarios
*   `gestion-usuarios.service.ts`: Lógica de gestión de usuarios con permisos jerárquicos
*   `dto/`: DTOs para validación de datos

### `src/frigorifico/`
Gestión de frigoríficos y producción:
*   `frigorifico.controller.ts`: Endpoints para frigoríficos, estaciones y productos
*   `frigorifico.service.ts`: Lógica de negocio con validaciones de estaciones activas
*   `dto/`: DTOs para creación y actualización

### `src/registration-tokens/`
Sistema de tokens de registro:
*   `registration-tokens.controller.ts`: Endpoints para tokens
*   `registration-tokens.service.ts`: Lógica de tokens de invitación

### `src/neveras/`, `src/logistica/`, `src/tiendas/`, `src/kiosk-admin/`
Módulos específicos para cada rol del sistema falta hacer estos end points.

### `src/common/`
Utilidades compartidas:
*   `middleware/logging.middleware.ts`: Middleware de logging de requests

### `src/productos/`
Entidades de productos y empaques.


## 3. Base de Datos (PostgreSQL + Prisma)

### Esquema Principal
- **USUARIOS**: Gestión de usuarios con roles jerárquicos
- **ROLES**: Definición de roles y permisos
- **TOKEN_REGISTRO**: Sistema de invitaciones
- **FRIGORIFICO**: Instalaciones de producción
- **ESTACIONES**: Líneas de producción con control de activación
- **PRODUCTOS**: Catálogo de productos
- **EMPAQUES**: Trazabilidad de lotes
- **LOGISTICA**: Gestión de transporte
- **TIENDAS**: Puntos de venta
- **NEVERAS**: Dispositivos IoT inteligentes

### Relaciones Clave
- Usuario → Frigorífico (1:1)
- Frigorífico → Estaciones (1:N)
- Estaciones → Empaques (1:N)
- Empaques → Logística → Tiendas (cadena de suministro)

## 4. Patrones de Diseño

*   **Arquitectura Hexagonal (Backend):** Separación clara entre dominio, aplicación e infraestructura
*   **Repository Pattern:** Abstracción de acceso a datos con Prisma
*   **DTO Pattern:** Validación y transformación de datos
*   **Guard Pattern:** Protección de rutas y autorización


## 5. Control de Acceso (RBAC)

### Jerarquía de Roles:
1. **Super Admin**: Control total del sistema
2. **Admin**: Gestión de red específica (frigoríficos + logística)
3. **Frigorífico**: Producción y gestión de estaciones
4. **Logística**: Distribución y gestión de tiendas
5. **Tienda**: Venta y gestión de sus propiod producton en sus neveras.

### Permisos Especiales:
- **Estaciones**: Control por frigorífico con bloqueo de creación múltiple de estacion
- **Usuarios**: Jerarquía estricta (solo superiores pueden gestionar inferiores)
- **Productos**: Solo Super Admin y Admin pueden crear/modificar