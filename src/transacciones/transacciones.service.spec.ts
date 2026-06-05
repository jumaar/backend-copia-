import { Test, TestingModule } from '@nestjs/testing';
import { TransaccionesService } from './transacciones.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

/**
 * =========================================================================
 *  PRUEBAS DE COMPORTAMIENTO — TransaccionesService
 *  =========================================================================
 *
 *  Demuestra los 4 casos de consolidación con 3 escenarios cada uno:
 *    A) Pago EXACTO (montoPagado === montoConsolidado)
 *    B) SOBREPAGO (montoPagado > montoConsolidado)
 *    C) SUBPAGO  (montoPagado < montoConsolidado)
 *
 *  CASOS:
 *    1. Logística paga a Frigorífico — consolidarCuentas
 *    2. Tienda paga a Logística      — liquidarNevera CASO B
 *    3. Logística paga a Admin       — consolidarAdmin (consolidacion)
 *    4. Admin paga a Logística       — transferenciaDirecta (ingreso)
 */

// ─── Constantes del dominio ───
const TIPO_VENTA = 1;
const TIPO_COSTO_FRIGORIFICO = 2;
const TIPO_TICKET_CONSOLIDADO = 3;
const TIPO_DINERO_RECIBIDO = 4;
const TIPO_DINERO_ENTREGADO = 5;

const ESTADO_PENDIENTE = 1;
const ESTADO_PAGADO = 2;
const ESTADO_CONSOLIDADO = 4;

const ID_FRIGORIFICO = 100;
const ID_LOGISTICA = 200;
const ID_TIENDA = 300;
const ID_ADMIN = 400;
const ID_NEVERA = 10;

describe('TransaccionesService — Consolidación Canónica', () => {
  let service: TransaccionesService;
  let db: any;
  let mockTx: any;
  let transaccionesCreadas: any[];
  let transaccionesActualizadas: any[];
  let nextId: number;

  beforeEach(async () => {
    nextId = 5000;
    transaccionesCreadas = [];
    transaccionesActualizadas = [];

    mockTx = {
      tRANSACCIONES: {
        create: jest.fn().mockImplementation((args: any) => {
          const id = nextId++;
          const record = { id_transaccion: id, ...args.data };
          transaccionesCreadas.push({ via: 'tx', ...record });
          return record;
        }),
        updateMany: jest.fn().mockImplementation((args: any) => {
          transaccionesActualizadas.push(args);
          return { count: args.where?.id_transaccion?.in?.length || 0 };
        }),
        update: jest.fn().mockImplementation((args: any) => {
          transaccionesActualizadas.push({ via: 'tx.update', ...args });
          return args.data;
        }),
      },
    };

    db = {
      tRANSACCIONES: {
        create: jest.fn().mockImplementation((args: any) => {
          const id = nextId++;
          const record = { id_transaccion: id, ...args.data };
          transaccionesCreadas.push({ via: 'db', ...record });
          return record;
        }),
        updateMany: jest.fn().mockImplementation((args: any) => {
          transaccionesActualizadas.push(args);
          return { count: args.where?.id_transaccion?.in?.length || 0 };
        }),
        update: jest.fn().mockImplementation((args: any) => {
          transaccionesActualizadas.push({ via: 'db.update', ...args });
          return args.data;
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransaccionesService,
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();

    service = module.get<TransaccionesService>(TransaccionesService);
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════

  function setupPendientes(pendientes: { id: number; monto: number }[]) {
    db.tRANSACCIONES.findMany.mockResolvedValue(
      pendientes.map((p) => ({
        id_transaccion: p.id,
        monto: { toString: () => String(p.monto) },
      })),
    );
  }

  function logResultado(
    caso: string,
    escenario: string,
    params: any,
    result: any,
  ) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📋 CASO: ${caso}`);
    console.log(`🎯 ESCENARIO: ${escenario}`);
    console.log(`${'─'.repeat(70)}`);
    console.log('📥 PARAMS:', JSON.stringify(params, null, 2));
    console.log('📤 RESULT:', JSON.stringify(result, null, 2));
    console.log('\n📝 TRANSACCIONES CREADAS:');
    transaccionesCreadas.forEach((t, i) => {
      const tipoNombre =
        t.id_tipo_transaccion === 1
          ? 'venta'
          : t.id_tipo_transaccion === 2
            ? 'costo_frigorifico'
            : t.id_tipo_transaccion === 3
              ? 'TICKET_CONSOLIDADO'
              : t.id_tipo_transaccion === 4
                ? 'dinero_recibido'
                : t.id_tipo_transaccion === 5
                  ? 'dinero_entregado'
                  : `tipo_${t.id_tipo_transaccion}`;
      const estadoNombre =
        t.estado_transaccion === 1
          ? 'PENDIENTE'
          : t.estado_transaccion === 2
            ? 'PAGADO'
            : t.estado_transaccion === 4
              ? 'CONSOLIDADO'
              : `estado_${t.estado_transaccion}`;

      console.log(
        `  [${i + 1}] id=${t.id_transaccion} | user=${t.id_usuario} | tipo=${tipoNombre} | monto=${t.monto} | estado=${estadoNombre} | rel=${t.id_transaccion_rel ?? 'null'} | nota="${t.nota_opcional ?? ''}"`,
      );
    });
    console.log('\n🔄 PENDIENTES MARCADAS COMO PAGADAS:');
    transaccionesActualizadas.forEach((u) => {
      console.log(`  ids=${u.where?.id_transaccion?.in} → estado=2, rel=${u.data?.id_transaccion_rel}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CASO 1: Logística paga a Frigorífico — consolidarCuentas
  //  ═══════════════════════════════════════════

  describe('CASO 1: Logística (200) paga a Frigorífico (100)', () => {
    beforeEach(() => {
      transaccionesCreadas = [];
      transaccionesActualizadas = [];
    });

    it('1A — PAGO EXACTO: consolidado=$1000, pagado=$1000', async () => {
      setupPendientes([
        { id: 10, monto: 400 },
        { id: 11, monto: 350 },
        { id: 12, monto: 250 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [10, 11, 12],
        montoPagado: 1000,
        idUsuarioTicket: ID_FRIGORIFICO,
        idUsuarioPagador: ID_LOGISTICA,
        notaOpcional: 'Monto abonado: 1000',
      });

      logResultado(
        'Caso 1: L→F',
        'PAGO EXACTO ($1000 = $1000)',
        {
          idsPendientes: [10, 11, 12],
          montoPagado: 1000,
          idUsuarioTicket: ID_FRIGORIFICO,
          idUsuarioPagador: ID_LOGISTICA,
        },
        result,
      );

      expect(result.pendientesProcesadas).toBe(3);
      expect(result.montoConsolidado).toBe(1000);
      expect(result.montoPagado).toBe(1000);
      expect(result.saldo).toBeUndefined();
      expect(result.idPagoPagador).toBeDefined();
      expect(result.idPagoReceptor).toBeUndefined();

      // Verifica: ticket tipo 3 para frigorífico con monto negativo
      const ticket = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 3,
      );
      expect(ticket).toBeDefined();
      expect(ticket.id_usuario).toBe(ID_FRIGORIFICO);
      expect(ticket.monto).toBe(-1000);
      expect(ticket.estado_transaccion).toBe(ESTADO_CONSOLIDADO);

      // Verifica: pago tipo 5 para logística con monto negativo
      const pago = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_LOGISTICA &&
          t.id_tipo_transaccion === TIPO_DINERO_ENTREGADO,
      );
      expect(pago).toBeDefined();
      expect(pago.monto).toBe(-1000);
      expect(pago.estado_transaccion).toBe(ESTADO_PENDIENTE);

      // Verifica: NO hay saldo
      const saldos = transaccionesCreadas.filter(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldos.length).toBe(0);

      // Verifica: 3 pendientes marcadas como pagadas
      expect(transaccionesActualizadas.length).toBe(1);
      expect(transaccionesActualizadas[0].where.id_transaccion.in).toEqual([
        10, 11, 12,
      ]);
    });

    it('1B — SOBREPAGO: consolidado=$1000, pagado=$1200', async () => {
      setupPendientes([
        { id: 10, monto: 400 },
        { id: 11, monto: 350 },
        { id: 12, monto: 250 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [10, 11, 12],
        montoPagado: 1200,
        idUsuarioTicket: ID_FRIGORIFICO,
        idUsuarioPagador: ID_LOGISTICA,
        notaOpcional: 'Monto abonado: 1200',
      });

      logResultado(
        'Caso 1: L→F',
        'SOBREPAGO ($1200 > $1000)',
        {
          idsPendientes: [10, 11, 12],
          montoPagado: 1200,
          idUsuarioTicket: ID_FRIGORIFICO,
          idUsuarioPagador: ID_LOGISTICA,
        },
        result,
      );

      expect(result.montoConsolidado).toBe(1000);
      expect(result.montoPagado).toBe(1200);
      expect(result.saldo).toBeDefined();
      expect(result.saldo!.monto).toBe(-200); // negativo = crédito a favor
      expect(result.saldo!.esSaldoAFavor).toBe(true);

      // Verifica: saldo tipo 2 para frigorífico con monto negativo (crédito)
      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo).toBeDefined();
      expect(saldo.id_usuario).toBe(ID_FRIGORIFICO);
      expect(saldo.monto).toBe(-200);
      expect(saldo.estado_transaccion).toBe(ESTADO_PENDIENTE);
    });

    it('1C — SUBPAGO: consolidado=$1000, pagado=$800', async () => {
      setupPendientes([
        { id: 10, monto: 400 },
        { id: 11, monto: 350 },
        { id: 12, monto: 250 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [10, 11, 12],
        montoPagado: 800,
        idUsuarioTicket: ID_FRIGORIFICO,
        idUsuarioPagador: ID_LOGISTICA,
        notaOpcional: 'Monto abonado: 800',
      });

      logResultado(
        'Caso 1: L→F',
        'SUBPAGO ($800 < $1000)',
        {
          idsPendientes: [10, 11, 12],
          montoPagado: 800,
          idUsuarioTicket: ID_FRIGORIFICO,
          idUsuarioPagador: ID_LOGISTICA,
        },
        result,
      );

      expect(result.montoConsolidado).toBe(1000);
      expect(result.montoPagado).toBe(800);
      expect(result.saldo).toBeDefined();
      expect(result.saldo!.monto).toBe(200); // positivo = deuda restante
      expect(result.saldo!.esSaldoAFavor).toBe(false);

      // Verifica: saldo tipo 2 para frigorífico con monto positivo (deuda)
      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo).toBeDefined();
      expect(saldo.id_usuario).toBe(ID_FRIGORIFICO);
      expect(saldo.monto).toBe(200);
      expect(saldo.estado_transaccion).toBe(ESTADO_PENDIENTE);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CASO 2: Tienda paga a Logística — liquidarNevera CASO B
  //  ═══════════════════════════════════════════════════════════════════════

  describe('CASO 2: Tienda (300) paga a Logística (200)', () => {
    beforeEach(() => {
      transaccionesCreadas = [];
      transaccionesActualizadas = [];
    });

    it('2A — PAGO EXACTO: consolidado=$500, pagado=$500', async () => {
      setupPendientes([
        { id: 20, monto: 300 },
        { id: 21, monto: 200 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [20, 21],
        montoPagado: 500,
        idUsuarioTicket: ID_TIENDA,
        idUsuarioReceptor: ID_LOGISTICA,
        notaOpcional: 'Cobrado por: Logistica | #NEVERA:10',
        idNevera: ID_NEVERA,
      });

      logResultado(
        'Caso 2: T→L',
        'PAGO EXACTO ($500 = $500)',
        {
          idsPendientes: [20, 21],
          montoPagado: 500,
          idUsuarioTicket: ID_TIENDA,
          idUsuarioReceptor: ID_LOGISTICA,
          idNevera: ID_NEVERA,
        },
        result,
      );

      expect(result.montoConsolidado).toBe(500);
      expect(result.saldo).toBeUndefined();

      // Ticket para tienda
      const ticket = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 3,
      );
      expect(ticket.id_usuario).toBe(ID_TIENDA);
      expect(ticket.monto).toBe(-500);
      expect(ticket.estado_transaccion).toBe(ESTADO_CONSOLIDADO);
      expect(ticket.id_nevera).toBe(ID_NEVERA);

      // Pago recibido por logística (tipo 4, +monto)
      const pago = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_LOGISTICA &&
          t.id_tipo_transaccion === TIPO_DINERO_RECIBIDO,
      );
      expect(pago).toBeDefined();
      expect(pago.monto).toBe(500);
      expect(pago.estado_transaccion).toBe(ESTADO_PENDIENTE);
      expect(pago.id_nevera).toBe(ID_NEVERA);
    });

    it('2B — SOBREPAGO: consolidado=$500, pagado=$700', async () => {
      setupPendientes([
        { id: 20, monto: 300 },
        { id: 21, monto: 200 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [20, 21],
        montoPagado: 700,
        idUsuarioTicket: ID_TIENDA,
        idUsuarioReceptor: ID_LOGISTICA,
        notaOpcional: 'Cobrado por: Logistica | #NEVERA:10',
        idNevera: ID_NEVERA,
      });

      logResultado(
        'Caso 2: T→L',
        'SOBREPAGO ($700 > $500)',
        {
          idsPendientes: [20, 21],
          montoPagado: 700,
          idUsuarioTicket: ID_TIENDA,
          idUsuarioReceptor: ID_LOGISTICA,
          idNevera: ID_NEVERA,
        },
        result,
      );

      expect(result.saldo).toBeDefined();
      expect(result.saldo!.monto).toBe(-200); // crédito a favor de la tienda
      expect(result.saldo!.esSaldoAFavor).toBe(true);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo.id_usuario).toBe(ID_TIENDA);
      expect(saldo.monto).toBe(-200);
      expect(saldo.estado_transaccion).toBe(ESTADO_PENDIENTE);
      expect(saldo.id_nevera).toBe(ID_NEVERA);
    });

    it('2C — SUBPAGO: consolidado=$500, pagado=$300', async () => {
      setupPendientes([
        { id: 20, monto: 300 },
        { id: 21, monto: 200 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [20, 21],
        montoPagado: 300,
        idUsuarioTicket: ID_TIENDA,
        idUsuarioReceptor: ID_LOGISTICA,
        notaOpcional: 'Cobrado por: Logistica | #NEVERA:10',
        idNevera: ID_NEVERA,
      });

      logResultado(
        'Caso 2: T→L',
        'SUBPAGO ($300 < $500)',
        {
          idsPendientes: [20, 21],
          montoPagado: 300,
          idUsuarioTicket: ID_TIENDA,
          idUsuarioReceptor: ID_LOGISTICA,
          idNevera: ID_NEVERA,
        },
        result,
      );

      expect(result.saldo!.monto).toBe(200); // deuda restante
      expect(result.saldo!.esSaldoAFavor).toBe(false);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo.id_usuario).toBe(ID_TIENDA);
      expect(saldo.monto).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CASO 3: Logística paga a Admin — consolidarAdmin (consolidacion)
  //  ═══════════════════════════════════════════════════════════════════════

  describe('CASO 3: Logística (200) paga a Admin (400)', () => {
    beforeEach(() => {
      transaccionesCreadas = [];
      transaccionesActualizadas = [];
    });

    it('3A — PAGO EXACTO: consolidado=$2000, pagado=$2000', async () => {
      setupPendientes([
        { id: 30, monto: 800 },
        { id: 31, monto: 700 },
        { id: 32, monto: 500 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [30, 31, 32],
        montoPagado: 2000,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN,
        idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
        notaOpcional: 'Consolidación logística',
      });

      logResultado(
        'Caso 3: L→A',
        'PAGO EXACTO ($2000 = $2000)',
        {
          idsPendientes: [30, 31, 32],
          montoPagado: 2000,
          idUsuarioTicket: ID_LOGISTICA,
          idUsuarioReceptor: ID_ADMIN,
          idUsuarioPagador: ID_LOGISTICA,
          mutualLink: true,
        },
        result,
      );

      expect(result.saldo).toBeUndefined();
      expect(result.pendientesProcesadas).toBe(3);

      // Ticket para logística
      const ticket = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 3,
      );
      expect(ticket.id_usuario).toBe(ID_LOGISTICA);
      expect(ticket.monto).toBe(-2000);

      // Admin recibe tipo 4
      const receptor = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_ADMIN &&
          t.id_tipo_transaccion === TIPO_DINERO_RECIBIDO,
      );
      expect(receptor).toBeDefined();
      expect(receptor.monto).toBe(2000);
      expect(receptor.estado_transaccion).toBe(ESTADO_PENDIENTE);

      // Logística paga tipo 5
      const pagador = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_LOGISTICA &&
          t.id_tipo_transaccion === TIPO_DINERO_ENTREGADO,
      );
      expect(pagador).toBeDefined();
      expect(pagador.monto).toBe(-2000);
      expect(pagador.estado_transaccion).toBe(ESTADO_PENDIENTE);
      // Pagador linked to receptor
      expect(pagador.id_transaccion_rel).toBe(receptor.id_transaccion);

      // Mutual link: receptor linked to pagador
      const receptorUpdate = transaccionesActualizadas.find(
        (u) => u.data?.id_transaccion_rel === pagador.id_transaccion,
      );
      expect(receptorUpdate).toBeDefined();
    });

    it('3B — SOBREPAGO: consolidado=$2000, pagado=$2500', async () => {
      setupPendientes([
        { id: 30, monto: 1000 },
        { id: 31, monto: 1000 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [30, 31],
        montoPagado: 2500,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN,
        idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
        notaOpcional: 'Consolidación logística - sobrepago',
      });

      logResultado(
        'Caso 3: L→A',
        'SOBREPAGO ($2500 > $2000)',
        {
          idsPendientes: [30, 31],
          montoPagado: 2500,
          idUsuarioTicket: ID_LOGISTICA,
          idUsuarioReceptor: ID_ADMIN,
          idUsuarioPagador: ID_LOGISTICA,
          mutualLink: true,
        },
        result,
      );

      expect(result.saldo).toBeDefined();
      expect(result.saldo!.monto).toBe(-500); // crédito a favor de logística
      expect(result.saldo!.esSaldoAFavor).toBe(true);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo.id_usuario).toBe(ID_LOGISTICA);
      expect(saldo.monto).toBe(-500);
    });

    it('3C — SUBPAGO: consolidado=$2000, pagado=$1500', async () => {
      setupPendientes([
        { id: 30, monto: 1000 },
        { id: 31, monto: 1000 },
      ]);

      const result = await service.consolidar({
        idsPendientes: [30, 31],
        montoPagado: 1500,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN,
        idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
        notaOpcional: 'Consolidación logística - subpago',
      });

      logResultado(
        'Caso 3: L→A',
        'SUBPAGO ($1500 < $2000)',
        {
          idsPendientes: [30, 31],
          montoPagado: 1500,
          idUsuarioTicket: ID_LOGISTICA,
          idUsuarioReceptor: ID_ADMIN,
          idUsuarioPagador: ID_LOGISTICA,
          mutualLink: true,
        },
        result,
      );

      expect(result.saldo).toBeDefined();
      expect(result.saldo!.monto).toBe(500); // deuda restante
      expect(result.saldo!.esSaldoAFavor).toBe(false);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.nota_opcional?.includes('Saldo'),
      );
      expect(saldo.id_usuario).toBe(ID_LOGISTICA);
      expect(saldo.monto).toBe(500);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CASO 4: Admin paga a Logística — transferenciaDirecta (ingreso)
  //  ═══════════════════════════════════════════════════════════════════════

  describe('CASO 4: Admin (400) paga a Logística (200) — Transferencia Directa', () => {
    beforeEach(() => {
      transaccionesCreadas = [];
      transaccionesActualizadas = [];
    });

    it('4 — TRANSFERENCIA DIRECTA: Admin entrega $3000 a Logística', async () => {
      const result = await service.transferenciaDirecta({
        idUsuarioPagador: ID_ADMIN,
        idUsuarioReceptor: ID_LOGISTICA,
        monto: 3000,
        notaOpcional: 'Ingreso del admin',
      });

      logResultado(
        'Caso 4: A→L',
        'TRANSFERENCIA DIRECTA ($3000)',
        {
          idUsuarioPagador: ID_ADMIN,
          idUsuarioReceptor: ID_LOGISTICA,
          monto: 3000,
          notaOpcional: 'Ingreso del admin',
        },
        result,
      );

      // Logística recibe tipo 4 (+monto)
      const receptor = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_LOGISTICA &&
          t.id_tipo_transaccion === TIPO_DINERO_RECIBIDO,
      );
      expect(receptor).toBeDefined();
      expect(receptor.monto).toBe(3000);
      expect(receptor.estado_transaccion).toBe(ESTADO_PENDIENTE);

      // Admin paga tipo 5 (-monto)
      const pagador = transaccionesCreadas.find(
        (t) =>
          t.id_usuario === ID_ADMIN &&
          t.id_tipo_transaccion === TIPO_DINERO_ENTREGADO,
      );
      expect(pagador).toBeDefined();
      expect(pagador.monto).toBe(-3000);
      expect(pagador.estado_transaccion).toBe(ESTADO_PENDIENTE);

      // Mutual link
      expect(pagador.id_transaccion_rel).toBe(receptor.id_transaccion);
      const receptorUpdate = transaccionesActualizadas.find(
        (u) => u.data?.id_transaccion_rel === pagador.id_transaccion,
      );
      expect(receptorUpdate).toBeDefined();
    });
  });
});
