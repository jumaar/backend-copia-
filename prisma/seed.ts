import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // 1. ROLES
  console.log('📝 Creando roles...');
  const roles = [
    { id_rol: 1, nombre_rol: 'Super_Admin' },
    { id_rol: 2, nombre_rol: 'Admin' },
    { id_rol: 3, nombre_rol: 'Frigorifico' },
    { id_rol: 4, nombre_rol: 'Logistica' },
    { id_rol: 5, nombre_rol: 'Tienda' },
  ];

  for (const role of roles) {
    await prisma.rOLES.upsert({
      where: { id_rol: role.id_rol },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles creados');

  // Reset sequence for ROLES
  await prisma.$executeRaw`SELECT setval('"ROLES_id_rol_seq"', (SELECT COALESCE(MAX(id_rol), 0) FROM "ROLES"))`;

  // 2. PERMISOS DE ROLES
  console.log('🔒 Creando permisos de roles...');
  const permissions = [
    // Super Admin (1) solo puede crear Admin (2)
    { id_rol_creador: 1, id_rol_creable: 2 },
    // Admin (2) puede crear Frigorifico (3) y Logistica (4)
    { id_rol_creador: 2, id_rol_creable: 3 },
    { id_rol_creador: 2, id_rol_creable: 4 },
    // Logistica (4) puede crear Tienda (5)
    { id_rol_creador: 4, id_rol_creable: 5 },
  ];

  for (const p of permissions) {
    await prisma.pERMISOS_ROLES.upsert({
      where: {
        id_rol_creador_id_rol_creable: {
          id_rol_creador: p.id_rol_creador,
          id_rol_creable: p.id_rol_creable,
        },
      },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permisos de roles creados');

  // 3. USUARIOS
  console.log('👤 Creando usuarios...');
  const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash('21621234"#$#$4234234', 10));

  const usuarios = [
    {
      id_usuario: 1,
      nombre_usuario: 'juan',
      apellido_usuario: 'juan',
      identificacion_usuario: '1114399152',
      celular: 3214568798,
      email: 'juanbitcoin988@gmail.com',
      contraseña: hashedPassword,
      activo: true,
      id_rol: 1,
    },
  ];

  for (const usuario of usuarios) {
    await prisma.uSUARIOS.upsert({
      where: { id_usuario: usuario.id_usuario },
      update: {},
      create: usuario,
    });
  }
  console.log('✅ Usuarios creados');

  // Reset sequence for USUARIOS
  await prisma.$executeRaw`SELECT setval('"USUARIOS_id_usuario_seq"', (SELECT COALESCE(MAX(id_usuario), 0) FROM "USUARIOS"))`;

  // 4. DEPARTAMENTO
  console.log('🏔️ Creando departamentos...');
  const departamentos = [
    { id__departamento: 1, nombre_departamento: 'Risaralda' },
    { id__departamento: 2, nombre_departamento: 'Quindio' },
    { id__departamento: 3, nombre_departamento: 'Valle Del Cauca' },
    { id__departamento: 4, nombre_departamento: 'Caldas' },
  ];

  for (const departamento of departamentos) {
    await prisma.dEPARTAMENTO.upsert({
      where: { id__departamento: departamento.id__departamento },
      update: {},
      create: departamento,
    });
  }
  console.log('✅ Departamentos creados');

  // Reset sequence for DEPARTAMENTO
  await prisma.$executeRaw`SELECT setval('"DEPARTAMENTO_id__departamento_seq"', (SELECT COALESCE(MAX(id__departamento), 0) FROM "DEPARTAMENTO"))`;

  // 5. CIUDAD
  console.log('🏙️ Creando ciudades...');
  const ciudades = [
    { id_ciudad: 1, nombre_ciudad: 'Santa Rosa De Cabal', id__departamento: 1 },
    { id_ciudad: 2, nombre_ciudad: 'Dosquebradas', id__departamento: 1 },
    { id_ciudad: 3, nombre_ciudad: 'Pereira', id__departamento: 1 },
    { id_ciudad: 4, nombre_ciudad: 'Chinchina', id__departamento: 4 },
  ];

  for (const ciudad of ciudades) {
    await prisma.cIUDAD.upsert({
      where: { id_ciudad: ciudad.id_ciudad },
      update: {},
      create: ciudad,
    });
  }
  console.log('✅ Ciudades creadas');

  // Reset sequence for CIUDAD
  await prisma.$executeRaw`SELECT setval('"CIUDAD_id_ciudad_seq"', (SELECT COALESCE(MAX(id_ciudad), 0) FROM "CIUDAD"))`;

  // 9. ESTADO_NEVERA
  console.log('🏠 Creando estados de nevera...');
  const estadosNevera = [
    { id_estado_nevera: 1, estado_nevera: 'Inactiva' },
    { id_estado_nevera: 2, estado_nevera: 'Activa' },
    { id_estado_nevera: 3, estado_nevera: 'Retirada' },
    { id_estado_nevera: 4, estado_nevera: 'En Bodega' },
    { id_estado_nevera: 5, estado_nevera: 'Surtiendo' },
  ];

  for (const estado of estadosNevera) {
    await prisma.eSTADO_NEVERA.upsert({
      where: { id_estado_nevera: estado.id_estado_nevera },
      update: {},
      create: estado,
    });
  }
  console.log('✅ Estados de nevera creados');

  // Reset sequence for ESTADO_NEVERA
  await prisma.$executeRaw`SELECT setval('"ESTADO_NEVERA_id_estado_nevera_seq"', (SELECT COALESCE(MAX(id_estado_nevera), 0) FROM "ESTADO_NEVERA"))`;

  // 11. PRODUCTOS
  console.log('📦 Creando productos...');
  const productos = [
    { id_producto: 1, nombre_producto: 'lomo cerdo', descripcion_producto: 'lomo cerdo 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 30, precio_frigorifico: 5.0 },
    { id_producto: 2, nombre_producto: 'lomo cerdo', descripcion_producto: 'lomo cerdo 250g', peso_nominal_g: 250, precio_venta: 2500, dias_vencimiento: 30, precio_frigorifico: 3.0 },
    { id_producto: 3, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 250g', peso_nominal_g: 250, precio_venta: 2500, dias_vencimiento: 25, precio_frigorifico: 3.0 },
    { id_producto: 4, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 500g', peso_nominal_g: 500, precio_venta: 5000, dias_vencimiento: 25, precio_frigorifico: 3.0 },
    { id_producto: 5, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 25, precio_frigorifico: 3.0 },
    { id_producto: 6, nombre_producto: 'panceta', descripcion_producto: 'panceta 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 40, precio_frigorifico: 3.0 },
    { id_producto: 7, nombre_producto: 'chorizo', descripcion_producto: 'de cerdo *3', peso_nominal_g: 300, precio_venta: 9000, dias_vencimiento: 20, precio_frigorifico: 3.0 },
    { id_producto: 8, nombre_producto: 'chorizo', descripcion_producto: 'de cerdo *7', peso_nominal_g: 700, precio_venta: 19000, dias_vencimiento: 20, precio_frigorifico: 3.0 },
  ];

  for (const producto of productos) {
    await prisma.pRODUCTOS.upsert({
      where: { id_producto: producto.id_producto },
      update: {},
      create: producto,
    });
  }
  console.log('✅ Productos creados');

  // Reset sequence for PRODUCTOS
  await prisma.$executeRaw`SELECT setval('"PRODUCTOS_id_producto_seq"', (SELECT COALESCE(MAX(id_producto), 0) FROM "PRODUCTOS"))`;

  // 12. ESTADO_EMPAQUE
  console.log('📦 Creando estados de empaque...');
  const estadosEmpaque = [
    { id_estado_empaque: 1, nombre_estado: 'EN FRIGORIFICO' },
    { id_estado_empaque: 2, nombre_estado: 'EN LOGISTICA' },
    { id_estado_empaque: 3, nombre_estado: 'EN NEVERA' },
    { id_estado_empaque: 4, nombre_estado: 'PENDIENTE PAGO' },
    { id_estado_empaque: 5, nombre_estado: 'PARA CAMBIO' },
    { id_estado_empaque: 6, nombre_estado: 'EN LOGISTICA PRIORIDAD' },
    { id_estado_empaque: 7, nombre_estado: 'VENCIDO/PERDIDA' },
    { id_estado_empaque: 8, nombre_estado: 'FINALIZADO CON EXITO' },
  ];

  for (const estado of estadosEmpaque) {
    await prisma.eSTADO_EMPAQUE.upsert({
      where: { id_estado_empaque: estado.id_estado_empaque },
      update: {},
      create: estado,
    });
  }
  console.log('✅ Estados de empaque creados');

  // Reset sequence for ESTADO_EMPAQUE
  await prisma.$executeRaw`SELECT setval('"ESTADO_EMPAQUE_id_estado_empaque_seq"', (SELECT COALESCE(MAX(id_estado_empaque), 0) FROM "ESTADO_EMPAQUE"))`;

  // 13. PROMOCIONES
  console.log('🎉 Creando promociones...');
  const promociones = [
    { id_promocion: 1, nombre: '20% Descuento', tipo: 'PORCENTAJE', valor: 20.0 },
    { id_promocion: 2, nombre: '2x1 (50% en 2da unidad)', tipo: 'BOGOF', valor: 50.0 },
    { id_promocion: 3, nombre: '50% Descuento', tipo: 'PORCENTAJE', valor: 50.0 },
    { id_promocion: 4, nombre: 'Liquidación Total', tipo: 'PORCENTAJE', valor: 80.0 },
  ];  

  for (const promocion of promociones) {
    await prisma.pROMOCIONES.upsert({
      where: { id_promocion: promocion.id_promocion },
      update: {},
      create: promocion,
    });  
  }  
  console.log('✅ Promociones creadas');

  // Reset sequence for PROMOCIONES
  await prisma.$executeRaw`SELECT setval('"PROMOCIONES_id_promocion_seq"', (SELECT COALESCE(MAX(id_promocion), 0) FROM "PROMOCIONES"))`;

  // 15. TEMPERATURA NEVERA
  console.log('📝 Creando estados de temperatura de nevera...');
  const estadosTemperatura = [
    { id_temperatura_nevera: 1, nombre_estado: 'OK' },
    { id_temperatura_nevera: 2, nombre_estado: 'Fuera de rango 0° - 4°' },
    { id_temperatura_nevera: 3, nombre_estado: 'Falla sensor' },
    { id_temperatura_nevera: 4, nombre_estado: 'Desconocido' },
  ];

  for (const estado of estadosTemperatura) {
    await prisma.tEMPERATURA_NEVERA.upsert({
      where: { id_temperatura_nevera: estado.id_temperatura_nevera },
      update: {},
      create: estado,
    });
  }
  console.log('✅ Estados de temperatura de nevera creados');

  // Reset sequence for TEMPERATURA_NEVERA
  await prisma.$executeRaw`SELECT setval('"TEMPERATURA_NEVERA_id_temperatura_nevera_seq"', (SELECT COALESCE(MAX(id_temperatura_nevera), 0) FROM "TEMPERATURA_NEVERA"))`;

  // 17. TIPO_TRANSACCION
  console.log('💰 Creando tipos de transacción...');
  const tiposTransaccion = [
    { id_tipo: 1, nombre_codigo: 'venta', descripcion_amigable: 'Venta de empaque en la tienda' },
    { id_tipo: 2, nombre_codigo: 'costo_frigorifico', descripcion_amigable: 'Deuda de logística con frigorífico' },
    { id_tipo: 3, nombre_codigo: 'ticket_consolidado', descripcion_amigable: 'Ticket que agrupa varias transacciones' },
    { id_tipo: 4, nombre_codigo: 'pago_recibido', descripcion_amigable: 'Dinero recibido de un deudor' },
    { id_tipo: 5, nombre_codigo: 'pago_realizado', descripcion_amigable: 'Dinero entregado a un acreedor' },
    { id_tipo: 6, nombre_codigo: 'devolucion', descripcion_amigable: 'Anulación de una venta' },
    { id_tipo: 7, nombre_codigo: 'perdida_vencimiento', descripcion_amigable: 'Ajuste por producto vencido' },
    { id_tipo: 8, nombre_codigo: 'gasto_operativo', descripcion_amigable: 'Gasto (ej. gasolina)' },
  ];  

  for (const tipo of tiposTransaccion) {
    await prisma.tIPO_TRANSACCION.upsert({
      where: { id_tipo: tipo.id_tipo },
      update: {},
      create: tipo,
    });  
  }  
  console.log('✅ Tipos de transacción creados');

  // Reset sequence for TIPO_TRANSACCION
  await prisma.$executeRaw`SELECT setval('"TIPO_TRANSACCION_id_tipo_seq"', (SELECT COALESCE(MAX(id_tipo), 0) FROM "TIPO_TRANSACCION"))`;

  // 18. ESTADO_TRANSACCION
  console.log('📊 Creando estados de transacción...');
  const estadosTransaccion = [
    { id_estado_transaccion: 1, nombre_estado: 'PENDIENTE' },
    { id_estado_transaccion: 2, nombre_estado: 'PAGADO' },
    { id_estado_transaccion: 3, nombre_estado: 'ANULADO' },
    { id_estado_transaccion: 4, nombre_estado: 'CONSOLIDADO' },
  ];  

  for (const estado of estadosTransaccion) {
    await prisma.eSTADO_TRANSACCION.upsert({
      where: { id_estado_transaccion: estado.id_estado_transaccion },
      update: {},
      create: estado,
    });  
  }  
  console.log('✅ Estados de transacción creados');

  // Reset sequence for ESTADO_TRANSACCION
  await prisma.$executeRaw`SELECT setval('"ESTADO_TRANSACCION_id_estado_transaccion_seq"', (SELECT COALESCE(MAX(id_estado_transaccion), 0) FROM "ESTADO_TRANSACCION"))`;

  // 19. LISTA_DE_REPRODUCCION
console.log('📋 Creando listas de reproducción...');

const listasReproduccion = [
  {
    id_lista_reproduccion: 1,
    nombre: 'LISTA DIARIA',
    
    
    lista_json: [
        {
          "url": "http://0.0.0.0:8000/local_media/4253351-uhd_4096_2160_25fps.mp4",
          "type": "video"
        },
        {
          "url": "https://cdn.pixabay.com/photo/2019/11/04/14/56/chorizo-4601353_1280.jpg",
          "type": "image",
          "duration_seconds": 20
        }
      ]
  },
];

for (const lista of listasReproduccion) {
  const { id_lista_reproduccion, ...dataParaCrearOActualizar } = lista;

  await prisma.lISTA_DE_REPRODUCCION.upsert({
    where: { id_lista_reproduccion: id_lista_reproduccion },
    
    update: dataParaCrearOActualizar,
    
    create: dataParaCrearOActualizar,
  });
}
console.log('✅ Listas de reproducción creadas');

  // Reset sequence for LISTA_DE_REPRODUCCION
  await prisma.$executeRaw`SELECT setval('"LISTA_DE_REPRODUCCION_id_lista_reproduccion_seq"', (SELECT COALESCE(MAX(id_lista_reproduccion), 0) FROM "LISTA_DE_REPRODUCCION"))`;

  // 20. BIBLIOTECA
  console.log('📚 Creando biblioteca...');
  const biblioteca = [
    { id: 1, nombre: 'CHORIZOS DE CERDO', tipo: 'IMAGEN' as const, url: '/images/chorizos-cerdo.jpg' },
    { id: 2, nombre: 'PROMOCION DE CHORIZO', tipo: 'VIDEO' as const, url: '/videos/promocion-chorizo.mp4' },
    { id: 3, nombre: 'PUBLICIDAD DIARIA', tipo: 'VIDEO' as const, url: '/videos/publicidad-diaria.mp4' },
  ];

  for (const item of biblioteca) {
    await prisma.bIBLIOTECA.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
  console.log('✅ Biblioteca creada');

  // Reset sequence for BIBLIOTECA
  await prisma.$executeRaw`SELECT setval('"BIBLIOTECA_id_seq"', (SELECT COALESCE(MAX(id), 0) FROM "BIBLIOTECA"))`;

  // 21. ITEMS_DE_REPRODUCCION
  console.log('🎵 Creando items de reproducción...');
  const itemsReproduccion = [
    { id: 1, id_lista_reproduccion: 1, id_biblioteca: 1, tiempo_reproduccion_s: 20, orden_reproduccion: 1 },
    { id: 2, id_lista_reproduccion: 1, id_biblioteca: 2, tiempo_reproduccion_s: 20, orden_reproduccion: 2 },
    { id: 3, id_lista_reproduccion: 1, id_biblioteca: 3, tiempo_reproduccion_s: 30, orden_reproduccion: 3 },
  ];

  for (const item of itemsReproduccion) {
    await prisma.iTEMS_DE_REPRODUCCION.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
  console.log('✅ Items de reproducción creados');

  // Reset sequence for ITEMS_DE_REPRODUCCION
  await prisma.$executeRaw`SELECT setval('"ITEMS_DE_REPRODUCCION_id_seq"', (SELECT COALESCE(MAX(id), 0) FROM "ITEMS_DE_REPRODUCCION"))`;

  console.log('🎉 Seeding completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });