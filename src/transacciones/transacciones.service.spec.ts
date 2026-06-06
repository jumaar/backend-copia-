import { Test, TestingModule } from '@nestjs/testing';
import { TransaccionesService } from './transacciones.service';
import { DatabaseService } from '../database/database.service';
import { BadRequestException } from '@nestjs/common';

/**
 * =========================================================================
 *  PRUEBAS DE COMPORTAMIENTO — TransaccionesService
 *  =========================================================================
 *
 *  Demuestra los 4 casos de consolidación con 3 escenarios:
 *    A) Pago EXACTO  B) SOBREPAGO  C) SUBPAGO
 *
 *  REGLA: Toda transacción en estado 1 (PENDIENTE) debe tener
 *         id_transaccion_rel apuntando a su contraparte.
 */

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

describe('TransaccionesService', () => {
  let service: TransaccionesService;
  let db: any;
  let mockTx: any;
  let transaccionesCreadas: any[];
  let nextId: number;

  beforeEach(async () => {
    nextId = 5000;
    transaccionesCreadas = [];

    mockTx = {
      tRANSACCIONES: {
        create: jest.fn().mockImplementation((args: any) => {
          const id = nextId++;
          const record = { id_transaccion: id, ...args.data };
          transaccionesCreadas.push(record);
          return record;
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation((args: any) => {
          const found = transaccionesCreadas.find(
            (t) => t.id_transaccion === args.where.id_transaccion,
          );
          if (found && args.data.id_transaccion_rel !== undefined) {
            found.id_transaccion_rel = args.data.id_transaccion_rel;
          }
          return args.data;
        }),
      },
    };

    db = {
      tRANSACCIONES: {
        create: jest.fn().mockImplementation((args: any) => {
          const id = nextId++;
          const record = { id_transaccion: id, ...args.data };
          transaccionesCreadas.push(record);
          return record;
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockImplementation((args: any) => {
          const found = transaccionesCreadas.find(
            (t) => t.id_transaccion === args.where.id_transaccion,
          );
          if (found && args.data.id_transaccion_rel !== undefined) {
            found.id_transaccion_rel = args.data.id_transaccion_rel;
          }
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

  function setupPendientes(pendientes: { id: number; monto: number }[]) {
    db.tRANSACCIONES.findMany.mockResolvedValue(
      pendientes.map((p) => ({ id_transaccion: p.id, monto: p.monto })),
    );
  }

  /** Busca una transacción creada por tipo y usuario */
  function findTx(tipo: number, userId: number) {
    return transaccionesCreadas.find(
      (t) => t.id_tipo_transaccion === tipo && t.id_usuario === userId,
    );
  }

  function log(label: string, result: any) {
    console.log(`\n─── ${label} ───`);
    console.log('📤', JSON.stringify(result, null, 2));
    transaccionesCreadas.forEach((t) => {
      const tipo = ['', 'venta', 'costo', 'TICKET', 'recibido', 'entregado'][t.id_tipo_transaccion];
      const estado = ['', 'PEND', 'PAGO', '', 'CONS'][t.estado_transaccion];
      console.log(
        `  tx#${t.id_transaccion} user=${t.id_usuario} ${tipo} $${t.monto} ${estado} rel=${t.id_transaccion_rel ?? '·'}`,
      );
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  CASO 1: L(200) paga a F(100) — solo idUsuarioPagador
  // ═══════════════════════════════════════════════════════════════
  describe('CASO 1: L→F', () => {
    beforeEach(() => { transaccionesCreadas = []; });

    it('1A PAGO EXACTO $1000 = $1000', async () => {
      setupPendientes([{ id: 10, monto: 1000 }]);
      const r = await service.consolidar({
        idsPendientes: [10], montoPagado: 1000,
        idUsuarioTicket: ID_FRIGORIFICO, idUsuarioPagador: ID_LOGISTICA,
      });
      log('1A EXACTO', r);

      const ticket = findTx(TIPO_TICKET_CONSOLIDADO, ID_FRIGORIFICO);
      const pagador = findTx(TIPO_DINERO_ENTREGADO, ID_LOGISTICA);

      expect(pagador.id_transaccion_rel).toBe(ticket.id_transaccion);
      expect(ticket.id_transaccion_rel).toBe(pagador.id_transaccion);
      expect(pagador.estado_transaccion).toBe(ESTADO_PENDIENTE);
      expect(r.saldo).toBeUndefined();
    });

    it('1B SOBREPAGO $1200 > $1000', async () => {
      setupPendientes([{ id: 10, monto: 1000 }]);
      const r = await service.consolidar({
        idsPendientes: [10], montoPagado: 1200,
        idUsuarioTicket: ID_FRIGORIFICO, idUsuarioPagador: ID_LOGISTICA,
      });
      log('1B SOBREPAGO', r);

      const pagador = findTx(TIPO_DINERO_ENTREGADO, ID_LOGISTICA);
      const ticket = findTx(TIPO_TICKET_CONSOLIDADO, ID_FRIGORIFICO);
      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_FRIGORIFICO,
      );

      expect(pagador.id_transaccion_rel).toBe(ticket.id_transaccion);
      expect(pagador.monto).toBe(-1200);
      expect(saldo.monto).toBe(-200);
      expect(saldo.id_transaccion_rel).toBe(ticket.id_transaccion);
      expect(r.saldo!.esSaldoAFavor).toBe(true);
    });

    it('1C SUBPAGO $800 < $1000', async () => {
      setupPendientes([{ id: 10, monto: 1000 }]);
      const r = await service.consolidar({
        idsPendientes: [10], montoPagado: 800,
        idUsuarioTicket: ID_FRIGORIFICO, idUsuarioPagador: ID_LOGISTICA,
      });
      log('1C SUBPAGO', r);

      const pagador = findTx(TIPO_DINERO_ENTREGADO, ID_LOGISTICA);
      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_FRIGORIFICO,
      );

      expect(pagador.monto).toBe(-800);
      expect(saldo.monto).toBe(200);
      expect(r.saldo!.esSaldoAFavor).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  CASO 2: T(300) paga a L(200) — solo idUsuarioReceptor
  // ═══════════════════════════════════════════════════════════════
  describe('CASO 2: T→L', () => {
    beforeEach(() => { transaccionesCreadas = []; });

    it('2A PAGO EXACTO $500 = $500', async () => {
      setupPendientes([{ id: 20, monto: 500 }]);
      const r = await service.consolidar({
        idsPendientes: [20], montoPagado: 500,
        idUsuarioTicket: ID_TIENDA, idUsuarioReceptor: ID_LOGISTICA,
        idNevera: ID_NEVERA,
      });
      log('2A EXACTO', r);

      const ticket = findTx(TIPO_TICKET_CONSOLIDADO, ID_TIENDA);
      const receptor = findTx(TIPO_DINERO_RECIBIDO, ID_LOGISTICA);

      expect(receptor.id_transaccion_rel).toBe(ticket.id_transaccion);
      expect(ticket.id_transaccion_rel).toBe(receptor.id_transaccion);
      expect(receptor.monto).toBe(500);
      expect(receptor.estado_transaccion).toBe(ESTADO_PENDIENTE);
      expect(receptor.id_nevera).toBe(ID_NEVERA);
      expect(r.saldo).toBeUndefined();
    });

    it('2B SOBREPAGO $700 > $500', async () => {
      setupPendientes([{ id: 20, monto: 500 }]);
      const r = await service.consolidar({
        idsPendientes: [20], montoPagado: 700,
        idUsuarioTicket: ID_TIENDA, idUsuarioReceptor: ID_LOGISTICA,
        idNevera: ID_NEVERA,
      });
      log('2B SOBREPAGO', r);

      const receptor = findTx(TIPO_DINERO_RECIBIDO, ID_LOGISTICA);
      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_TIENDA,
      );
      expect(receptor.monto).toBe(700);
      expect(saldo.monto).toBe(-200);
      expect(r.saldo!.esSaldoAFavor).toBe(true);
    });

    it('2C SUBPAGO $300 < $500', async () => {
      setupPendientes([{ id: 20, monto: 500 }]);
      const r = await service.consolidar({
        idsPendientes: [20], montoPagado: 300,
        idUsuarioTicket: ID_TIENDA, idUsuarioReceptor: ID_LOGISTICA,
        idNevera: ID_NEVERA,
      });
      log('2C SUBPAGO', r);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_TIENDA,
      );
      expect(saldo.monto).toBe(200);
      expect(r.saldo!.esSaldoAFavor).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  CASO 3: L(200) paga a A(400) — ambos + mutualLink
  // ═══════════════════════════════════════════════════════════════
  describe('CASO 3: L→A (mutualLink)', () => {
    beforeEach(() => { transaccionesCreadas = []; });

    it('3A PAGO EXACTO $2000 = $2000', async () => {
      setupPendientes([{ id: 30, monto: 2000 }]);
      const r = await service.consolidar({
        idsPendientes: [30], montoPagado: 2000,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN, idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
      });
      log('3A EXACTO + mutualLink', r);

      const receptor = findTx(TIPO_DINERO_RECIBIDO, ID_ADMIN);
      const pagador = findTx(TIPO_DINERO_ENTREGADO, ID_LOGISTICA);
      const ticket = findTx(TIPO_TICKET_CONSOLIDADO, ID_LOGISTICA);

      // mutualLink: ambos se apuntan entre sí
      expect(receptor.id_transaccion_rel).toBe(pagador.id_transaccion);
      expect(pagador.id_transaccion_rel).toBe(receptor.id_transaccion);
      // ticket apunta a uno de los dos
      expect([receptor.id_transaccion, pagador.id_transaccion]).toContain(ticket.id_transaccion_rel);

      expect(receptor.monto).toBe(2000);
      expect(pagador.monto).toBe(-2000);
      expect(r.saldo).toBeUndefined();
    });

    it('3B SOBREPAGO $2500 > $2000', async () => {
      setupPendientes([{ id: 30, monto: 2000 }]);
      const r = await service.consolidar({
        idsPendientes: [30], montoPagado: 2500,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN, idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
      });
      log('3B SOBREPAGO', r);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_LOGISTICA,
      );
      expect(saldo.monto).toBe(-500);
      expect(r.saldo!.esSaldoAFavor).toBe(true);
    });

    it('3C SUBPAGO $1500 < $2000', async () => {
      setupPendientes([{ id: 30, monto: 2000 }]);
      const r = await service.consolidar({
        idsPendientes: [30], montoPagado: 1500,
        idUsuarioTicket: ID_LOGISTICA,
        idUsuarioReceptor: ID_ADMIN, idUsuarioPagador: ID_LOGISTICA,
        mutualLink: true,
      });
      log('3C SUBPAGO', r);

      const saldo = transaccionesCreadas.find(
        (t) => t.id_tipo_transaccion === 2 && t.id_usuario === ID_LOGISTICA,
      );
      expect(saldo.monto).toBe(500);
      expect(r.saldo!.esSaldoAFavor).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  CASO 4: A(400) → L(200) Transferencia Directa
  // ═══════════════════════════════════════════════════════════════
  describe('CASO 4: A→L (transferenciaDirecta)', () => {
    beforeEach(() => { transaccionesCreadas = []; });

    it('4 transferencia directa $3000', async () => {
      const r = await service.transferenciaDirecta({
        idUsuarioPagador: ID_ADMIN, idUsuarioReceptor: ID_LOGISTICA,
        monto: 3000, notaOpcional: 'Ingreso del admin',
      });
      log('4 DIRECTA', r);

      const receptor = findTx(TIPO_DINERO_RECIBIDO, ID_LOGISTICA);
      const pagador = findTx(TIPO_DINERO_ENTREGADO, ID_ADMIN);

      expect(receptor.id_transaccion_rel).toBe(pagador.id_transaccion);
      expect(pagador.id_transaccion_rel).toBe(receptor.id_transaccion);
      expect(receptor.monto).toBe(3000);
      expect(pagador.monto).toBe(-3000);
      expect(receptor.estado_transaccion).toBe(ESTADO_PENDIENTE);
      expect(pagador.estado_transaccion).toBe(ESTADO_PENDIENTE);
    });
  });
});
