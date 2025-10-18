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

  // 2. USUARIOS
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
    {
      id_usuario: 2,
      nombre_usuario: 'evaristo',
      apellido_usuario: 'evaristo',
      identificacion_usuario: '1322624162',
      celular: 3214568799,
      email: 'hhhhh@mail.com',
      contraseña: hashedPassword,
      activo: true,
      id_rol: 3,
    },
    {
      id_usuario: 3,
      nombre_usuario: 'hoffman',
      apellido_usuario: 'hoffman',
      identificacion_usuario: '3244654665',
      celular: 3214565674,
      email: 'ggggg@mail.com',
      contraseña: hashedPassword,
      activo: true,
      id_rol: 2,
    },
    {
      id_usuario: 4,
      nombre_usuario: 'emanuel',
      apellido_usuario: 'emanuel',
      identificacion_usuario: '6546246546',
      celular: 3214568793,
      email: 'sssss@mail.com',
      contraseña: hashedPassword,
      activo: true,
      id_rol: 4,
    },
    {
      id_usuario: 5,
      nombre_usuario: 'oscar',
      apellido_usuario: 'oscar',
      identificacion_usuario: '8979466320',
      celular: 3214568791,
      email: 'zzzzz@mail.com',
      contraseña: hashedPassword,
      activo: true,
      id_rol: 5,
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

  // 3. DEPARTAMENTO
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

  // 4. CIUDAD
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

  // 5. ESTADO_LOTE
  console.log('📦 Creando estados de lote...');
  const estadosLote = [
    { estado_lote: 1, nombre_estado: 'EN FRIGORIFICO' },
    { estado_lote: 2, nombre_estado: 'EN LOGISTICA' },
    { estado_lote: 3, nombre_estado: 'EN NEVERA' },
    { estado_lote: 4, nombre_estado: 'PENDIENTE PAGO' },
    { estado_lote: 5, nombre_estado: 'PARA CAMBIO' },
    { estado_lote: 6, nombre_estado: 'EN LOGISTICA PRIORIDAD' },
    { estado_lote: 7, nombre_estado: 'VENCIDO/PERDIDA' },
    { estado_lote: 8, nombre_estado: 'FINALIZADO CON EXITO' },
  ];

  for (const estado of estadosLote) {
    await prisma.eSTADO_LOTE.upsert({
      where: { estado_lote: estado.estado_lote },
      update: {},
      create: estado,
    });
  }
  console.log('✅ Estados de lote creados');

  // 6. TIPO_TRANSACCION
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

  // 7. ESTADO_TRANSACCION
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

  // 8. PROMOCIONES
  console.log('🎉 Creando promociones...');
  const promociones = [
    { id_promocion: 1, nombre: '20% Descuento', tipo: 'PORCENTAJE', valor: 20.0, condiciones: {}, activo: true },
    { id_promocion: 2, nombre: '2x1 (50% en 2da unidad)', tipo: 'BOGOF', valor: 50.0, condiciones: {}, activo: true },
    { id_promocion: 3, nombre: '50% Descuento', tipo: 'PORCENTAJE', valor: 50.0, condiciones: {}, activo: true },
    { id_promocion: 4, nombre: 'Liquidación Total', tipo: 'PORCENTAJE', valor: 80.0, condiciones: {}, activo: true },
  ];

  for (const promocion of promociones) {
    await prisma.pROMOCIONES.upsert({
      where: { id_promocion: promocion.id_promocion },
      update: {},
      create: promocion,
    });
  }
  console.log('✅ Promociones creadas');

  // 9. PRODUCTOS
  console.log('📦 Creando productos...');
  const productos = [
    { id_producto: 1, nombre_producto: 'lomo cerdo', descripcion: 'lomo cerdo', precio_venta_por_gramo_actual: 10000, precio_costo_por_gramo_actual: 9500 },
    { id_producto: 2, nombre_producto: 'lomo cerdo', descripcion: 'lomo cerdo', precio_venta_por_gramo_actual: 2500, precio_costo_por_gramo_actual: 2375 },
    { id_producto: 3, nombre_producto: 'costilla cerdo', descripcion: 'costilla cerdo', precio_venta_por_gramo_actual: 2500, precio_costo_por_gramo_actual: 2450 },
    { id_producto: 4, nombre_producto: 'costilla cerdo', descripcion: 'costilla cerdo', precio_venta_por_gramo_actual: 5000, precio_costo_por_gramo_actual: 4900 },
    { id_producto: 5, nombre_producto: 'costilla cerdo', descripcion: 'costilla cerdo', precio_venta_por_gramo_actual: 10000, precio_costo_por_gramo_actual: 9800 },
    { id_producto: 6, nombre_producto: 'panceta', descripcion: 'panceta', precio_venta_por_gramo_actual: 10000, precio_costo_por_gramo_actual: 9500 },
    { id_producto: 7, nombre_producto: 'chorizo', descripcion: 'de cerdo *3', precio_venta_por_gramo_actual: 9000, precio_costo_por_gramo_actual: 8550 },
    { id_producto: 8, nombre_producto: 'chorizo', descripcion: 'de cerdo *7', precio_venta_por_gramo_actual: 19000, precio_costo_por_gramo_actual: 18050 },
  ];

  for (const producto of productos) {
    await prisma.pRODUCTOS.upsert({
      where: { id_producto: producto.id_producto },
      update: {},
      create: producto,
    });
  }
  console.log('✅ Productos creados');

  // 10. TIENDAS
  console.log('🏪 Creando tiendas...');
  const tiendas = [
    { id_tienda: 1, id_usuario: 1, nombre_tienda: 'tienda el tesoro', direccion: 'calle 24 15 59', id_ciudad: 1 },
    { id_tienda: 2, id_usuario: 2, nombre_tienda: 'tienda las delicias', direccion: 'cra 356 23', id_ciudad: 1 },
    { id_tienda: 3, id_usuario: 3, nombre_tienda: 'el bolivar', direccion: 'cll 34 56', id_ciudad: 1 },
  ];

  for (const tienda of tiendas) {
    await prisma.tIENDAS.upsert({
      where: { id_tienda: tienda.id_tienda },
      update: {},
      create: tienda,
    });
  }
  console.log('✅ Tiendas creadas');

  // 11. ESTADO_NEVERA
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

  // 12. NEVERAS
  console.log('🧊 Creando neveras...');
  const neveras = [
    { fridge_id: 1, contraseña: '21621234"#$#$4234234', id_estado_nevera: 2, id_tienda: 1, version_software: 0.3, ultima_conexion: new Date('2025-01-01T00:00:00Z') },
    { fridge_id: 2, contraseña: '21621234"#$#$4234234', id_estado_nevera: 4, id_tienda: 1, version_software: 0.3, ultima_conexion: new Date('2025-01-01T00:00:00Z') },
    { fridge_id: 3, contraseña: '21621234"#$#$4234234', id_estado_nevera: 1, id_tienda: 2, version_software: 0.3, ultima_conexion: new Date('2025-01-01T00:00:00Z') },
  ];

  for (const nevera of neveras) {
    await prisma.nEVERAS.upsert({
      where: { fridge_id: nevera.fridge_id },
      update: {},
      create: nevera,
    });
  }
  console.log('✅ Neveras creadas');

  // 13. FRIGORIFICO
  console.log('🏭 Creando frigoríficos...');
  const frigorificos = [
    { id_frigorifico: 1, id_usuario: 1, nombre_frigorifico: 'tienda el tesoro', direccion: 'calle 24 15 59' },
    { id_frigorifico: 2, id_usuario: 2, nombre_frigorifico: 'tienda las delicias', direccion: 'cra 356 23' },
    { id_frigorifico: 3, id_usuario: 3, nombre_frigorifico: 'el bolivar', direccion: 'cll 34 56' },
  ];

  for (const frigorifico of frigorificos) {
    await prisma.fRIGORIFICO.upsert({
      where: { id_frigorifico: frigorifico.id_frigorifico },
      update: {},
      create: frigorifico,
    });
  }
  console.log('✅ Frigoríficos creados');

  // 14. LOGISTICA
  console.log('🚚 Creando logística...');
  const logisticas = [
    { id_logistica: 1, id_usuario: 4, nombre_empresa: 'Rapido y Furioso', placa_vehiculo: 'XYZ123' },
  ];

  for (const logistica of logisticas) {
    await prisma.lOGISTICA.upsert({
      where: { id_logistica: logistica.id_logistica },
      update: {},
      create: logistica,
    });
  }
  console.log('✅ Logística creada');

  // 15. EMPAQUES
  console.log('📦 Creando empaques...');
  const empaques = [
    {
      id_empaque: 1,
      EPC_id: '300833B2DDD9014000000000',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 1,
      peso_exacto: 1.0,
      costo_frigorifico_congelado: 10300,
      precio_venta_congelado: 10300,
      fecha_vencimiento: new Date('2025-09-17'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: new Date('2025-01-01T00:00:00Z'),
      hora_para_cambio_5: new Date('2025-01-01T00:00:00Z'),
      fridge_id_final: 5,
      hora_surtido_final_6: new Date('2025-01-01T00:00:00Z'),
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 3,
      promocion: null,
    },
    {
      id_empaque: 2,
      EPC_id: '300833B2DDD9014000000001',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 2,
      peso_exacto: 0.25,
      costo_frigorifico_congelado: 2490,
      precio_venta_congelado: 2490,
      fecha_vencimiento: new Date('2025-09-17'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: new Date('2025-01-01T00:00:00Z'),
      hora_para_cambio_5: null,
      fridge_id_final: null,
      hora_surtido_final_6: null,
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 1,
      promocion: null,
    },
    {
      id_empaque: 3,
      EPC_id: '300833B2DDD9014000000002',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 3,
      peso_exacto: 0.25,
      costo_frigorifico_congelado: 5200,
      precio_venta_congelado: 5200,
      fecha_vencimiento: new Date('2025-09-18'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: null,
      hora_para_cambio_5: new Date('2025-01-01T00:00:00Z'),
      fridge_id_final: 4,
      hora_surtido_final_6: new Date('2025-01-01T00:00:00Z'),
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 1,
      promocion: null,
    },
    {
      id_empaque: 4,
      EPC_id: '300833B2DDD9014000000003',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 4,
      peso_exacto: 0.5,
      costo_frigorifico_congelado: 6300,
      precio_venta_congelado: 6300,
      fecha_vencimiento: new Date('2025-09-18'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: null,
      hora_para_cambio_5: null,
      fridge_id_final: null,
      hora_surtido_final_6: null,
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 2,
      promocion: null,
    },
    {
      id_empaque: 5,
      EPC_id: '300833B2DDD9014000000004',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 4,
      peso_exacto: 1.0,
      costo_frigorifico_congelado: 7500,
      precio_venta_congelado: 7500,
      fecha_vencimiento: new Date('2025-09-19'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: null,
      hora_para_cambio_5: null,
      fridge_id_final: null,
      hora_surtido_final_6: null,
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 2,
      promocion: 1,
    },
    {
      id_empaque: 6,
      EPC_id: '300833B2DDD9014000000005',
      fecha_empaque_1: new Date('2025-01-01T00:00:00Z'),
      id_frigorifico: 1,
      id_producto: 5,
      peso_exacto: 1.0,
      costo_frigorifico_congelado: 654,
      precio_venta_congelado: 654,
      fecha_vencimiento: new Date('2025-09-19'),
      hora_en_logistica_2: new Date('2025-01-01T00:00:00Z'),
      id_logistica: 1,
      fridge_id: 1,
      hora_en_nevera_3: new Date('2025-01-01T00:00:00Z'),
      hora_pendiente_pago_4: null,
      hora_para_cambio_5: null,
      fridge_id_final: null,
      hora_surtido_final_6: null,
      fecha_finalizacion_7_8: new Date('2025-01-01T00:00:00Z'),
      estado_lote: 5,
      promocion: 2,
    },
  ];

  for (const empaque of empaques) {
    await prisma.eMPAQUES.upsert({
      where: { EPC_id: empaque.EPC_id },
      update: {},
      create: empaque,
    });
  }
  console.log('✅ Empaques creados');

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