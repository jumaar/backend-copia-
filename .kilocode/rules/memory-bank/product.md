# Producto: Sistema de Gestión de Cadena de Suministro VORAK

## 1. ¿Por qué existe este proyecto?

Este proyecto nace de la necesidad de digitalizar y optimizar la cadena de suministro de productos cárnicos, un sector que tradicionalmente ha dependido de procesos manuales y poco eficientes. La falta de trazabilidad en tiempo real, la gestión de inventarios propensa a errores y la comunicación fragmentada entre los distintos actores (frigoríficos, logística, tiendas) generan pérdidas económicas y merman la confianza del consumidor.

VORAK busca ser la solución integral que conecte todos los eslabones de la cadena, proporcionando una plataforma centralizada, transparente y fácil de usar.

## 2. Problemas que resuelve

*   **Falta de Trazabilidad:** Dificultad para rastrear un producto desde su origen en el frigorífico hasta el punto de venta final, lo que complica la gestión de calidad y la respuesta ante incidencias.
*   **Gestión de Inventario Ineficiente:** Procesos manuales que llevan a errores en el conteo de stock, descuadres de inventario y pérdidas por productos vencidos o mal gestionados.
*   **Comunicación Descentralizada:** La comunicación entre frigoríficos, transportistas y tiendas se realiza a través de múltiples canales (llamadas, correos, mensajes), lo que genera retrasos, malentendidos y falta de visibilidad.
*   **Acceso a la Información Limitado:** Los diferentes roles (administradores, operarios de frigorífico, personal de logística) no tienen acceso a la información que necesitan en el momento oportuno, lo que dificulta la toma de decisiones.
*   **Seguridad y Confianza:** La falta de un sistema robusto para la creación y gestión de usuarios con diferentes niveles de acceso compromete la seguridad de los datos y la integridad de la operación.

## 3. ¿Cómo debería funcionar?

El sistema debe funcionar como una plataforma web única y cohesiva, accesible desde cualquier dispositivo con conexión a internet. Cada tipo de usuario tendrá un panel de control (dashboard) adaptado a sus responsabilidades:

*   **Super Admin:** Tendrán una visión global de toda la operación. Podrán crear y gestionar cuentas de usuario admin , supervisar el inventario general, generar reportes y configurar los parámetros del sistema.
*   **Admin:** Tendrán una visión global de toda su red (solo su red). Podrán crear y gestionar cuentas de usuario para los roles frigorifico y logistica, supervisar el inventario de su red, y generar reportes y crear pormociones que se publicitaran en el modo kiosko de las neveras.
*   **Frigorífico:** Podrá registrar la producción de nuevos lotes de productos llamados empaques, gestionar su inventario, crear y administrar las estaciones de producción y preparar los despachos para la logística.
*   **Logística:** Tendrá visibilidad sobre los despachos pendientes, podrá gestionar las rutas de transporte y confirmar la entrega de los productos a las tiendas es el que crea los usuaros tienda que quedan en su propia red.
*   **Tienda:** Podrá recibir los productos, gestionar su inventario en las neveras inteligentes y registrar las ventas y gestionar la publicidad parciamente que se ve en la nevera.

El flujo de trabajo principal será:
1.  Un **Frigorífico** crea un lote de productos y lo registra en el sistema.
2.  El sistema asigna un identificador único a cada producto para su trazabilidad.
3.  El **Frigorífico** prepara un despacho y lo asigna a un transportista de **Logística**.
4.  **Logística** confirma la recogida y gestiona el transporte hasta la **Tienda**.
5.  La **Tienda** recibe el producto, lo registra en su inventario y lo pone a la venta.
6.  Los **Admins** supervisan todo el proceso y pueden intervenir en caso de ser necesario.

## 4. Objetivos de Experiencia de Usuario (UX)

*   **Intuitivo y Fácil de Usar:** La interfaz debe ser clara y sencilla, incluso para usuarios con poca experiencia en tecnología. Cada panel debe mostrar la información más relevante de forma destacada.
*   **Eficiente:** Las tareas comunes, como registrar un lote o confirmar una entrega, deben poder realizarse con el mínimo número de clics posible y siempre actualizando la vista para el cambio se vea reflejado de inmediato.
*   **Adaptable (Responsive):** La plataforma debe ser completamente funcional en diferentes dispositivos, desde ordenadores de escritorio hasta tabletas y móviles.
*   **Seguro:** Los usuarios deben sentir que sus datos están seguros. El sistema de roles y permisos debe ser claro y visible.
*   **Transparente:** La información debe presentarse de forma clara y concisa, permitiendo a los usuarios entender el estado de la cadena de suministro de un vistazo.