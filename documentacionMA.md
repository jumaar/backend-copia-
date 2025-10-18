









## TAREAS  --> V 0.0.0.0

nota: en este apartado se colocan ideas y posibles mejoras a futuro , cuando se coloca una queda pendiente, si la tarea se realiza esta se elinina de aca y se implementa inmediatamente en la docuentacion si la mejora fuera positiva.( si esta vacio no hay nada pendiente)

- - tarea antes de commit:En que version de este modulo estamos para git?  -> 0.0.0.0

- Formulario "Añadir Nevera": Dentro del panel, habría una sección para gestionar neveras con un formulario que pide:

ID de la Nevera (ej: NEVERA-003-BOGOTA)
Contraseña para la Nevera (el operador la inventa o la genera ahí mismo)
Otros datos (ubicación, modelo, etc.)
El "Click" Mágico: Cuando el operador hace clic en "Guardar", el código del panel de administración (que es otro servidor, separado de tu API principal) hace lo siguiente:

Toma la contraseña que el operador escribió en el formulario.
Usa la misma lógica de bcrypt.generate_password_hash() para crear el hash.
No lo imprime en pantalla. En su lugar, se conecta a la base de datos de producción (que ya no sería un archivo JSON, sino una base de datos real como PostgreSQL, MySQL o MongoDB).
Inserta una nueva fila en la tabla fridges con el fridge_id y el secret_hash recién generado.
Configuración de la Nevera Física: El operador ahora tiene el ID (NEVERA-003-BOGOTA) y la contraseña en texto plano que acaba de crear. Procede a configurar la nevera física con esas credenciales para que pueda conectarse a la API. (lacontraseña es unica para cada nevera, la contraseña que se usa para crear la nevera en la api , es la misma que se pone en .env de la nevera)