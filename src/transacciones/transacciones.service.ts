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

  private async resolveIdAdmin(idUsuario: number): Promise<number> {
    const user = await this.db.uSUARIOS.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_admin: true },
    });
    return user?.id_admin ?? 1;
  }

  async crearTransaccion(params: CrearTransaccionParams): Promise<number> {
    const id_admin = params.id_admin ?? await this.resolveIdAdmin(params.id_usuario);
    const tx = await this.db.tRANSACCIONES.create({
      data: {
        id_empaque: params.id_empaque ?? null,
        id_usuario: params.id_usuario,
        id_admin,
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
    let id_admin = params.id_admin;
    if (id_admin === undefined) {
      const user = await tx.uSUARIOS.findUnique({
        where: { id_usuario: params.id_usuario },
        select: { id_admin: true },
      });
      id_admin = user?.id_admin ?? 1;
    }
    const result = await tx.tRANSACCIONES.create({
      data: {
        id_empaque: params.id_empaque ?? null,
        id_usuario: params.id_usuario,
        id_admin,
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

  async consolidarEnTx(
    tx: TxClient,
    params: {
      idsPendientes: number[];
      montoPagado: number;
      montoConsolidado: number;
      idUsuarioTicket: number;
      idUsuarioPagador?: number;
      idUsuarioReceptor?: number;
      mutualLink?: boolean;
      notaOpcional?: string;
      idNevera?: number;
      idTipoTransaccionSaldo?: number;
      idTipoTransaccionSaldoNegativo?: number;
      notaReceptorOpcional?: string;
      notaPagadorOpcional?: string;
      notaSaldoPendiente?: string;
      notaSaldoAFavor?: string;
    },
  ): Promise<ConsolidarResultado> {
    const {
      idsPendientes,
      montoPagado,
      montoConsolidado,
      idUsuarioTicket,
      idUsuarioPagador,
      idUsuarioReceptor,
      mutualLink = false,
      notaOpcional,
      idNevera,
      idTipoTransaccionSaldo = TIPO_COSTO_FRIGORIFICO,
      idTipoTransaccionSaldoNegativo,
      notaReceptorOpcional,
      notaPagadorOpcional,
      notaSaldoPendiente,
      notaSaldoAFavor,
    } = params;

    const esCompleto = montoPagado === montoConsolidado;
    const saldo = montoConsolidado - montoPagado;

    // ── REGLA DE CUADRE: monto = 0 solo si no hay deuda pendiente ──
    // Caso válido: logística recibió de admin + de tiendas y ya gastó
    // todo (ej: reparación de vehículo). Sus pendientes netas Σ=0.
    // En ese escenario monto=0 cierra el ciclo sin mover dinero.
    if (montoPagado === 0 && montoConsolidado !== 0) {
      throw new BadRequestException(
        `No se puede consolidar con monto 0 porque hay ${montoConsolidado} en transacciones pendientes. ` +
        `Para cerrar sin mover dinero, la suma de las pendientes debe ser 0.`,
      );
    }

    let idPagoPagador: number | undefined;
    let idPagoReceptor: number | undefined;

    const idAdminTicket = (await tx.uSUARIOS.findUnique({
      where: { id_usuario: idUsuarioTicket },
      select: { id_admin: true },
    }))?.id_admin ?? 1;

    const ticket = await tx.tRANSACCIONES.create({
      data: {
        id_empaque: null,
        id_usuario: idUsuarioTicket,
        id_admin: idAdminTicket,
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
        nota_opcional: notaReceptorOpcional ?? notaOpcional,
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
        nota_opcional: notaPagadorOpcional ?? notaOpcional,
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

    const marcadas = await this.marcarPagadasEnTx(tx, idsPendientes, ticket.id_transaccion);
    if (marcadas !== idsPendientes.length) {
      throw new Error(
        `CONSOLIDACIÓN RECHAZADA: ${idsPendientes.length - marcadas} de ${idsPendientes.length} ` +
        `transacciones ya no están en estado pendiente. Otra consolidación concurrente las procesó.`,
      );
    }

    let idSaldo: number | undefined;
    if (!esCompleto) {
      const esSaldoAFavor = saldo < 0;
      const saldoTx = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioTicket,
          id_admin: idAdminTicket,
          id_transaccion_rel: ticket.id_transaccion,
          monto: saldo,
          hora_transaccion: new Date(),
          id_tipo_transaccion: saldo < 0
            ? (idTipoTransaccionSaldoNegativo ?? idTipoTransaccionSaldo)
            : idTipoTransaccionSaldo,
          nota_opcional: esSaldoAFavor
            ? `${notaSaldoAFavor ?? 'Saldo a favor del usuario'} consolidación #${ticket.id_transaccion}`
            : `${notaSaldoPendiente ?? 'Saldo pendiente'} consolidación #${ticket.id_transaccion}`,
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
      pendientesProcesadas: idsPendientes.length,
      idPagoPagador,
      idPagoReceptor,
      saldo: idSaldo
        ? { idTransaccion: idSaldo, monto: saldo, esSaldoAFavor: saldo < 0 }
        : undefined,
    };
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
      idTipoTransaccionSaldo = TIPO_COSTO_FRIGORIFICO,
      idTipoTransaccionSaldoNegativo,
      notaReceptorOpcional,
      notaPagadorOpcional,
      notaSaldoPendiente,
      notaSaldoAFavor,
    } = params;

    if (!idUsuarioPagador && !idUsuarioReceptor) {
      throw new BadRequestException(
        'Debe especificarse al menos idUsuarioPagador o idUsuarioReceptor',
      );
    }

    if (idsPendientes.length === 0) {
      throw new BadRequestException(
        'No hay transacciones pendientes para consolidar. Use transferenciaDirecta para pagos sin deuda.',
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

    return this.db.$transaction(async (tx) => {
      return this.consolidarEnTx(tx, {
        idsPendientes: idsReales,
        montoPagado,
        montoConsolidado,
        idUsuarioTicket,
        idUsuarioPagador,
        idUsuarioReceptor,
        mutualLink,
        notaOpcional,
        idNevera,
        idTipoTransaccionSaldo,
        idTipoTransaccionSaldoNegativo,
        notaReceptorOpcional,
        notaPagadorOpcional,
        notaSaldoPendiente,
        notaSaldoAFavor,
      });
    });
  }

  async transferenciaDirecta(
    params: TransferenciaDirectaParams,
  ): Promise<TransferenciaDirectaResultado> {
    const {
      idUsuarioPagador,
      idUsuarioReceptor,
      monto,
      notaOpcional,
      tipoReceptor = TIPO_DINERO_RECIBIDO,
      tipoPagador = TIPO_DINERO_ENTREGADO,
      montoReceptorNegativo = false,
      notaReceptorOpcional,
      notaPagadorOpcional,
      idNevera,
    } = params;

    return this.db.$transaction(async (tx) => {
      const montoReceptor = montoReceptorNegativo ? -monto : monto;

      const idAdminReceptor = (await tx.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioReceptor },
        select: { id_admin: true },
      }))?.id_admin ?? 1;

      const idAdminPagador = (await tx.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioPagador },
        select: { id_admin: true },
      }))?.id_admin ?? 1;

      const txReceptor = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioReceptor,
          id_admin: idAdminReceptor,
          id_transaccion_rel: null,
          monto: montoReceptor,
          hora_transaccion: new Date(),
          id_tipo_transaccion: tipoReceptor,
          nota_opcional: notaReceptorOpcional ?? notaOpcional ?? null,
          estado_transaccion: ESTADO_PENDIENTE,
          id_nevera: idNevera ?? null,
        },
        select: { id_transaccion: true },
      });

      const txPagador = await tx.tRANSACCIONES.create({
        data: {
          id_empaque: null,
          id_usuario: idUsuarioPagador,
          id_admin: idAdminPagador,
          id_transaccion_rel: txReceptor.id_transaccion,
          monto: -monto,
          hora_transaccion: new Date(),
          id_tipo_transaccion: tipoPagador,
          nota_opcional: notaPagadorOpcional ?? notaOpcional ?? null,
          estado_transaccion: ESTADO_PENDIENTE,
          id_nevera: idNevera ?? null,
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
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await tx.tRANSACCIONES.updateMany({
      where: {
        id_transaccion: { in: ids },
        estado_transaccion: ESTADO_PENDIENTE,
      },
      data: {
        estado_transaccion: ESTADO_PAGADO,
        id_transaccion_rel: idTicket,
      },
    });
    return result.count;
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
