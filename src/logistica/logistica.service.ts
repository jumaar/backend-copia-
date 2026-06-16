import { Injectable, BadRequestException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TransaccionesService } from '../transacciones/transacciones.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';
import { CuentasDto } from './dto/cuentas.dto';
import { ConsolidacionCuentasDto } from './dto/consolidacion-cuentas.dto';
import { LiquidacionNeveraDto } from './dto/liquidacion-nevera.dto';
import { DecincoaseisDto } from './dto/decincoaseis.dto';
import { SeisasieteDto } from './dto/seisasiete.dto';
import { FinanzasDto } from './dto/finanzas.dto';
import { ConsolidarAdminDto } from './dto/consolidar-admin.dto';
import { UMBRAL_VENCIDO, UMBRAL_PARA_CAMBIO } from '../common/config/constants';

@Injectable()
export class LogisticaService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly transaccionesService: TransaccionesService,
  ) {}

  create(createLogisticaDto: CreateLogisticaDto) {
    return 'This action adds a new logistica';
  }

  findAll() {
    return `This action returns all logistica`;
  }

  findOne(id: number) {
    return `This action returns a #${id}`;
  }

  async getProductosPorLogistica(
    id_usuario: number,
    id_rol: number,
    idAdmin: number,
    idUsuarioTarget?: number,
  ) {
    // ═══════════════════════════════════════════════════════════════
    // CASO ADMIN (rol 1 o 2) SIN target: devolver lista de usuarios
    // logística que son sus descendientes
    // ═══════════════════════════════════════════════════════════════
    if ((id_rol === 1 || id_rol === 2) && !idUsuarioTarget) {
      const usuariosLogistica = await this.databaseService.uSUARIOS.findMany({
        where: {
          id_rol: 4,
          activo: true,
          ...(idAdmin !== 0 && { id_admin: idAdmin }),
        },
        select: {
          id_usuario: true,
          nombre_usuario: true,
          apellido_usuario: true,
          email: true,
          celular: true,
        },
      });

      return {
        usuarios_logistica: usuariosLogistica,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // VALIDACIÓN: Admin con target → verificar que el target sea
    // accesible en la jerarquía
    // ═══════════════════════════════════════════════════════════════
    if (idUsuarioTarget && (id_rol === 1 || id_rol === 2)) {
      if (idUsuarioTarget !== id_usuario && idAdmin !== 0) {
        const targetAccessible = await this.databaseService.uSUARIOS.findFirst({
          where: { id_usuario: idUsuarioTarget, id_admin: idAdmin, id_rol: 4, activo: true },
          select: { id_usuario: true },
        });
        if (!targetAccessible) {
          throw new ForbiddenException('No tienes acceso a este usuario logístico');
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Determinar el id_usuario efectivo para la consulta
    // ═══════════════════════════════════════════════════════════════
    const idUsuarioEfectivo = idUsuarioTarget ?? id_usuario;

    // Obtener el id_logistica del usuario objetivo
    const usuarioLogistica = await this.databaseService.lOGISTICA.findFirst({
      where: { id_usuario: idUsuarioEfectivo },
      select: { id_logistica: true }
    });

    if (!usuarioLogistica) {
      return {
        error: 'Usuario no tiene logística asociada',
        productos_por_logistica: [],
        total_productos_diferentes: 0,
        total_empaques: 0
      };
    }

    // Obtener todos los empaques que estén en estado 2 (despachados)
    // y que tengan el id_logistica específico, agrupados por id_producto
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: 2, // Solo empaques en estado 2
        id_logistica: usuarioLogistica.id_logistica // Filtro específico por id_logistica del usuario
      },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            peso_nominal_g: true,
          },
        },
      },
    });

    // Agrupar empaques por id_producto
    const productosAgrupados = empaques.reduce((acc, empaque) => {
      const productoId = empaque.id_producto;
      
      if (!acc[productoId]) {
        acc[productoId] = {
          id_producto: productoId,
          nombre_producto: empaque.producto.nombre_producto,
          peso_nominal: empaque.producto.peso_nominal_g,
          empaques: []
        };
      }

      acc[productoId].empaques.push({
        id_empaque: empaque.id_empaque,
        peso_exacto_g: empaque.peso_exacto_g,
        EPC_id: empaque.EPC_id
      });

      return acc;
    }, {});

    // Obtener la última hora de calificación de surtido de toda la tabla STOCK_NEVERA
    let ultimaHoraCalificacion: string | null = null;

    const ultimaCalificacion = await this.databaseService.sTOCK_NEVERA.findFirst({
      where: {
        hora_calificacion: { not: null }
      },
      select: { hora_calificacion: true },
      orderBy: { hora_calificacion: 'desc' }
    });

    if (ultimaCalificacion && ultimaCalificacion.hora_calificacion) {
      ultimaHoraCalificacion = ultimaCalificacion.hora_calificacion.toISOString();
    }

    // ═══════════════════════════════════════════════════════════════
    // NUEVO: EMPAQUES EN ESTADO 5 (PARA CAMBIO) — Tasks 1 & 4
    // Agrupados por ciudad → nevera, divididos en:
    //   para_cambio: 75% ≤ tiempo transcurrido < 100%
    //   vencidos:    tiempo transcurrido ≥ 100%
    // ═══════════════════════════════════════════════════════════════

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: idUsuarioEfectivo },
      select: { id_rol: true },
    });

    let usuariosPermitidos: number[];
    if (idAdmin === 0) {
      const allUsers = await this.databaseService.uSUARIOS.findMany({
        where: { activo: true },
        select: { id_usuario: true },
      });
      usuariosPermitidos = allUsers.map(u => u.id_usuario);
    } else {
      const adminUsers = await this.databaseService.uSUARIOS.findMany({
        where: { id_admin: idAdmin, activo: true },
        select: { id_usuario: true },
      });
      usuariosPermitidos = adminUsers.map(u => u.id_usuario);
    }

    const empaquesEstado5 = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: 5,
        nevera: {
          id_estado_nevera: 2,
          tienda: {
            id_usuario: { in: usuariosPermitidos },
          },
        },
      },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            dias_vencimiento: true,
          },
        },
        nevera: {
          include: {
            tienda: {
              include: {
                ciudad: idAdmin !== 0
                  ? { where: { id_admin: idAdmin }, select: { id_ciudad: true, nombre_ciudad: true } }
                  : { select: { id_ciudad: true, nombre_ciudad: true } },
              },
            },
          },
        },
      },
    });

    const ahora = new Date();
    const empaquesParaCambioRaw: any[] = [];
    const empaquesVencidosRaw: any[] = [];

    for (const e of empaquesEstado5) {
      if (!e.nevera) continue;

      const diasVida = e.producto.dias_vencimiento;
      const fechaEmpaque = new Date(e.fecha_empaque_1);
      const msTranscurridos = ahora.getTime() - fechaEmpaque.getTime();
      const diasTranscurridos = msTranscurridos / (1000 * 60 * 60 * 24);
      const porcentaje =
        diasVida > 0
          ? Math.round((diasTranscurridos / diasVida) * 100 * 100) / 100
          : 0;

      const nevera = e.nevera;

      const item = {
        id_empaque: e.id_empaque,
        epc: e.EPC_id,
        id_producto: e.producto.id_producto,
        nombre_producto: e.producto.nombre_producto,
        fecha_empaque_1: e.fecha_empaque_1,
        fecha_vencimiento: e.fecha_vencimiento,
        dias_vencimiento: diasVida,
        porcentaje_transcurrido: porcentaje,
        ciudad: {
          id_ciudad: nevera.tienda.ciudad.id_ciudad,
          nombre_ciudad: nevera.tienda.ciudad.nombre_ciudad,
        },
        nevera: {
          id_nevera: nevera.id_nevera,
          nombre_tienda: nevera.tienda.nombre_tienda,
          direccion: nevera.tienda.direccion,
        },
      };

      if (porcentaje >= UMBRAL_VENCIDO) {
        empaquesVencidosRaw.push(item);
      } else {
        empaquesParaCambioRaw.push(item);
      }
    }

    function agruparPorCiudadNevera(items: any[]) {
      const mapa: Record<string, any> = {};

      for (const item of items) {
        const cId = item.ciudad.id_ciudad;
        const nId = item.nevera.id_nevera;

        if (!mapa[cId]) {
          mapa[cId] = {
            id_ciudad: cId,
            nombre_ciudad: item.ciudad.nombre_ciudad,
            neverasMap: {},
          };
        }
        if (!mapa[cId].neverasMap[nId]) {
          mapa[cId].neverasMap[nId] = {
            id_nevera: nId,
            nombre_tienda: item.nevera.nombre_tienda,
            direccion: item.nevera.direccion,
            empaques: [],
          };
        }

        mapa[cId].neverasMap[nId].empaques.push({
          id_empaque: item.id_empaque,
          epc: item.epc,
          id_producto: item.id_producto,
          nombre_producto: item.nombre_producto,
          fecha_empaque_1: item.fecha_empaque_1,
          fecha_vencimiento: item.fecha_vencimiento,
          dias_vencimiento: item.dias_vencimiento,
          porcentaje_transcurrido: item.porcentaje_transcurrido,
        });
      }

      return Object.values(mapa).map((c: any) => ({
        id_ciudad: c.id_ciudad,
        nombre_ciudad: c.nombre_ciudad,
        neveras: Object.values(c.neverasMap),
      }));
    }

    const paraCambio = agruparPorCiudadNevera(empaquesParaCambioRaw);
    const vencidos = agruparPorCiudadNevera(empaquesVencidosRaw);

    // ═══════════════════════════════════════════════════════════════
    // EMPAQUES EN ESTADO 6 (LOGÍSTICA PRIORIDAD)
    // Se agregan dentro de cada producto en productosAgrupados como
    // empaques_estado_6 → { logistica_prioridad, vencidos }
    // ═══════════════════════════════════════════════════════════════

    const empaquesEstado6 = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: 6,
        id_logistica: usuarioLogistica.id_logistica,
      },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            peso_nominal_g: true,
            dias_vencimiento: true,
          },
        },
      },
    });

    for (const e of empaquesEstado6) {
      const productoId = e.id_producto;

      if (!productosAgrupados[productoId]) {
        productosAgrupados[productoId] = {
          id_producto: productoId,
          nombre_producto: e.producto.nombre_producto,
          peso_nominal: e.producto.peso_nominal_g,
          empaques: [],
        };
      }

      if (!productosAgrupados[productoId].empaques_estado_6) {
        productosAgrupados[productoId].empaques_estado_6 = {
          logistica_prioridad: [],
          vencidos: [],
        };
      }

      const diasVida = e.producto.dias_vencimiento;
      const fechaEmpaque = new Date(e.fecha_empaque_1);
      const msTranscurridos = ahora.getTime() - fechaEmpaque.getTime();
      const diasTranscurridos = msTranscurridos / (1000 * 60 * 60 * 24);
      const porcentaje =
        diasVida > 0
          ? Math.round((diasTranscurridos / diasVida) * 100 * 100) / 100
          : 0;

      const empaqueLimpio = {
        id_empaque: e.id_empaque,
        peso_exacto_g: e.peso_exacto_g,
        EPC_id: e.EPC_id,
        porcentaje_transcurrido: porcentaje,
      };

      if (porcentaje >= UMBRAL_VENCIDO) {
        productosAgrupados[productoId].empaques_estado_6.vencidos.push(empaqueLimpio);
      } else {
        productosAgrupados[productoId].empaques_estado_6.logistica_prioridad.push(empaqueLimpio);
      }
    }

    // Convertir objeto a array para la respuesta (después de agregar estado 6)
    const resultado = Object.values(productosAgrupados);

    return {
      productos_por_logistica: resultado,
      total_productos_diferentes: resultado.length,
      total_empaques: empaques.length + empaquesEstado6.length,
      id_logistica_usuario: usuarioLogistica.id_logistica,
      ultima_hora_calificacion: ultimaHoraCalificacion,
      para_cambio: paraCambio,
      vencidos: vencidos,
    };
  }

  async getCuentasTransacciones(cuentasDto: CuentasDto) {
    const { mes: mesParam, año: añoParam, id_usuario } = cuentasDto;
    
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const añoActual = ahora.getFullYear();
    
    // Si no se proporcionan mes/año, usar el mes actual
    const mes = mesParam || mesActual;
    const año = añoParam || añoActual;
    const esPeriodoActual = mes === mesActual && año === añoActual;
    
    // Calcular el primer y último día del mes especificado
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999);

    // Obtener información del usuario (fecha de creación)
    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario },
      select: {
        fecha_creacion: true,
        nombre_usuario: true,
        apellido_usuario: true
      }
    });

    if (!usuario) {
      return {
        error: 'Usuario no encontrado',
        transacciones: [],
        fecha_creacion_usuario: null,
        periodo: { mes, año }
      };
    }

    // PASO 1: Transacciones base — las del mes consultado, y si es el periodo
    // actual se incluyen también todas las pendientes (estado 1) sin filtro de
    // fecha, para que nunca se oculten deudas de meses anteriores no consolidadas.
    const whereBase: any = {
      id_usuario: id_usuario,
    };

    if (esPeriodoActual) {
      whereBase.OR = [
        { hora_transaccion: { gte: fechaInicio, lte: fechaFin } },
        { estado_transaccion: 1 },
      ];
    } else {
      whereBase.hora_transaccion = { gte: fechaInicio, lte: fechaFin };
    }

    const transaccionesBase = await this.databaseService.tRANSACCIONES.findMany({
      where: whereBase,
      include: {
        estadoTransaccion: {
          select: { id_estado_transaccion: true, nombre_estado: true },
        },
        tipoTransaccion: {
          select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true },
        },
        empaque: {
          select: { id_empaque: true, EPC_id: true },
        },
        transaccionRel: {
          select: {
            id_transaccion: true,
            hora_transaccion: true,
            nota_opcional: true,
            usuario: {
              select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
            },
          },
        },
      },
      orderBy: { hora_transaccion: 'desc' },
    });

    const todasLasTransacciones = [...transaccionesBase];
    const idsSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsConsolidados = transaccionesBase
      .filter(t => t.tipoTransaccion.nombre_codigo === 'ticket_consolidado')
      .map(t => t.id_transaccion);

    if (idsConsolidados.length > 0) {
      const relacionadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: id_usuario,
          id_transaccion_rel: { in: idsConsolidados },
          id_transaccion: { notIn: [...idsSet] },
        },
        include: {
          estadoTransaccion: {
            select: { id_estado_transaccion: true, nombre_estado: true },
          },
          tipoTransaccion: {
            select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true },
          },
          empaque: {
            select: { id_empaque: true, EPC_id: true },
          },
          transaccionRel: {
            select: {
              id_transaccion: true,
              hora_transaccion: true,
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of relacionadas) {
        if (!idsSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    const consolidadosPosteriores = transaccionesBase
      .filter(t =>
        t.id_transaccion_rel !== null &&
        t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
        t.estadoTransaccion.id_estado_transaccion !== 1 &&
        !idsSet.has(t.id_transaccion_rel as number)
      )
      .map(t => ({
        id_transaccion: t.id_transaccion,
        id_empaque: t.id_empaque,
        id_transaccion_rel: t.id_transaccion_rel,
        monto: parseFloat(t.monto.toString()),
        hora_transaccion: t.hora_transaccion,
        nombre_tipo_transaccion: t.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: t.estadoTransaccion.nombre_estado,
        nota_opcional: t.nota_opcional,
        consolidado_posterior: {
          id_transaccion: t.transaccionRel!.id_transaccion,
          fecha_consolidacion: t.transaccionRel!.hora_transaccion,
          nota_opcional: t.transaccionRel!.nota_opcional,
        },
      }));

    // Ordenar todas las transacciones por fecha descendente
    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transacciones = todasLasTransacciones.filter(
      t => !new Set(consolidadosPosteriores.map(c => c.id_transaccion)).has(t.id_transaccion)
    );

    const idsConsolidadasParaPago = [
      ...transacciones
        .filter(t =>
          t.id_empaque === null &&
          t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
          t.estadoTransaccion.id_estado_transaccion === 2,
        )
        .map(t => t.id_transaccion),
      ...consolidadosPosteriores.map(c => c.id_transaccion),
    ];

    const mapaInfoPago = new Map<number, { id_usuario_pago: number; nombre_usuario_pago: string; nota_opcional_pago: string | null }>();

    if (idsConsolidadasParaPago.length > 0) {
      const contrapartes = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_transaccion_rel: { in: idsConsolidadasParaPago },
          id_usuario: { not: id_usuario },
        },
        select: {
          id_transaccion_rel: true,
          id_usuario: true,
          nota_opcional: true,
          usuario: {
            select: { nombre_usuario: true, apellido_usuario: true },
          },
        },
      });

      for (const c of contrapartes) {
        if (c.id_transaccion_rel && !mapaInfoPago.has(c.id_transaccion_rel)) {
          mapaInfoPago.set(c.id_transaccion_rel, {
            id_usuario_pago: c.id_usuario,
            nombre_usuario_pago: `${c.usuario.nombre_usuario} ${c.usuario.apellido_usuario}`,
            nota_opcional_pago: c.nota_opcional,
          });
        }
      }
    }

    const consolidadosPosterioresConPago = consolidadosPosteriores.map(cp => {
      const infoPago = mapaInfoPago.get(cp.id_transaccion);
      return {
        id_transaccion: cp.id_transaccion,
        id_empaque: cp.id_empaque,
        id_transaccion_rel: cp.id_transaccion_rel,
        monto: cp.monto,
        hora_transaccion: cp.hora_transaccion,
        nombre_tipo_transaccion: cp.nombre_tipo_transaccion,
        nombre_estado_transaccion: cp.nombre_estado_transaccion,
        nota_opcional: cp.nota_opcional,
        ...(infoPago && { info_pago: infoPago }),
        consolidado_posterior: {
          id_transaccion: cp.consolidado_posterior.id_transaccion,
          fecha_consolidacion: cp.consolidado_posterior.fecha_consolidacion,
        },
      };
    });

    // Formatear las transacciones para la respuesta (solo campos esenciales)
    const transaccionesFormateadas = transacciones.map(transaccion => {
      const infoPago = transaccion.id_empaque === null
        ? (mapaInfoPago.get(transaccion.id_transaccion) ??
           (transaccion.transaccionRel ? {
             id_usuario_pago: transaccion.transaccionRel.usuario.id_usuario,
             nombre_usuario_pago: `${transaccion.transaccionRel.usuario.nombre_usuario} ${transaccion.transaccionRel.usuario.apellido_usuario}`,
             nota_opcional_pago: transaccion.transaccionRel.nota_opcional,
           } : null))
        : null;

      return {
        id_transaccion: transaccion.id_transaccion,
        id_empaque: transaccion.id_empaque, // null para tickets consolidados
        id_transaccion_rel: transaccion.id_transaccion_rel, // null = normal, number = consolidada
        monto: parseFloat(transaccion.monto.toString()),
        hora_transaccion: transaccion.hora_transaccion,
        nombre_tipo_transaccion: transaccion.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: transaccion.estadoTransaccion.nombre_estado,
        nota_opcional: transaccion.nota_opcional,
        // Solo para transacciones consolidadas
        ...(infoPago && { info_pago: infoPago })
      };
    });

    return {
      transacciones: transaccionesFormateadas,
      consolidados_posteriores: consolidadosPosterioresConPago,
      fecha_creacion_usuario: usuario.fecha_creacion,
      nombre_usuario: usuario.nombre_usuario,
      apellido_usuario: usuario.apellido_usuario,
      periodo: { mes, año },
      fecha_inicio_periodo: fechaInicio,
      fecha_fin_periodo: fechaFin,
      total_transacciones: transacciones.length,
      parametros_usados: {
        mes_pedido: mesParam || null,
        año_pedido: añoParam || null,
        mes_devuelto: mes,
        año_devuelto: año,
        es_periodo_actual: esPeriodoActual
      }
    };
  }
  async getNeverasActivas(id_usuario: number, idAdmin: number) {

    // FASE 0: Escanea empaques en estado 3 y 5, cambia a estado 5 los ≥75%
    // que aun esten en estado 3, y setea mensaje_sistema para ambos.
    const empaquesScan = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: { in: [3, 5] },
        nevera: { id_estado_nevera: 2 },
      },
      include: { producto: { select: { dias_vencimiento: true } } },
    });

    if (empaquesScan.length > 0) {
      const ahora = new Date();
      const idsParaCambio: number[] = [];
      const mensajesPorNeveraProducto = new Map<
        string,
        { proximos: boolean; vencidos: boolean; idNevera: number; idProducto: number }
      >();

      for (const e of empaquesScan) {
        const diasVida = e.producto.dias_vencimiento;
        if (!diasVida || diasVida <= 0) continue;
        const pct = ((ahora.getTime() - new Date(e.fecha_empaque_1).getTime()) / (1000 * 60 * 60 * 24) / diasVida) * 100;

        const key = `${e.id_nevera}_${e.id_producto}`;
        if (!mensajesPorNeveraProducto.has(key)) {
          mensajesPorNeveraProducto.set(key, { proximos: false, vencidos: false, idNevera: e.id_nevera ?? 0, idProducto: e.id_producto });
        }
        const m = mensajesPorNeveraProducto.get(key)!;

        if (pct >= UMBRAL_VENCIDO) {
          m.vencidos = true;
        } else if (pct >= UMBRAL_PARA_CAMBIO) {
          m.proximos = true;
        }

        if (e.id_estado_empaque === 3 && pct >= UMBRAL_PARA_CAMBIO) {
          if (pct >= UMBRAL_VENCIDO || e.id_nevera_anterior === null) {
            idsParaCambio.push(e.id_empaque);
          }
        }
      }

      if (idsParaCambio.length > 0) {
        await this.databaseService.eMPAQUES.updateMany({
          where: { id_empaque: { in: idsParaCambio } },
          data: { id_estado_empaque: 5 },
        });
      }

      for (const [, m] of mensajesPorNeveraProducto) {
        if (!m.idNevera) continue;
        const partes: string[] = [];
        if (m.proximos) partes.push('De este producto hay empaques proximos a vencer');
        if (m.vencidos) partes.push('Alerta: de este producto hay empaques vencidos');

        await this.databaseService.sTOCK_NEVERA.updateMany({
          where: { id_nevera: m.idNevera, id_producto: m.idProducto },
          data: { mensaje_sistema: partes.length > 0 ? partes.join(', ') : null },
        });
      }
    }

    // Obtener tiendas de los usuarios accesibles por id_admin
    let usuarioIdsParaTiendas: number[];
    if (idAdmin === 0) {
      const allUsers = await this.databaseService.uSUARIOS.findMany({
        where: { activo: true },
        select: { id_usuario: true },
      });
      usuarioIdsParaTiendas = allUsers.map(u => u.id_usuario);
    } else {
      const adminUsers = await this.databaseService.uSUARIOS.findMany({
        where: { id_admin: idAdmin, activo: true },
        select: { id_usuario: true },
      });
      usuarioIdsParaTiendas = adminUsers.map(u => u.id_usuario);
    }

    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: { in: usuarioIdsParaTiendas } },
      select: { id_tienda: true }
    });

    const tiendasIds = tiendas.map(t => t.id_tienda);

    if (tiendasIds.length === 0) {
      return {
        neveras_activas: [],
        total_neveras: 0
      };
    }

    // Obtener neveras activas (estado 2) de las tiendas filtradas
    const neveras = await this.databaseService.nEVERAS.findMany({
      where: {
        id_tienda: { in: tiendasIds },
        id_estado_nevera: 2 // Activa
      },
      include: {
        tienda: {
          include: {
            ciudad: idAdmin !== 0
              ? { where: { id_admin: idAdmin }, select: { id_ciudad: true, nombre_ciudad: true } }
              : { select: { id_ciudad: true, nombre_ciudad: true } }
          }
        }
      }
    });

    // Formatear la respuesta
    const neverasFormateadas = neveras.map((nevera) => ({
      id_nevera: nevera.id_nevera,
      nombre_tienda: nevera.tienda.nombre_tienda,
      direccion: nevera.tienda.direccion,
      ciudad: nevera.tienda.ciudad.nombre_ciudad,
      id_ciudad: nevera.tienda.ciudad.id_ciudad,
    }));

    return {
      neveras_activas: neverasFormateadas,
      total_neveras: neverasFormateadas.length,
    };
  }




  async consolidarCuentas(
    id_usuario_consolidar: number,
    id_usuario_credenciales: number,
    consolidacionDto: ConsolidacionCuentasDto
  ) {
    const { monto, nota_opcional, tipo_movimiento } = consolidacionDto;

    const usuarioAConsolidar = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario_consolidar },
      select: { id_rol: true, nombre_usuario: true, apellido_usuario: true }
    });

    if (!usuarioAConsolidar) {
      throw new BadRequestException('Usuario a consolidar no encontrado');
    }

    if (usuarioAConsolidar.id_rol !== 3) {
      throw new BadRequestException('El usuario debe tener rol 3 (cliente frigorífico) para ser consolidado');
    }

    const esTransferencia = tipo_movimiento === 'ingreso' || tipo_movimiento === 'egreso';
    const esConsolidacion = tipo_movimiento === 'consolidacion';

    if (esTransferencia) {
      try {
        const notaAdelanto = `Adelanto a frigorífico${nota_opcional ? ' | ' + nota_opcional : ''}`;

        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: id_usuario_credenciales,
          idUsuarioReceptor: id_usuario_consolidar,
          monto,
          notaOpcional: notaAdelanto,
          tipoReceptor: 2,
          montoReceptorNegativo: true,
          notaReceptorOpcional: notaAdelanto,
        });

        return {
          message: 'Abono registrado exitosamente',
          resumen: {
            usuario_consolidado: id_usuario_consolidar,
            usuario_acreedor: id_usuario_credenciales,
            monto_abonado: monto,
            tipo_operacion: 'transferencia_directa'
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Error al registrar abono: ${errorMessage}`);
      }
    }

    if (esConsolidacion) {
      const transaccionesPendientes = await this.transaccionesService.getPendientes({
        idUsuario: id_usuario_consolidar,
      });

      if (transaccionesPendientes.length === 0) {
        throw new BadRequestException(
          'No hay transacciones pendientes del frigorífico. ' +
          'Usa tipo_movimiento: "ingreso" para transferencia directa.',
        );
      }

      const idsPendientes = transaccionesPendientes.map(t => t.id_transaccion);
      const sumaPendientes = Math.round(
        transaccionesPendientes.reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0),
      );

      if (sumaPendientes < 0) {
        throw new BadRequestException(
          `El frigorífico tiene saldo negativo (${sumaPendientes}). ` +
          'Usa tipo_movimiento: "ingreso" para transferencia directa.',
        );
      }

      if (monto === 0 && sumaPendientes !== 0) {
        throw new BadRequestException(
          `No se puede consolidar con monto 0 porque hay ${sumaPendientes} en transacciones pendientes. ` +
          'Para cerrar sin mover dinero, la suma de las pendientes debe ser 0.',
        );
      }

      try {
        const notaTicket = monto === 0
          ? `Cierre de caja frigorífico (saldo neto 0)${nota_opcional ? ' | ' + nota_opcional : ''}`
          : `Consolidación con abono de $${monto.toLocaleString('es-CO')} a frigorífico${nota_opcional ? ' | ' + nota_opcional : ''}`;
        const notaPagador = `Adelanto a frigorífico${nota_opcional ? ' | ' + nota_opcional : ''}`;

        await this.transaccionesService.consolidar({
          idsPendientes,
          montoPagado: monto,
          idUsuarioTicket: id_usuario_consolidar,
          idUsuarioPagador: id_usuario_credenciales,
          notaOpcional: notaTicket,
          notaPagadorOpcional: notaPagador,
          notaSaldoAFavor: 'Saldo adelantado pendiente | ',
        });

        return {
          message: 'Consolidación realizada exitosamente',
          resumen: {
            usuario_consolidado: id_usuario_consolidar,
            usuario_acreedor: id_usuario_credenciales,
            monto_abonado: monto,
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Error al consolidar cuentas: ${errorMessage}`);
      }
    }

    throw new BadRequestException(
      'tipo_movimiento inválido. Usa "ingreso", "egreso" o "consolidacion".',
    );
  }

  async getHermanosLogisticaPorScope(requesterId: number, requesterRole: number, idAdmin: number) {
    if (requesterRole === 1) {
      const admins = await this.databaseService.uSUARIOS.findMany({
        where: { id_rol: 2, activo: true },
        select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, email: true, celular: true },
      });

      const result = await Promise.all(
        admins.map(async (admin) => {
          const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
            where: {
              id_usuario_creador: admin.id_usuario,
              es_usado: true,
              id_rol_nuevo_usuario: 4,
              id_usuario_nuevo: { not: null },
            },
            select: { id_usuario_nuevo: true },
          });
          const logisticaIds = tokens
            .map((t) => t.id_usuario_nuevo)
            .filter(Boolean) as number[];

          let usuariosLogistica: any[] = [];
          if (logisticaIds.length > 0) {
            usuariosLogistica = await this.databaseService.uSUARIOS.findMany({
              where: { id_usuario: { in: logisticaIds }, activo: true },
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true,
                email: true,
                celular: true,
                logisticas: { select: { id_logistica: true, nombre_empresa: true, placa_vehiculo: true } },
              },
            });
          }

          return {
            admin: {
              id_usuario: admin.id_usuario,
              nombre_usuario: admin.nombre_usuario,
              apellido_usuario: admin.apellido_usuario,
              email: admin.email,
              celular: admin.celular,
            },
            logisticas: usuariosLogistica.map((u) => ({
              id_usuario: u.id_usuario,
              nombre_usuario: u.nombre_usuario,
              apellido_usuario: u.apellido_usuario,
              email: u.email,
              celular: u.celular,
              empresas: u.logisticas.map((l: any) => ({
                id_logistica: l.id_logistica,
                nombre_empresa: l.nombre_empresa,
                placa_vehiculo: l.placa_vehiculo,
              })),
            })),
          };
        }),
      );

      return { admins: result };
    }

    const hermanos = await this.databaseService.uSUARIOS.findMany({
      where: {
        id_rol: 4,
        activo: true,
        ...(idAdmin !== 0 && { id_admin: idAdmin }),
      },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        email: true,
        celular: true,
        logisticas: {
          select: {
            id_logistica: true,
            nombre_empresa: true,
            placa_vehiculo: true,
          },
        },
      },
    });

    let adminData: any = null;
    if (requesterRole === 2) {
      const admin = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: requesterId },
        select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
      });
      adminData = admin;
    }

    return {
      admin: adminData,
      cantidad_logisticas: hermanos.length,
      logisticas: hermanos.map(h => ({
        id_usuario: h.id_usuario,
        nombre_usuario: h.nombre_usuario,
        apellido_usuario: h.apellido_usuario,
        email: h.email,
        celular: h.celular,
        empresas: h.logisticas.map(l => ({
          id_logistica: l.id_logistica,
          nombre_empresa: l.nombre_empresa,
          placa_vehiculo: l.placa_vehiculo,
        })),
      })),
    };
  }

  async getFinanzas(dto: FinanzasDto) {
    const { mes: mesParam, ano: anoParam, id_usuario } = dto;

    const ahora = new Date();
    const mes = mesParam || (ahora.getMonth() + 1);
    const ano = anoParam || ahora.getFullYear();
    const fechaInicio = new Date(ano, mes - 1, 1);
    const fechaFin = new Date(ano, mes, 0, 23, 59, 59, 999);

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        id_rol: true,
        fecha_creacion: true,
      },
    });

    if (!usuario || usuario.id_rol !== 4) {
      throw new BadRequestException('Usuario logística no encontrado');
    }

    const adminPadre = await this.databaseService.tOKEN_REGISTRO.findFirst({
      where: { id_usuario_nuevo: id_usuario, id_rol_nuevo_usuario: 4 },
      select: {
        creador: {
          select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
        },
      },
    });

    const admin = adminPadre?.creador ?? null;

    const whereBase: any = {
      id_usuario,
    };

    const esMesActual = mes === (ahora.getMonth() + 1) && ano === ahora.getFullYear();

    if (esMesActual) {
      whereBase.OR = [
        { hora_transaccion: { gte: fechaInicio, lte: fechaFin } },
        { estado_transaccion: 1 },
      ];
    } else {
      whereBase.hora_transaccion = { gte: fechaInicio, lte: fechaFin };
    }

    const transaccionesBase = await this.databaseService.tRANSACCIONES.findMany({
      where: whereBase,
      include: {
        estadoTransaccion: {
          select: { id_estado_transaccion: true, nombre_estado: true },
        },
        tipoTransaccion: {
          select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true },
        },
        empaque: {
          select: { id_empaque: true, EPC_id: true },
        },
        transaccionRel: {
          select: {
            id_transaccion: true,
            hora_transaccion: true,
            nota_opcional: true,
            usuario: {
              select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
            },
          },
        },
      },
      orderBy: { hora_transaccion: 'desc' },
    });

    const todasLasTransacciones = [...transaccionesBase];
    const idsSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsConsolidados = transaccionesBase
      .filter(t => t.tipoTransaccion.nombre_codigo === 'ticket_consolidado')
      .map(t => t.id_transaccion);

    if (idsConsolidados.length > 0) {
      const relacionadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario,
          id_transaccion_rel: { in: idsConsolidados },
          id_transaccion: { notIn: [...idsSet] },
        },
        include: {
          estadoTransaccion: {
            select: { id_estado_transaccion: true, nombre_estado: true },
          },
          tipoTransaccion: {
            select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true },
          },
          empaque: {
            select: { id_empaque: true, EPC_id: true },
          },
          transaccionRel: {
            select: {
              id_transaccion: true,
              hora_transaccion: true,
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of relacionadas) {
        if (!idsSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    const consolidadosPosteriores = transaccionesBase
      .filter(t =>
        t.id_transaccion_rel !== null &&
        t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
        t.estadoTransaccion.id_estado_transaccion !== 1 &&
        !idsSet.has(t.id_transaccion_rel as number)
      )
      .map(t => ({
        id_transaccion: t.id_transaccion,
        id_empaque: t.id_empaque,
        id_transaccion_rel: t.id_transaccion_rel,
        monto: parseFloat(t.monto.toString()),
        hora_transaccion: t.hora_transaccion,
        nombre_tipo_transaccion: t.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: t.estadoTransaccion.nombre_estado,
        nota_opcional: t.nota_opcional,
        consolidado_posterior: {
          id_transaccion: t.transaccionRel!.id_transaccion,
          fecha_consolidacion: t.transaccionRel!.hora_transaccion,
          nota_opcional: t.transaccionRel!.nota_opcional,
        },
      }));

    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transacciones = todasLasTransacciones.filter(
      t => !new Set(consolidadosPosteriores.map(c => c.id_transaccion)).has(t.id_transaccion)
    );

    const idsConsolidadasParaPago = [
      ...transacciones
        .filter(t =>
          t.id_empaque === null &&
          t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
          t.estadoTransaccion.id_estado_transaccion === 2,
        )
        .map(t => t.id_transaccion),
      ...consolidadosPosteriores.map(c => c.id_transaccion),
    ];

    const mapaInfoPago = new Map<number, { id_usuario_pago: number; nombre_usuario_pago: string; nota_opcional_pago: string | null }>();

    if (idsConsolidadasParaPago.length > 0) {
      const contrapartes = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_transaccion_rel: { in: idsConsolidadasParaPago },
          id_usuario: { not: id_usuario },
        },
        select: {
          id_transaccion_rel: true,
          id_usuario: true,
          nota_opcional: true,
          usuario: {
            select: { nombre_usuario: true, apellido_usuario: true },
          },
        },
      });

      for (const c of contrapartes) {
        if (c.id_transaccion_rel && !mapaInfoPago.has(c.id_transaccion_rel)) {
          mapaInfoPago.set(c.id_transaccion_rel, {
            id_usuario_pago: c.id_usuario,
            nombre_usuario_pago: `${c.usuario.nombre_usuario} ${c.usuario.apellido_usuario}`,
            nota_opcional_pago: c.nota_opcional,
          });
        }
      }
    }

    const consolidadosPosterioresConPago = consolidadosPosteriores.map(cp => {
      const infoPago = mapaInfoPago.get(cp.id_transaccion);
      return {
        id_transaccion: cp.id_transaccion,
        id_empaque: cp.id_empaque,
        id_transaccion_rel: cp.id_transaccion_rel,
        monto: cp.monto,
        hora_transaccion: cp.hora_transaccion,
        nombre_tipo_transaccion: cp.nombre_tipo_transaccion,
        nombre_estado_transaccion: cp.nombre_estado_transaccion,
        nota_opcional: cp.nota_opcional,
        ...(infoPago && { info_pago: infoPago }),
        consolidado_posterior: {
          id_transaccion: cp.consolidado_posterior.id_transaccion,
          fecha_consolidacion: cp.consolidado_posterior.fecha_consolidacion,
        },
      };
    });

    const transaccionesFormateadas = transacciones.map(transaccion => {
      const infoPago = transaccion.id_empaque === null
        ? (mapaInfoPago.get(transaccion.id_transaccion) ??
           (transaccion.transaccionRel ? {
             id_usuario_pago: transaccion.transaccionRel.usuario.id_usuario,
             nombre_usuario_pago: `${transaccion.transaccionRel.usuario.nombre_usuario} ${transaccion.transaccionRel.usuario.apellido_usuario}`,
             nota_opcional_pago: transaccion.transaccionRel.nota_opcional,
           } : null))
        : null;

      return {
        id_transaccion: transaccion.id_transaccion,
        id_empaque: transaccion.id_empaque,
        id_transaccion_rel: transaccion.id_transaccion_rel,
        monto: parseFloat(transaccion.monto.toString()),
        hora_transaccion: transaccion.hora_transaccion,
        nombre_tipo_transaccion: transaccion.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: transaccion.estadoTransaccion.nombre_estado,
        nota_opcional: transaccion.nota_opcional,
        ...(infoPago && { info_pago: infoPago }),
      };
    });

    return {
      admin,
      transacciones: transaccionesFormateadas,
      consolidados_posteriores: consolidadosPosterioresConPago,
      fecha_creacion_usuario: usuario.fecha_creacion,
      nombre_usuario: usuario.nombre_usuario,
      apellido_usuario: usuario.apellido_usuario,
      periodo: { mes, ano },
      fecha_inicio_periodo: fechaInicio,
      fecha_fin_periodo: fechaFin,
      total_transacciones: transacciones.length,
      parametros_usados: {
        mes_pedido: mesParam || null,
        ano_pedido: anoParam || null,
        mes_devuelto: mes,
        ano_devuelto: ano,
        es_periodo_actual: mes === (ahora.getMonth() + 1) && ano === ahora.getFullYear(),
      },
    };
  }

  async consolidarAdmin(
    idUsuario: number,
    idRol: number,
    dto: ConsolidarAdminDto,
  ) {
    const { monto, nota_opcional, tipo_movimiento, id_logistica: idLogisticaParam } = dto;

    let idUsuarioLogistica: number;
    let idUsuarioAdmin: number;
    let nombreLogistica: string;
    let nombreAdmin: string;

    if (idRol === 4) {
      idUsuarioLogistica = idUsuario;

      const userLog = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioLogistica },
        select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, id_rol: true },
      });

      if (!userLog || userLog.id_rol !== 4) {
        throw new BadRequestException('Usuario logística no encontrado');
      }

      nombreLogistica = `${userLog.nombre_usuario} ${userLog.apellido_usuario}`;

      const adminPadre = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: { id_usuario_nuevo: idUsuarioLogistica, id_rol_nuevo_usuario: 4 },
        select: {
          creador: {
            select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, id_rol: true },
          },
        },
      });

      if (!adminPadre?.creador) {
        throw new BadRequestException('No se encontró el admin padre de este usuario logística');
      }

      idUsuarioAdmin = adminPadre.creador.id_usuario;
      nombreAdmin = `${adminPadre.creador.nombre_usuario} ${adminPadre.creador.apellido_usuario}`;
    } else if (idRol === 2) {
      if (!idLogisticaParam) {
        throw new BadRequestException('id_logistica es requerido cuando el admin realiza esta operación');
      }

      idUsuarioAdmin = idUsuario;
      idUsuarioLogistica = idLogisticaParam;

      const userAdmin = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioAdmin },
        select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, id_rol: true },
      });

      if (!userAdmin || userAdmin.id_rol !== 2) {
        throw new BadRequestException('Usuario admin no encontrado');
      }

      nombreAdmin = `${userAdmin.nombre_usuario} ${userAdmin.apellido_usuario}`;

      const userLog = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioLogistica },
        select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true, id_rol: true },
      });

      if (!userLog || userLog.id_rol !== 4) {
        throw new BadRequestException('El usuario objetivo no es un usuario logística');
      }

      nombreLogistica = `${userLog.nombre_usuario} ${userLog.apellido_usuario}`;

      const esHijo = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: {
          id_usuario_creador: idUsuarioAdmin,
          id_usuario_nuevo: idUsuarioLogistica,
          id_rol_nuevo_usuario: 4,
        },
      });

      if (!esHijo) {
        throw new BadRequestException('El usuario logística no es hijo de este admin');
      }
    } else {
      throw new BadRequestException('Rol no autorizado para esta operación');
    }

    const esTransferencia = tipo_movimiento === 'ingreso' || tipo_movimiento === 'egreso';
    const esConsolidacion = tipo_movimiento === 'consolidacion';

    if (idRol === 4 && esConsolidacion) {
      // validación abajo, después de este bloque
    } else if (idRol === 2 && esConsolidacion) {
      throw new BadRequestException(
        `Solo el usuario logística (${nombreLogistica}) puede consolidar sus cuentas.`,
      );
    } else if (esTransferencia) {
      const esPagadorAdmin = idRol === 2;
      const idPagador = esPagadorAdmin ? idUsuarioAdmin : idUsuarioLogistica;
      const idReceptor = esPagadorAdmin ? idUsuarioLogistica : idUsuarioAdmin;
      const nombrePagador = esPagadorAdmin ? nombreAdmin : nombreLogistica;
      const nombreReceptor = esPagadorAdmin ? nombreLogistica : nombreAdmin;

      const notaReceptor = `Transferencia recibida${nota_opcional ? ' | ' + nota_opcional : ''}`;
      const notaPagador = `Transferencia enviada${nota_opcional ? ' | ' + nota_opcional : ''}`;

      try {
        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: idPagador,
          idUsuarioReceptor: idReceptor,
          monto,
          notaOpcional: notaReceptor,
          notaReceptorOpcional: notaReceptor,
          notaPagadorOpcional: notaPagador,
        });

        return {
          mensaje: 'Egreso registrado exitosamente', tipo_movimiento, monto,
          pagador: { id_usuario: idPagador, tipo: 'dinero_entregado', monto: -monto, id_transaccion: r.idTransaccionPagador },
          receptor: { id_usuario: idReceptor, tipo: 'dinero_recibido', monto, id_transaccion: r.idTransaccionReceptor },
        };
      } catch (error) {
        throw new BadRequestException(
          `Error al registrar egreso: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else {
      throw new BadRequestException(
        'tipo_movimiento inválido. Usa "ingreso", "egreso" o "consolidacion".',
      );
    }

    if (!esConsolidacion) {
      return; // unreachable, pero TypeScript necesita saberlo
    }

    const pendientesLogistica = await this.transaccionesService.getPendientes({
      idUsuario: idUsuarioLogistica,
    });

    const todosIds = pendientesLogistica.map(t => t.id_transaccion);
    const sumaPendientes = Math.round(
      pendientesLogistica.reduce((sum, t) => sum + parseFloat(t.monto.toString()), 0),
    );

    if (todosIds.length === 0) {
      throw new BadRequestException(
        'No hay transacciones pendientes del usuario logística. ' +
        'Usa tipo_movimiento: "egreso" para transferencia directa.',
      );
    }

    if (sumaPendientes < 0) {
      throw new BadRequestException(
        `El saldo pendiente es negativo (${sumaPendientes}). ` +
        'La empresa te debe dinero. Para prestar más dinero a la empresa, ' +
        'usa tipo_movimiento: "egreso" (transferencia directa, ambas en estado 1).',
      );
    }

    if (monto === 0 && sumaPendientes !== 0) {
      throw new BadRequestException(
        `No se puede consolidar con monto 0 porque hay ${sumaPendientes} en transacciones pendientes. ` +
        'Para cerrar sin mover dinero, la suma de las pendientes debe ser 0.',
      );
    }

    try {
      const notaTicket = monto === 0
        ? `Cierre de caja (saldo neto 0)${nota_opcional ? ' | ' + nota_opcional : ''}`
        : `Consolidación con abono de $${monto.toLocaleString('es-CO')}${nota_opcional ? ' | ' + nota_opcional : ''}`;
      const notaReceptor = `Abono recibido${nota_opcional ? ' | ' + nota_opcional : ''}`;

      const resultado = await this.transaccionesService.consolidar({
        idsPendientes: todosIds,
        montoPagado: monto,
        idUsuarioTicket: idUsuarioLogistica,
        idUsuarioReceptor: idUsuarioAdmin,
        idTipoTransaccionSaldo: 4,
        idTipoTransaccionSaldoNegativo: 5,
        notaOpcional: notaTicket,
        notaReceptorOpcional: notaReceptor,
      });

      return {
        mensaje: 'Consolidación con admin realizada exitosamente',
        tipo_movimiento, monto,
        monto_consolidado: resultado.montoConsolidado,
        transacciones_consolidadas: resultado.pendientesProcesadas,
        pago_completo: resultado.montoConsolidado === monto,
        ...(resultado.saldo && { saldo_pendiente: resultado.saldo.monto }),
        logistica: { id_usuario: idUsuarioLogistica, nombre_completo: nombreLogistica },
        admin: { id_usuario: idUsuarioAdmin, nombre_completo: nombreAdmin },
        ticket_consolidado: { id: resultado.idTicket, tipo: 'ticket_consolidado', monto: -resultado.montoConsolidado, funcion: 'pago_logistica' },
        transaccion_admin:  { id: resultado.idPagoReceptor, tipo: 'dinero_recibido', monto },
      };
    } catch (error) {
      throw new BadRequestException(`Error al consolidar con admin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async iniciarSurtido(id_nevera: number, id_usuario: number) {
    // Verificar que la nevera existe
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera },
      select: { id_nevera: true, id_estado_nevera: true }
    });

    if (!nevera) {
      throw new BadRequestException('Nevera no encontrada');
   }
    // VERIFICACIÓN: Validar que hoy se haya realizado calificación de inventario para esta nevera
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1); // Inicio del día siguiente

    // Buscar registro de stock_nevera con hora_calificacion de hoy para esta nevera específica
    const stockHoy = await this.databaseService.sTOCK_NEVERA.findFirst({
      where: {
        id_nevera: id_nevera,
        hora_calificacion: {
          gte: hoy,
          lt: mañana
        }
      },
      select: { hora_calificacion: true }
    });

    // Si no hay calificación de hoy, devolver error
    if (!stockHoy) {
      throw new BadRequestException('Primero debe distribuir el inventario antes de surtir');
    }

    // Cambiar estado a Surtiendo (5)
    await this.databaseService.nEVERAS.update({
      where: { id_nevera },
      data: { id_estado_nevera: 5 }
    });

    return {
      message: 'Surtido iniciado, estado de nevera cambiado a Surtiendo',
    };
  }

  async finalizarSurtido(id_nevera: number) {
    // Verificar que la nevera existe
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera },
      select: { id_nevera: true, id_estado_nevera: true }
    });

    if (!nevera) {
      throw new BadRequestException('Nevera no encontrada');
    }

    // Cambiar estado a Activa (2) y registrar hora de último surtido
    await this.databaseService.nEVERAS.update({
      where: { id_nevera },
      data: {
        id_estado_nevera: 2,
        hora_ultimo_surtido: new Date()
      }
    });

    return {
      message: 'Surtido finalizado, estado de nevera cambiado a Activa'
    };
  }

  async getEmpaquesPendientesPorNevera(
    idNevera: number,
    mesParam?: number,
    añoParam?: number,
  ) {
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera: idNevera },
      include: {
        tienda: {
          select: { id_tienda: true, nombre_tienda: true, id_usuario: true },
        },
      },
    });

    if (!nevera) {
      throw new BadRequestException('Nevera no encontrada');
    }

    const idUsuarioTienda = nevera.tienda.id_usuario;
    const now = new Date();
    const mes = mesParam || (now.getMonth() + 1);
    const año = añoParam || now.getFullYear();
    const fechaInicio = new Date(año, mes - 1, 1);
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999);

    const usuarioTienda = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: idUsuarioTienda },
      select: {
        fecha_creacion: true,
        nombre_usuario: true,
        apellido_usuario: true,
      },
    });

    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: idNevera,
        id_estado_empaque: 4,
      },
      select: {
        id_empaque: true,
        precio_venta_total: true,
        id_producto: true,
        promocion_id: true,
      },
    });

    const idsEmpaquesNevera = empaques.map(e => e.id_empaque);

    const idsProductos = Array.from(new Set(empaques.map(e => e.id_producto)));
    const idsPromociones = Array.from(new Set(empaques.filter(e => e.promocion_id !== null).map(e => e.promocion_id as number)));

    const productos = idsProductos.length > 0
      ? await this.databaseService.pRODUCTOS.findMany({
          where: { id_producto: { in: idsProductos } },
          select: {
            id_producto: true,
            nombre_producto: true,
            peso_nominal_g: true,
            precio_tienda: true,
          },
        })
      : [];

    let promociones: any[] = [];
    if (idsPromociones.length > 0) {
      promociones = await this.databaseService.pROMOCIONES.findMany({
        where: { id_promocion: { in: idsPromociones } },
      });
      promociones = promociones.map(p => ({
        id_promocion: p.id_promocion,
        nombre: p.nombre,
        tipo: p.tipo,
        valor: parseFloat(p.valor.toString()),
      }));
    }

    // PASO 1: Transacciones base — las del mes consultado para esta nevera,
    // y si es el periodo actual se incluyen también todas las pendientes
    // (estado 1) sin filtro de fecha.
    const whereBaseNevera: any = {
      id_usuario: idUsuarioTienda,
      id_nevera: idNevera,
    };

    const esMesActual = mes === (now.getMonth() + 1) && año === now.getFullYear();

    if (esMesActual) {
      whereBaseNevera.OR = [
        { hora_transaccion: { gte: fechaInicio, lte: fechaFin } },
        { estado_transaccion: 1 },
      ];
    } else {
      whereBaseNevera.hora_transaccion = { gte: fechaInicio, lte: fechaFin };
    }

    const transaccionesBase = await this.databaseService.tRANSACCIONES.findMany({
      where: whereBaseNevera,
      include: {
        estadoTransaccion: { select: { id_estado_transaccion: true, nombre_estado: true } },
        tipoTransaccion: { select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true } },
        empaque: { select: { id_empaque: true, EPC_id: true, id_nevera: true, costo_tienda: true } },
        transaccionRel: {
          select: {
            id_transaccion: true,
            hora_transaccion: true,
            nota_opcional: true,
            usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
          },
        },
      },
      orderBy: { hora_transaccion: 'desc' },
    });

    const todasLasTransacciones = [...transaccionesBase];
    const idsSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsConsolidados = transaccionesBase
      .filter(t => t.tipoTransaccion.nombre_codigo === 'ticket_consolidado')
      .map(t => t.id_transaccion);

    if (idsConsolidados.length > 0) {
      const relacionadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: idUsuarioTienda,
          id_nevera: idNevera,
          id_transaccion_rel: { in: idsConsolidados },
          id_transaccion: { notIn: [...idsSet] },
        },
        include: {
          estadoTransaccion: { select: { id_estado_transaccion: true, nombre_estado: true } },
          tipoTransaccion: { select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true } },
          empaque: { select: { id_empaque: true, EPC_id: true, id_nevera: true, costo_tienda: true } },
          transaccionRel: {
            select: {
              id_transaccion: true,
              hora_transaccion: true,
              nota_opcional: true,
              usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of relacionadas) {
        if (!idsSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    const consolidadosPosteriores = transaccionesBase
      .filter(t =>
        t.id_transaccion_rel !== null &&
        t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
        t.estadoTransaccion.id_estado_transaccion !== 1 &&
        !idsSet.has(t.id_transaccion_rel as number)
      )
      .map(t => ({
        id_transaccion: t.id_transaccion,
        id_empaque: t.id_empaque,
        id_transaccion_rel: t.id_transaccion_rel,
        monto: parseFloat(t.monto.toString()),
        hora_transaccion: t.hora_transaccion,
        nombre_tipo_transaccion: t.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: t.estadoTransaccion.nombre_estado,
        nota_opcional: t.nota_opcional,
        costo_tienda: t.empaque ? parseFloat(t.empaque.costo_tienda.toString()) : null,
        consolidado_posterior: {
          id_transaccion: t.transaccionRel!.id_transaccion,
          fecha_consolidacion: t.transaccionRel!.hora_transaccion,
          nota_opcional: t.transaccionRel!.nota_opcional,
        },
      }));

    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transaccionesFiltradas = todasLasTransacciones.filter(
      t => !new Set(consolidadosPosteriores.map(c => c.id_transaccion)).has(t.id_transaccion)
    );

    const idsConsolidadasParaPago = [
      ...transaccionesFiltradas
        .filter(t =>
          t.id_empaque === null &&
          t.tipoTransaccion.nombre_codigo !== 'ticket_consolidado' &&
          t.estadoTransaccion.id_estado_transaccion === 2,
        )
        .map(t => t.id_transaccion),
      ...consolidadosPosteriores.map(c => c.id_transaccion),
    ];

    const mapaInfoPago = new Map<number, { id_usuario_pago: number; nombre_usuario_pago: string; nota_opcional_pago: string | null }>();

    if (idsConsolidadasParaPago.length > 0) {
      const contrapartes = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_transaccion_rel: { in: idsConsolidadasParaPago },
          id_usuario: { not: idUsuarioTienda },
        },
        select: {
          id_transaccion_rel: true,
          id_usuario: true,
          nota_opcional: true,
          usuario: {
            select: { nombre_usuario: true, apellido_usuario: true },
          },
        },
      });

      for (const c of contrapartes) {
        if (c.id_transaccion_rel && !mapaInfoPago.has(c.id_transaccion_rel)) {
          mapaInfoPago.set(c.id_transaccion_rel, {
            id_usuario_pago: c.id_usuario,
            nombre_usuario_pago: `${c.usuario.nombre_usuario} ${c.usuario.apellido_usuario}`,
            nota_opcional_pago: c.nota_opcional,
          });
        }
      }
    }

    const consolidadosPosterioresConPago = consolidadosPosteriores.map(cp => {
      const infoPago = mapaInfoPago.get(cp.id_transaccion);
      return {
        id_transaccion: cp.id_transaccion,
        id_empaque: cp.id_empaque,
        id_transaccion_rel: cp.id_transaccion_rel,
        monto: cp.monto,
        hora_transaccion: cp.hora_transaccion,
        nombre_tipo_transaccion: cp.nombre_tipo_transaccion,
        nombre_estado_transaccion: cp.nombre_estado_transaccion,
        nota_opcional: cp.nota_opcional,
        costo_tienda: cp.costo_tienda,
        ...(infoPago && { info_pago: infoPago }),
        consolidado_posterior: {
          id_transaccion: cp.consolidado_posterior.id_transaccion,
          fecha_consolidacion: cp.consolidado_posterior.fecha_consolidacion,
        },
      };
    });

    const transaccionesFormateadas = transaccionesFiltradas.map(t => {
      const infoPago = t.id_empaque === null
        ? (mapaInfoPago.get(t.id_transaccion) ??
           (t.transaccionRel ? {
             id_usuario_pago: t.transaccionRel.usuario.id_usuario,
             nombre_usuario_pago: `${t.transaccionRel.usuario.nombre_usuario} ${t.transaccionRel.usuario.apellido_usuario}`,
             nota_opcional_pago: t.transaccionRel.nota_opcional,
           } : null))
        : null;

      return {
        id_transaccion: t.id_transaccion,
        id_empaque: t.id_empaque,
        id_transaccion_rel: t.id_transaccion_rel,
        monto: parseFloat(t.monto.toString()),
        hora_transaccion: t.hora_transaccion,
        nombre_tipo_transaccion: t.tipoTransaccion.nombre_codigo,
        nombre_estado_transaccion: t.estadoTransaccion.nombre_estado,
        nota_opcional: t.nota_opcional,
        costo_tienda: t.empaque ? parseFloat(t.empaque.costo_tienda.toString()) : null,
        ...(infoPago && { info_pago: infoPago }),
      };
    });

    const empaquesFormateados = empaques.map(e => ({
      id_empaque: e.id_empaque,
      precio_venta_total: Math.ceil(parseFloat(e.precio_venta_total.toString())),
      id_producto: e.id_producto,
      promocion: e.promocion_id,
    }));

    return {
      nevera: {
        id_nevera: nevera.id_nevera,
        id_tienda: nevera.tienda.id_tienda,
        nombre_tienda: nevera.tienda.nombre_tienda,
      },
      empaques: empaquesFormateados,
      productos,
      promociones,
      transacciones: transaccionesFormateadas,
      consolidados_posteriores: consolidadosPosterioresConPago,
      fecha_creacion_usuario: usuarioTienda?.fecha_creacion ?? null,
      nombre_usuario: usuarioTienda?.nombre_usuario ?? null,
      apellido_usuario: usuarioTienda?.apellido_usuario ?? null,
      periodo: { mes, año },
      fecha_inicio_periodo: fechaInicio,
      fecha_fin_periodo: fechaFin,
      total_transacciones: transaccionesFormateadas.length,
      parametros_usados: {
        mes_pedido: mesParam || null,
        año_pedido: añoParam || null,
        mes_devuelto: mes,
        año_devuelto: año,
        es_periodo_actual: esMesActual,
      },
    };
  }

  async getHistorialTienda(
    idUsuario: number,
    mesParam?: number,
    añoParam?: number,
  ) {
    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: idUsuario },
      select: { id_usuario: true },
    });

    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: idUsuario },
      select: { id_tienda: true },
    });

    const tiendaIds = tiendas.map(t => t.id_tienda);

    if (tiendaIds.length === 0) {
      return {
        neveras: [],
        fecha_creacion_usuario: null,
        nombre_usuario: null,
        apellido_usuario: null,
        periodo: null,
        fecha_inicio_periodo: null,
        fecha_fin_periodo: null,
        parametros_usados: null,
      };
    }

    const neveras = await this.databaseService.nEVERAS.findMany({
      where: { id_tienda: { in: tiendaIds } },
      select: { id_nevera: true },
    });

    const resultados: any[] = [];
    for (const nevera of neveras) {
      const data = await this.getEmpaquesPendientesPorNevera(
        nevera.id_nevera,
        mesParam,
        añoParam,
      );
      resultados.push(data);
    }

    if (resultados.length === 0) {
      return {
        neveras: [],
        fecha_creacion_usuario: null,
        nombre_usuario: null,
        apellido_usuario: null,
        periodo: null,
        fecha_inicio_periodo: null,
        fecha_fin_periodo: null,
        parametros_usados: null,
      };
    }

    const primerResultado = resultados[0];

    const neverasData = resultados.map(r => ({
      nevera: r.nevera,
      empaques: r.empaques,
      productos: r.productos,
      promociones: r.promociones,
      transacciones: r.transacciones,
      total_transacciones: r.total_transacciones,
    }));

    return {
      neveras: neverasData,
      fecha_creacion_usuario: primerResultado.fecha_creacion_usuario,
      nombre_usuario: primerResultado.nombre_usuario,
      apellido_usuario: primerResultado.apellido_usuario,
      periodo: primerResultado.periodo,
      fecha_inicio_periodo: primerResultado.fecha_inicio_periodo,
      fecha_fin_periodo: primerResultado.fecha_fin_periodo,
      parametros_usados: primerResultado.parametros_usados,
    };
  }

  async liquidarNevera(
    idNevera: number,
    idUsuarioLogistico: number,
    liquidacionDto: LiquidacionNeveraDto,
  ) {
    const { monto, nota_opcional, empaques: idsEmpaques, tipo_movimiento } = liquidacionDto;
    const esTransferencia = tipo_movimiento === 'ingreso' || tipo_movimiento === 'egreso';
    const esConsolidacion = tipo_movimiento === 'consolidacion';

    if (!esTransferencia && !esConsolidacion) {
      throw new BadRequestException(
        'tipo_movimiento inválido. Usa "ingreso", "egreso" o "consolidacion".',
      );
    }

    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera: idNevera },
      include: {
        tienda: {
          select: { id_tienda: true, nombre_tienda: true, id_usuario: true },
        },
      },
    });

    if (!nevera) {
      throw new BadRequestException('Nevera no encontrada');
    }

    const idUsuarioTienda = nevera.tienda.id_usuario;
    const fechaAhora = new Date();

    const [logisticoInfo, tiendaInfo] = await Promise.all([
      this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioLogistico },
        select: { nombre_usuario: true },
      }),
      this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: idUsuarioTienda },
        select: { nombre_usuario: true },
      }),
    ]);

    const nombreLogistico = logisticoInfo?.nombre_usuario || 'Logistico';
    const nombreTienda = tiendaInfo?.nombre_usuario || 'Tienda';

    if (esTransferencia) {
      if (monto <= 0) {
        throw new BadRequestException('El monto debe ser mayor a 0 para una transferencia.');
      }

      const notaAbono = `Abono a la NEVERA #${idNevera}${nota_opcional ? ' | ' + nota_opcional : ''}`;

      try {
        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: idUsuarioTienda,
          idUsuarioReceptor: idUsuarioLogistico,
          monto,
          notaOpcional: notaAbono,
          idNevera,
        });

        return {
          message: `Abono recibido: $${monto.toLocaleString('es-CO')}`,
          id_transaccion_receptor: r.idTransaccionReceptor,
          id_transaccion_pagador: r.idTransaccionPagador,
          monto,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Error al registrar abono: ${errorMessage}`);
      }
    }

    // ─── CONSOLIDACION ───

    // ─── CASO A: Liquidación con empaques ───
    if (idsEmpaques && idsEmpaques.length > 0) {
      const empaquesEncontrados = await this.databaseService.eMPAQUES.findMany({
        where: {
          id_empaque: { in: idsEmpaques },
          id_nevera: idNevera,
          id_estado_empaque: 4,
        },
        include: {
          producto: {
            select: {
              id_producto: true,
              nombre_producto: true,
              precio_tienda: true,
            },
          },
          promocion: {
            select: {
              id_promocion: true,
              valor: true,
            },
          },
        },
      });

      const idsEncontrados = new Set(empaquesEncontrados.map(e => e.id_empaque));
      const idsNoEncontrados = idsEmpaques.filter(id => !idsEncontrados.has(id));

      if (idsNoEncontrados.length > 0) {
        throw new BadRequestException({
          error: 'Algunos empaques no están en estado pendiente de pago o no pertenecen a esta nevera',
          empaques_no_validos: idsNoEncontrados,
        });
      }

      if (empaquesEncontrados.length === 0) {
        throw new BadRequestException('No hay empaques válidos para procesar');
      }

      const detallesCalculo: any[] = [];
      let totalLiquidar = 0;

      for (const empaque of empaquesEncontrados) {
        const precioVenta = parseFloat(empaque.precio_venta_total.toString());
        const precioTiendaPorcentaje = parseFloat(empaque.producto.precio_tienda.toString());
        const tienePromocion = empaque.promocion !== null;
        const valorPromocion = tienePromocion
          ? parseFloat(empaque.promocion!.valor.toString())
          : 0;

        const descuento = tienePromocion
          ? Math.ceil(precioVenta * valorPromocion / 100)
          : 0;

        const precioConDescuento = precioVenta - descuento;

        const tiendaComision = Math.ceil(precioConDescuento * precioTiendaPorcentaje / 100);

        let liquidar = precioConDescuento - tiendaComision;
        liquidar = Math.ceil(liquidar);

        totalLiquidar += liquidar;

        detallesCalculo.push({
          id_empaque: empaque.id_empaque,
          id_producto: empaque.producto.id_producto,
          nombre_producto: empaque.producto.nombre_producto,
          precio_venta: precioVenta,
          promocion_id: empaque.promocion?.id_promocion ?? null,
          valor_promocion: valorPromocion,
          descuento,
          precio_con_descuento: precioConDescuento,
          porcentaje_tienda: precioTiendaPorcentaje,
          comision_tienda: tiendaComision,
          liquidar,
        });
      }

      const transaccionesPendientesPrevias = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: idUsuarioTienda,
          id_nevera: idNevera,
          estado_transaccion: 1,
        },
        select: { id_transaccion: true, monto: true },
      });

      const idsPendientesPrevias = transaccionesPendientesPrevias.map(t => t.id_transaccion);
      const montoPendientesPrevias = transaccionesPendientesPrevias.reduce(
        (sum, t) => sum + parseFloat(t.monto.toString()), 0,
      );

      if (monto <= 0) {
        throw new BadRequestException(
          'Al liquidar empaques el monto debe ser mayor a 0.',
        );
      }

      totalLiquidar += montoPendientesPrevias;
      totalLiquidar = Math.round(totalLiquidar);

      if (totalLiquidar <= 0) {
        throw new BadRequestException(
          'El saldo a favor del usuario supera o iguala el valor de los empaques. Use la opción sin empaques para ajustar saldos directamente.',
        );
      }

      return await this.ejecutarLiquidacion(
        idNevera, idUsuarioTienda, idUsuarioLogistico,
        monto, totalLiquidar, nota_opcional, fechaAhora,
        detallesCalculo, nombreTienda, nombreLogistico,
        idsPendientesPrevias,
      );
    }

    // ─── CASO B: Consolidación sin empaques ───
    const transaccionesPendientes = await this.transaccionesService.getPendientes({
      idUsuario: idUsuarioTienda,
      idNevera: idNevera,
    });

    if (transaccionesPendientes.length === 0) {
      throw new BadRequestException(
        'No hay transacciones pendientes para esta nevera. ' +
        'Usa tipo_movimiento: "ingreso" para transferencia directa.',
      );
    }

    const idsTransaccionesPendientes = transaccionesPendientes.map(t => t.id_transaccion);

    const montoTotalPendientes = transaccionesPendientes.reduce(
      (sum, t) => sum + parseFloat(t.monto.toString()),
      0,
    );

    if (monto === 0 && Math.round(montoTotalPendientes) !== 0) {
      throw new BadRequestException(
        'No se puede liquidar con monto 0 si la suma de transacciones pendientes es diferente de 0.',
      );
    }

    try {
      const notaTicket = `Consolidación con abono de $${monto.toLocaleString('es-CO')} a la NEVERA #${idNevera}${nota_opcional ? ' | ' + nota_opcional : ''}`;
      const notaReceptor = `Abono a la NEVERA #${idNevera}${nota_opcional ? ' | ' + nota_opcional : ''}`;

      const resultado = await this.transaccionesService.consolidar({
        idsPendientes: idsTransaccionesPendientes,
        montoPagado: monto,
        idUsuarioTicket: idUsuarioTienda,
        idUsuarioReceptor: idUsuarioLogistico,
        idTipoTransaccionSaldo: 4,
        idTipoTransaccionSaldoNegativo: 5,
        notaOpcional: notaTicket,
        notaReceptorOpcional: notaReceptor,
        notaSaldoPendiente: 'Saldo pendiente por liquidar | ',
        idNevera,
      });

      return {
        message: `Pago consolidado: $${monto.toLocaleString('es-CO')}${resultado.saldo?.monto ? ` (saldo pendiente: $${resultado.saldo.monto})` : ''}`,
        id_ticket: resultado.idTicket,
        monto_consolidado: resultado.montoConsolidado,
        monto_recibido: monto,
        saldo_pendiente: resultado.saldo?.monto ?? 0,
        pendientes_procesadas: resultado.pendientesProcesadas,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al consolidar pendientes de nevera: ${errorMessage}`);
    }
  }

  async decincoaseis(idUsuario: number, dto: DecincoaseisDto) {
    const { timestamp, pending_packages } = dto;

    const usuarioLogistica = await this.databaseService.lOGISTICA.findFirst({
      where: { id_usuario: idUsuario },
      select: { id_logistica: true },
    });

    if (!usuarioLogistica) {
      throw new BadRequestException('Usuario no tiene logística asociada');
    }

    const idLogistica = usuarioLogistica.id_logistica;
    const fechaAhora = new Date();

    const empaquesValidos: any[] = [];
    const empaquesInvalidos: any[] = [];

    for (const packageData of pending_packages) {
      const { epc, id_empaque } = packageData;

      let empaque;
      if (epc) {
        empaque = await this.databaseService.eMPAQUES.findUnique({
          where: { EPC_id: epc },
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true,
              },
            },
          },
        });
      } else if (id_empaque) {
        empaque = await this.databaseService.eMPAQUES.findUnique({
          where: { id_empaque: id_empaque },
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true,
              },
            },
          },
        });
      }

      if (!empaque) {
        empaquesInvalidos.push({
          epc: epc || null,
          id_empaque: id_empaque || null,
          error: `Empaque no encontrado: ${epc || id_empaque}`,
        });
      } else if (empaque.id_estado_empaque !== 5) {
        empaquesInvalidos.push({
          epc: epc || null,
          id_empaque: id_empaque || null,
          error: `Empaque no está en estado 5 (para cambio), estado actual: ${empaque.id_estado_empaque}`,
        });
      } else {
        empaquesValidos.push({
          empaque,
          epc: epc || null,
          id_empaque: id_empaque || null,
        });
      }
    }

    if (empaquesValidos.length === 0) {
      throw new HttpException(
        {
          success: false,
          error: 'Ningún empaque pudo ser procesado',
          empaques_no_procesados: empaquesInvalidos,
          code: 'NO_EMPAQUES_VALIDOS',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    let empaquesActualizados: any[] = [];

    empaquesActualizados = await this.databaseService.$transaction(
      async (prisma) => {
        const resultados: any[] = [];

        for (const packageData of empaquesValidos) {
          const { empaque, epc, id_empaque } = packageData;

          const empaqueActualizado = await prisma.eMPAQUES.update({
            where: { id_empaque: empaque.id_empaque },
            data: {
              id_estado_empaque: 6,
              id_logistica: idLogistica,
              hora_para_cambio_5: fechaAhora,
            },
            include: {
              producto: {
                select: {
                  id_producto: true,
                  nombre_producto: true,
                },
              },
            },
          });

          if (empaque.id_nevera && empaque.id_producto) {
            await prisma.sTOCK_NEVERA.updateMany({
              where: {
                id_nevera: empaque.id_nevera,
                id_producto: empaque.id_producto,
              },
              data: { mensaje_sistema: null },
            });
          }

          resultados.push({
            id_empaque: empaqueActualizado.id_empaque,
            epc: empaqueActualizado.EPC_id,
            peso_exacto_g: empaqueActualizado.peso_exacto_g,
            id_producto: empaqueActualizado.producto.id_producto,
            nombre_producto: empaqueActualizado.producto.nombre_producto,
            nuevo_estado: empaqueActualizado.id_estado_empaque,
            id_logistica: empaqueActualizado.id_logistica,
            hora_para_cambio_5: empaqueActualizado.hora_para_cambio_5,
          });
        }

        return resultados;
      },
    );

    const success = true;
    const message =
      empaquesInvalidos.length === 0
        ? 'Cambio de estado 5 a 6 completado exitosamente'
        : `Se procesaron ${empaquesValidos.length} empaques válidos, ${empaquesInvalidos.length} no pudieron procesarse`;

    return {
      success,
      message,
      empaques_procesados: empaquesActualizados,
      empaques_no_procesados: empaquesInvalidos,
    };
  }

  async seisasiete(dto: SeisasieteDto) {
    const { id_empaque } = dto;

    const empaque = await this.databaseService.eMPAQUES.findUnique({
      where: { id_empaque },
    });

    if (!empaque) {
      throw new BadRequestException(`Empaque ${id_empaque} no encontrado`);
    }

    if (empaque.id_estado_empaque !== 6) {
      throw new BadRequestException(
        `El empaque ${id_empaque} no está en estado 6 (estado actual: ${empaque.id_estado_empaque})`,
      );
    }

    const fechaAhora = new Date();

    await this.databaseService.eMPAQUES.update({
      where: { id_empaque },
      data: {
        id_estado_empaque: 7,
        fecha_finalizacion_7_8: fechaAhora,
      },
    });

    return {
      message: `Empaque ${id_empaque} dado de baja exitosamente`,
      id_empaque,
      estado_anterior: 6,
      estado_nuevo: 7,
    };
  }

  private async ejecutarLiquidacion(
    idNevera: number,
    idUsuarioTienda: number,
    idUsuarioLogistico: number,
    monto: number,
    totalLiquidar: number,
    nota_opcional: string | undefined,
    fechaAhora: Date,
    detallesCalculo: any[],
    nombreTienda: string,
    nombreLogistico: string,
    idsPendientesPrevias: number[],
  ) {
    const idsEmpaquesStr = detallesCalculo.map(d => d.id_empaque).join(',');

    try {
      const resultado = await this.databaseService.$transaction(async (prisma) => {
        const notaTicket = `Consolidación con abono de $${monto.toLocaleString('es-CO')} | NEVERA #${idNevera} | EMPAQUES:${idsEmpaquesStr}${nota_opcional ? ' | ' + nota_opcional : ''}`;
        const notaReceptor = `Abono a la NEVERA #${idNevera}${nota_opcional ? ' | ' + nota_opcional : ''}`;

        const consolidado = await this.transaccionesService.consolidarEnTx(prisma, {
          idsPendientes: idsPendientesPrevias,
          montoPagado: monto,
          montoConsolidado: totalLiquidar,
          idUsuarioTicket: idUsuarioTienda,
          idUsuarioReceptor: idUsuarioLogistico,
          idTipoTransaccionSaldo: 4,
          idTipoTransaccionSaldoNegativo: 5,
          idNevera,
          notaOpcional: notaTicket,
          notaReceptorOpcional: notaReceptor,
          notaSaldoPendiente: 'Saldo pendiente por liquidar | ',
        });

        const transaccionesEmpaques: any[] = [];
        for (const detalle of detallesCalculo) {
          const idVenta = await this.transaccionesService.crearTransaccionEnTx(prisma, {
            id_empaque: detalle.id_empaque,
            id_usuario: idUsuarioTienda,
            id_transaccion_rel: consolidado.idTicket,
            monto: detalle.liquidar,
            id_tipo_transaccion: 1,
            nota_opcional: `Venta empaque #${detalle.id_empaque} - ${detalle.nombre_producto}${detalle.promocion_id ? ` (promo ${detalle.valor_promocion}% dto)` : ''}`,
            estado_transaccion: 2,
            id_nevera: idNevera,
          });

          transaccionesEmpaques.push({
            id_transaccion: idVenta,
            id_empaque: detalle.id_empaque,
            producto: detalle.nombre_producto,
            liquidar: detalle.liquidar,
          });

          await prisma.eMPAQUES.update({
            where: { id_empaque: detalle.id_empaque },
            data: {
              id_estado_empaque: 8,
              costo_tienda: detalle.comision_tienda,
              fecha_finalizacion_7_8: fechaAhora,
            },
          });
        }

        return {
          id_transaccion_consolidada: consolidado.idTicket,
          id_transaccion_pago: consolidado.idPagoReceptor,
          total_liquidado: totalLiquidar,
          monto_recibido: monto,
          saldo_pendiente: consolidado.saldo?.monto ?? 0,
          transacciones_empaques: transaccionesEmpaques,
        };
      });

      return {
        message: `Liquidación: $${monto.toLocaleString('es-CO')}${resultado.saldo_pendiente ? ` (saldo pendiente: $${resultado.saldo_pendiente})` : ''}`,
        id_ticket: resultado.id_transaccion_consolidada,
        total_liquidado: totalLiquidar,
        monto_recibido: monto,
        saldo_pendiente: resultado.saldo_pendiente,
        empaques: detallesCalculo.length,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al liquidar nevera: ${errorMessage}`);
    }
  }
}