import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import {
  CrearTransaccionParams,
  ConsolidarParams,
  ConsolidarResultado,
  TransferenciaDirectaParams,
  TransferenciaDirectaResultado,
} from './dto';

const TIPO_VENTA = 1;
const TIPO_COSTO_FRIGORIFICO = 2;
const TIPO_TICKET_CONSOLIDADO = 3;
const TIPO_DINERO_RECIBIDO = 4;
const TIPO_DINERO_ENTREGADO = 5;

const ESTADO_PENDIENTE = 1;
const ESTADO_PAGADO = 2;
const ESTADO_CONSOLIDADO = 4;

type TxClient = Prisma.TransactionClient;

@Injectable()
export class TransaccionesService {
  constructor(private readonly db: DatabaseService) {}

  async crearTransaccion(params: CrearTransaccionParams): Promise<number> {
    const tx = await this.db.tRANSACCIONES.create({
      data: {
        id_empaque: params.id_empaque ?? null,
        id_usuario: params.id_usuario,
        id_transaccion_rel: params.id_transaccion_rel ?? null,
        id_nevera: params.id_nevera ?? null,
        monto: params.monto,
        hora_transaccion: new Date(),
        id_tipo_transaccion: params.id_tipo_transaccion,
        nota_opcional: params.nota_opcional ?? null,
        estado_transaccion: params.estado_transaccion,
      },
      select: { id_transaccion: true },
    });
    return tx.id_transaccion;
  }

  async crearTransaccionEnTx(
    tx: TxClient,
    params: CrearTransaccionParams,
  ): Promise<number> {
    const result = await tx.tRANSACCIONES.create({
      data: {
        id_empaque: params.id_empaque ?? null,
        id_usuario: params.id_usuario,
        id_transaccion_rel: params.id_transaccion_rel ?? null,
        id_nevera: params.id_nevera ?? null,
        monto: params.monto,
        hora_transaccion: new Date(),
        id_tipo_transaccion: params.id_tipo_transaccion,
        nota_opcional: params.nota_opcional ?? null,
        estado_transaccion: params.estado_transaccion,
      },
      select: { id_transaccion: true },
    });
    return result.id_transaccion;
  }

  async consolidar(params: ConsolidarParams): Promise<ConsolidarResultado> {
    const {
      idsPendientes,
      montoPagado,
      idUsuarioTicket,
      idUsuarioPagador,
      idUsuarioReceptor,
      mutualLink = false,
      montoConsolidadoOverride,
      notaOpcional,
      idNevera,
    } = params;

    if (!idUsuarioPagador && !idUsuarioReceptor) {
      throw new BadRequestException(
        'Debe especificarse al menos idUsuarioPagador o idUsuarioReceptor',
      );
    }

    if (idsPendientes.length === 0) {
      throw new BadRequestException(
        'No hay transacciones pendientes para consolidar. Use registrarAdelanto para pagos sin deuda.',
      );
    }

    const pendientes = await this.db.tRANSACCIONES.findMany({
      where: {
        id_transaccion: { in: idsPendientes },
        estado_transaccion: ESTADO_PENDIENTE,
      },
      select: { id_transaccion: true, monto: true },
    });

    if (pendientes.length === 0) {
      throw new BadRequestException(
        'Ninguna de las transacciones proporcionadas está en estado pendiente.',
      );
    }

    const idsReales = pendientes.map((p) => p.id_transaccion);

    const montoConsolidado =
      montoConsolidadoOverride ??
      Math.round(
        pendientes.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0),
      );

    const esCompleto = montoPagado === montoConsolidado;
    const saldo = montoConsolidado - montoPagado;

    const resultado = await this.db.$transaction(async (tx) => {
      let idPagoPagador: number | undefined;
      let idPagoReceptor: number | undefined;

      const ticket = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioTicket,
          id_transaccion_rel: null,
          monto: -montoConsolidado,
          hora_transaccion: new Date(),
          id_tipo_transaccion: TIPO_TICKET_CONSOLIDADO,
          nota_opcional: notaOpcional ?? null,
          estado_transaccion: ESTADO_CONSOLIDADO,
          id_nevera: idNevera ?? null,
        },
        select: { id_transaccion: true },
      });

      if (idUsuarioReceptor) {
        idPagoReceptor = await this.crearTransaccionEnTx(tx, {
          id_usuario: idUsuarioReceptor,
          id_transaccion_rel: ticket.id_transaccion,
          monto: montoPagado,
          id_tipo_transaccion: TIPO_DINERO_RECIBIDO,
          estado_transaccion: ESTADO_PENDIENTE,
          nota_opcional: notaOpcional,
          id_nevera: idNevera,
        });
      }

      if (idUsuarioPagador) {
        idPagoPagador = await this.crearTransaccionEnTx(tx, {
          id_usuario: idUsuarioPagador,
          id_transaccion_rel: ticket.id_transaccion,
          monto: -montoPagado,
          id_tipo_transaccion: TIPO_DINERO_ENTREGADO,
          estado_transaccion: ESTADO_PENDIENTE,
          nota_opcional: notaOpcional,
          id_nevera: idNevera,
        });
      }

      if (mutualLink && idPagoReceptor && idPagoPagador) {
        await tx.tRANSACCIONES.update({
          where: { id_transaccion: idPagoReceptor },
          data: { id_transaccion_rel: idPagoPagador },
        });
        await tx.tRANSACCIONES.update({
          where: { id_transaccion: idPagoPagador },
          data: { id_transaccion_rel: idPagoReceptor },
        });
      }

      await tx.tRANSACCIONES.update({
        where: { id_transaccion: ticket.id_transaccion },
        data: { id_transaccion_rel: idPagoReceptor ?? idPagoPagador ?? null },
      });

      await this.marcarPagadasEnTx(tx, idsReales, ticket.id_transaccion);

      let idSaldo: number | undefined;
      if (!esCompleto) {
        const esSaldoAFavor = saldo < 0;
        const saldoTx = await tx.tRANSACCIONES.create({
          data: {
            id_empaque: null,
            id_usuario: idUsuarioTicket,
            id_transaccion_rel: ticket.id_transaccion,
            monto: saldo,
            hora_transaccion: new Date(),
            id_tipo_transaccion: TIPO_COSTO_FRIGORIFICO,
            nota_opcional: `Saldo ${
              esSaldoAFavor ? 'adelantado pendiente' : 'a favor del usuario'
            } consolidación #${ticket.id_transaccion}`,
            estado_transaccion: ESTADO_PENDIENTE,
            id_nevera: idNevera ?? null,
          },
          select: { id_transaccion: true },
        });
        idSaldo = saldoTx.id_transaccion;
      }

      return {
        idTicket: ticket.id_transaccion,
        montoConsolidado,
        montoPagado,
        pendientesProcesadas: idsReales.length,
        idPagoPagador,
        idPagoReceptor,
        saldo: idSaldo
          ? { idTransaccion: idSaldo, monto: saldo, esSaldoAFavor: saldo < 0 }
          : undefined,
      };
    });

    return resultado;
  }

  async transferenciaDirecta(
    params: TransferenciaDirectaParams,
  ): Promise<TransferenciaDirectaResultado> {
    const { idUsuarioPagador, idUsuarioReceptor, monto, notaOpcional } = params;

    return this.db.$transaction(async (tx) => {
      const txReceptor = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioReceptor,
          id_transaccion_rel: null,
          monto,
          hora_transaccion: new Date(),
          id_tipo_transaccion: TIPO_DINERO_RECIBIDO,
          nota_opcional: notaOpcional ?? null,
          estado_transaccion: ESTADO_PENDIENTE,
          id_nevera: null,
        },
        select: { id_transaccion: true },
      });

      const txPagador = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioPagador,
          id_transaccion_rel: txReceptor.id_transaccion,
          monto: -monto,
          hora_transaccion: new Date(),
          id_tipo_transaccion: TIPO_DINERO_ENTREGADO,
          nota_opcional: notaOpcional ?? null,
          estado_transaccion: ESTADO_PENDIENTE,
          id_nevera: null,
        },
        select: { id_transaccion: true },
      });

      await tx.tRANSACCIONES.update({
        where: { id_transaccion: txReceptor.id_transaccion },
        data: { id_transaccion_rel: txPagador.id_transaccion },
      });

      return {
        idTransaccionReceptor: txReceptor.id_transaccion,
        idTransaccionPagador: txPagador.id_transaccion,
        monto,
      };
    });
  }

  async actualizarNota(idTransaccion: number, notaOpcional: string): Promise<void> {
    await this.db.tRANSACCIONES.update({
      where: { id_transaccion: idTransaccion },
      data: { nota_opcional: notaOpcional },
    });
  }

  async vincularRelEnTx(tx: TxClient, idTransaccion: number, idRel: number): Promise<void> {
    await tx.tRANSACCIONES.update({
      where: { id_transaccion: idTransaccion },
      data: { id_transaccion_rel: idRel },
    });
  }

  async marcarPagadasEnTx(
    tx: TxClient,
    ids: number[],
    idTicket: number,
  ): Promise<void> {
    if (ids.length === 0) return;
    await tx.tRANSACCIONES.updateMany({
      where: { id_transaccion: { in: ids } },
      data: {
        estado_transaccion: ESTADO_PAGADO,
        id_transaccion_rel: idTicket,
      },
    });
  }

  async getPendientes(params: {
    idUsuario: number;
    idNevera?: number;
    idTipoTransaccion?: number | number[];
    idTransaccionRelNotNull?: boolean;
  }) {
    const where: any = {
      id_usuario: params.idUsuario,
      estado_transaccion: ESTADO_PENDIENTE,
    };

    if (params.idNevera !== undefined) {
      where.id_nevera = params.idNevera;
    }

    if (params.idTipoTransaccion !== undefined) {
      where.id_tipo_transaccion = Array.isArray(params.idTipoTransaccion)
        ? { in: params.idTipoTransaccion }
        : params.idTipoTransaccion;
    }

    if (params.idTransaccionRelNotNull) {
      where.id_transaccion_rel = { not: null };
    }

    return this.db.tRANSACCIONES.findMany({
      where,
      select: { id_transaccion: true, monto: true, id_empaque: true, nota_opcional: true },
    });
  }

  async getPendientesVinculadas(
    idUsuarioA: number,
    idUsuarioB: number,
    tiposTransaccion: number[],
  ) {
    const pendientesA = await this.db.tRANSACCIONES.findMany({
      where: {
        id_usuario: idUsuarioA,
        estado_transaccion: ESTADO_PENDIENTE,
        id_tipo_transaccion: { in: tiposTransaccion },
        id_transaccion_rel: { not: null },
      },
      select: { id_transaccion: true, monto: true, id_transaccion_rel: true },
    });

    const idsA = new Set(pendientesA.map((t) => t.id_transaccion));

    const pendientesB = await this.db.tRANSACCIONES.findMany({
      where: {
        id_usuario: idUsuarioB,
        estado_transaccion: ESTADO_PENDIENTE,
        id_tipo_transaccion: { in: tiposTransaccion },
        id_transaccion_rel: { not: null },
      },
      select: { id_transaccion: true, monto: true, id_transaccion_rel: true },
    });

    const idsB = new Set(pendientesB.map((t) => t.id_transaccion));

    const vinculadasA = pendientesA.filter(
      (t) => t.id_transaccion_rel && idsB.has(t.id_transaccion_rel),
    );
    const vinculadasB = pendientesB.filter(
      (t) => t.id_transaccion_rel && idsA.has(t.id_transaccion_rel),
    );

    return { vinculadasA, vinculadasB };
  }

  async countPendientes(params: {
    idUsuario: number;
    idNevera: number;
  }): Promise<number> {
    return this.db.tRANSACCIONES.count({
      where: {
        id_usuario: params.idUsuario,
        id_nevera: params.idNevera,
        estado_transaccion: ESTADO_PENDIENTE,
      },
    });
  }
}
