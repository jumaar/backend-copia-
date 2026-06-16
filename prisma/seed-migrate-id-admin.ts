import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Iniciando migración de id_admin ===\n');

  // ─────────────────────────────────────────────────────────────────
  // FASE 1: Marcar Super Admin (id_usuario=1) con id_admin=0
  // ─────────────────────────────────────────────────────────────────
  console.log('FASE 1: Marcando Super Admin (id=1) → id_admin=0');
  await prisma.uSUARIOS.update({
    where: { id_usuario: 1 },
    data: { id_admin: 0 },
  });
  console.log('  ✓ Super Admin marcado\n');

  // ─────────────────────────────────────────────────────────────────
  // FASE 2: Resolver id_admin para cada usuario (excepto id=1)
  // ─────────────────────────────────────────────────────────────────
  console.log('FASE 2: Resolviendo id_admin para usuarios');
  const usuarios = await prisma.uSUARIOS.findMany({
    where: { id_usuario: { not: 1 } },
    select: { id_usuario: true, id_rol: true },
  });

  let procesados = 0;
  let errores = 0;

  for (const user of usuarios) {
    if (user.id_rol === 1) {
      await prisma.uSUARIOS.update({
        where: { id_usuario: user.id_usuario },
        data: { id_admin: 0 },
      });
      procesados++;
      continue;
    }

    // Caminar hacia arriba por TOKEN_REGISTRO hasta encontrar Admin (rol 2)
    let currentId = user.id_usuario;
    let adminId: number | null = null;
    const visited = new Set<number>();
    const maxDepth = 10;

    for (let depth = 0; depth < maxDepth; depth++) {
      if (visited.has(currentId)) {
        console.log(`  ✗ Bucle detectado para usuario ${user.id_usuario}`);
        break;
      }
      visited.add(currentId);

      const token = await prisma.tOKEN_REGISTRO.findFirst({
        where: { id_usuario_nuevo: currentId },
        select: { id_usuario_creador: true },
      });

      if (!token) {
        console.log(`  ✗ Usuario ${user.id_usuario}: sin token de creación (huérfano)`);
        errores++;
        break;
      }

      const creator = await prisma.uSUARIOS.findUnique({
        where: { id_usuario: token.id_usuario_creador },
        select: { id_usuario: true, id_rol: true },
      });

      if (!creator) {
        console.log(`  ✗ Usuario ${user.id_usuario}: creador ${token.id_usuario_creador} no encontrado`);
        errores++;
        break;
      }

      if (creator.id_rol === 2) {
        adminId = creator.id_usuario;
        break;
      }

      if (creator.id_rol === 1) {
        adminId = 1;
        break;
      }

      currentId = creator.id_usuario;
    }

    if (adminId !== null) {
      await prisma.uSUARIOS.update({
        where: { id_usuario: user.id_usuario },
        data: { id_admin: adminId },
      });
      procesados++;
    } else {
      console.log(`  ✗ Usuario ${user.id_usuario}: no se pudo resolver admin`);
      errores++;
    }
  }

  console.log(`  ✓ ${procesados} usuarios procesados, ${errores} errores\n`);

  // ─────────────────────────────────────────────────────────────────
  // FASE 3: Propagar id_admin a tablas hijas vía SQL
  // ─────────────────────────────────────────────────────────────────
  console.log('FASE 3: Propagando id_admin a tablas hijas');

  // 3a. TIENDAS: copiar id_admin del usuario dueño
  await prisma.$executeRawUnsafe(`
    UPDATE "TIENDAS" t
    SET "id_admin" = u."id_admin"
    FROM "USUARIOS" u
    WHERE t."id_usuario" = u."id_usuario"
  `);
  console.log('  ✓ TIENDAS');

  // 3b. FRIGORIFICO
  await prisma.$executeRawUnsafe(`
    UPDATE "FRIGORIFICO" f
    SET "id_admin" = u."id_admin"
    FROM "USUARIOS" u
    WHERE f."id_usuario" = u."id_usuario"
  `);
  console.log('  ✓ FRIGORIFICO');

  // 3c. LOGISTICA
  await prisma.$executeRawUnsafe(`
    UPDATE "LOGISTICA" l
    SET "id_admin" = u."id_admin"
    FROM "USUARIOS" u
    WHERE l."id_usuario" = u."id_usuario"
  `);
  console.log('  ✓ LOGISTICA');

  // 3d. NEVERAS: a través de TIENDAS
  await prisma.$executeRawUnsafe(`
    UPDATE "NEVERAS" n
    SET "id_admin" = t."id_admin"
    FROM "TIENDAS" t
    WHERE n."id_tienda" = t."id_tienda"
  `);
  console.log('  ✓ NEVERAS');

  // 3e. ESTACIONES: a través de FRIGORIFICO
  await prisma.$executeRawUnsafe(`
    UPDATE "ESTACIONES" e
    SET "id_admin" = f."id_admin"
    FROM "FRIGORIFICO" f
    WHERE e."id_frigorifico" = f."id_frigorifico"
  `);
  console.log('  ✓ ESTACIONES');

  // 3f. EMPAQUES: prioridad nevera > logistica > estacion
  await prisma.$executeRawUnsafe(`
    UPDATE "EMPAQUES" e
    SET "id_admin" = COALESCE(
      (SELECT n."id_admin" FROM "NEVERAS" n WHERE n."id_nevera" = e."id_nevera"),
      (SELECT l."id_admin" FROM "LOGISTICA" l WHERE l."id_logistica" = e."id_logistica"),
      (SELECT es."id_admin" FROM "ESTACIONES" es WHERE es."id_estacion" = e."id_estacion")
    )
  `);
  console.log('  ✓ EMPAQUES');

  // 3g. TRANSACCIONES: a través del usuario dueño
  await prisma.$executeRawUnsafe(`
    UPDATE "TRANSACCIONES" tx
    SET "id_admin" = u."id_admin"
    FROM "USUARIOS" u
    WHERE tx."id_usuario" = u."id_usuario"
  `);
  console.log('  ✓ TRANSACCIONES');

  // 3h. REPORTE_ESTADO_NEVERAS: a través de NEVERAS
  await prisma.$executeRawUnsafe(`
    UPDATE "REPORTE_ESTADO_NEVERAS" r
    SET "id_admin" = n."id_admin"
    FROM "NEVERAS" n
    WHERE r."id_nevera" = n."id_nevera"
  `);
  console.log('  ✓ REPORTE_ESTADO_NEVERAS');

  // 3i. STOCK_NEVERA: a través de NEVERAS
  await prisma.$executeRawUnsafe(`
    UPDATE "STOCK_NEVERA" s
    SET "id_admin" = n."id_admin"
    FROM "NEVERAS" n
    WHERE s."id_nevera" = n."id_nevera"
  `);
  console.log('  ✓ STOCK_NEVERA');

  // ─────────────────────────────────────────────────────────────────
  // FASE 4: Tablas sin FK a usuario → id_admin = 1
  // ─────────────────────────────────────────────────────────────────
  console.log('FASE 4: Asignando id_admin=1 a tablas maestras');

  await prisma.$executeRawUnsafe(`
    UPDATE "PRODUCTOS" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ PRODUCTOS → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "PROMOCIONES" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ PROMOCIONES → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "DEPARTAMENTO" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ DEPARTAMENTO → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "CIUDAD" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ CIUDAD → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "BIBLIOTECA" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ BIBLIOTECA → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "LISTA_DE_REPRODUCCION" SET "id_admin" = 1 WHERE "id_admin" IS NULL
  `);
  console.log('  ✓ LISTA_DE_REPRODUCCION → id_admin=1');

  await prisma.$executeRawUnsafe(`
    UPDATE "ITEMS_DE_REPRODUCCION" i
    SET "id_admin" = COALESCE(
      (SELECT l."id_admin" FROM "LISTA_DE_REPRODUCCION" l WHERE l."id_lista_reproduccion" = i."id_lista_reproduccion"),
      1
    )
    WHERE i."id_admin" IS NULL
  `);
  console.log('  ✓ ITEMS_DE_REPRODUCCION → id_admin=1\n');

  // ─────────────────────────────────────────────────────────────────
  // VERIFICACIÓN FINAL
  // ─────────────────────────────────────────────────────────────────
  console.log('=== Verificación ===');
  const nulls = await prisma.$queryRawUnsafe<{ tabla: string; nulos: bigint }[]>(`
    SELECT 'USUARIOS' AS tabla, COUNT(*) AS nulos FROM "USUARIOS" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'TRANSACCIONES', COUNT(*) FROM "TRANSACCIONES" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'TIENDAS', COUNT(*) FROM "TIENDAS" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'FRIGORIFICO', COUNT(*) FROM "FRIGORIFICO" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'LOGISTICA', COUNT(*) FROM "LOGISTICA" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'NEVERAS', COUNT(*) FROM "NEVERAS" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'EMPAQUES', COUNT(*) FROM "EMPAQUES" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'ESTACIONES', COUNT(*) FROM "ESTACIONES" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'PRODUCTOS', COUNT(*) FROM "PRODUCTOS" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'PROMOCIONES', COUNT(*) FROM "PROMOCIONES" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'DEPARTAMENTO', COUNT(*) FROM "DEPARTAMENTO" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'CIUDAD', COUNT(*) FROM "CIUDAD" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'REPORTE_ESTADO_NEVERAS', COUNT(*) FROM "REPORTE_ESTADO_NEVERAS" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'STOCK_NEVERA', COUNT(*) FROM "STOCK_NEVERA" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'BIBLIOTECA', COUNT(*) FROM "BIBLIOTECA" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'LISTA_DE_REPRODUCCION', COUNT(*) FROM "LISTA_DE_REPRODUCCION" WHERE "id_admin" IS NULL
    UNION ALL SELECT 'ITEMS_DE_REPRODUCCION', COUNT(*) FROM "ITEMS_DE_REPRODUCCION" WHERE "id_admin" IS NULL
  `);

  let totalNulos = 0;
  for (const row of nulls) {
    if (Number(row.nulos) > 0) {
      console.log(`  ⚠ ${row.tabla}: ${row.nulos} NULLs restantes`);
      totalNulos += Number(row.nulos);
    }
  }

  if (totalNulos === 0) {
    console.log('  ✅ Ningún NULL restante. Migración exitosa.');
  } else {
    console.log(`  ⚠ ${totalNulos} NULLs totales. Revisar antes del Paso 3.`);
  }

  console.log('\n=== Migración de id_admin completada ===');
}

main()
  .catch((e) => {
    console.error('Error en migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
