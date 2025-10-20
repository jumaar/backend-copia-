import { PrismaClient } from '../generated/prisma';

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

  // 2. PERMISOS DE ROLES
  console.log('🔒 Creando permisos de roles...');
  const permissions = [
    // Super Admin puede crear Admin, Frigorifico, Logistica, Tienda
    { id_rol_creador: 1, id_rol_creable: 1 }, // Super Admin -> Super Admin
    { id_rol_creador: 1, id_rol_creable: 2 }, // Super Admin -> Admin
    { id_rol_creador: 1, id_rol_creable: 3 }, // Super Admin -> Frigorifico
    { id_rol_creador: 1, id_rol_creable: 4 }, // Super Admin -> Logistica
    { id_rol_creador: 1, id_rol_creable: 5 }, // Super Admin -> Tienda
    // Admin puede crear otro Admin, Frigorifico, Logistica, Tienda
    { id_rol_creador: 2, id_rol_creable: 2 }, // Admin -> Admin
    { id_rol_creador: 2, id_rol_creable: 3 }, // Admin -> Frigorifico
    { id_rol_creador: 2, id_rol_creable: 4 }, // Admin -> Logistica
    { id_rol_creador: 2, id_rol_creable: 5 }, // Admin -> Tienda
    // Frigorifico no puede crear nada
    // Logistica puede crear Tienda
    { id_rol_creador: 4, id_rol_creable: 5 },
    // Tienda no puede crear nada
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

  // 5. CIUDAD
  console.log('🏙️ Creando ciudades...');
  const ciudades = [
    { id_ciudad: 1, nombre_ciudad: 'Santa Rosa De Cabal', id__departamento: 1 },
    { id_ciudad: 2, nombre_ciudad: 'Dosquebradas', id__departamento: 2 },
    { id_ciudad: 3, nombre_ciudad: 'Pereira', id__departamento: 3 },
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
  
  // 9. ESTADO_NEVERA
  console.log('🏠 Creando estados de nevera...');
  const estadosNevera = [
    { id_estado_nevera: 1, estado_nevera: 'En Bodega' },
    { id_estado_nevera: 2, estado_nevera: 'Activa' },
    { id_estado_nevera: 3, estado_nevera: 'Retirada' },
    { id_estado_nevera: 4, estado_nevera: 'En Inventario' },
  ];

  for (const estado of estadosNevera) {
    await prisma.eSTADO_NEVERA.upsert({
      where: { id_estado_nevera: estado.id_estado_nevera },
      update: {},
      create: estado,
    });
  }
  console.log('✅ Estados de nevera creados');

  // 11. PRODUCTOS
  console.log('📦 Creando productos...');
  const productos = [
    { id_producto: 1, nombre_producto: 'lomo cerdo', descripcion_producto: 'lomo cerdo 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 30, precio_frigorifico: 95.0 },
    { id_producto: 2, nombre_producto: 'lomo cerdo', descripcion_producto: 'lomo cerdo 250g', peso_nominal_g: 250, precio_venta: 2500, dias_vencimiento: 30, precio_frigorifico: 95.0 },
    { id_producto: 3, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 250g', peso_nominal_g: 250, precio_venta: 2500, dias_vencimiento: 25, precio_frigorifico: 98.0 },
    { id_producto: 4, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 500g', peso_nominal_g: 500, precio_venta: 5000, dias_vencimiento: 25, precio_frigorifico: 98.0 },
    { id_producto: 5, nombre_producto: 'costilla cerdo', descripcion_producto: 'costilla cerdo 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 25, precio_frigorifico: 98.0 },
    { id_producto: 6, nombre_producto: 'panceta', descripcion_producto: 'panceta 1000g', peso_nominal_g: 1000, precio_venta: 10000, dias_vencimiento: 40, precio_frigorifico: 95.0 },
    { id_producto: 7, nombre_producto: 'chorizo', descripcion_producto: 'de cerdo *3', peso_nominal_g: 300, precio_venta: 9000, dias_vencimiento: 20, precio_frigorifico: 95.0 },
    { id_producto: 8, nombre_producto: 'chorizo', descripcion_producto: 'de cerdo *7', peso_nominal_g: 700, precio_venta: 19000, dias_vencimiento: 20, precio_frigorifico: 95.0 },
  ];

  for (const producto of productos) {
    await prisma.pRODUCTOS.upsert({
      where: { id_producto: producto.id_producto },
      update: {},
      create: producto,
    });
  }
  console.log('✅ Productos creados');
  
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
 
 
  // 17. TIPO_TRANSACCION
  console.log('💰 Creando tipos de transacción...');
  const tiposTransaccion = [
    { id_tipo: 1, nombre_codigo: 'venta', descripcion_amigable: 'Venta de empaque a tienda' },
    { id_tipo: 2, nombre_codigo: 'costo_frigorifico', descripcion_amigable: 'Deuda de logística con frigorífico' },
    { id_tipo: 3, nombre_codigo: 'ticket_consolidado', descripcion_amigable: 'Ticket de cobro a tienda' },
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

  // 19. LISTA_DE_REPRODUCCION
  console.log('📋 Creando listas de reproducción...');
  const listasReproduccion = [
    { id_lista_reproduccion: 1, nombre: 'LISTA DIARIA' },
  ];

  for (const lista of listasReproduccion) {
    await prisma.lISTA_DE_REPRODUCCION.upsert({
      where: { id_lista_reproduccion: lista.id_lista_reproduccion },
      update: {},
      create: lista,
    });
  }
  console.log('✅ Listas de reproducción creadas');

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