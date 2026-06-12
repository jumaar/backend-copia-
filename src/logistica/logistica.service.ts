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
    idUsuarioTarget?: number,
    accessibleUserIds?: number[],
  ) {
    const idsAccesibles = accessibleUserIds || [id_usuario];

    // ═══════════════════════════════════════════════════════════════
    // CASO ADMIN (rol 1 o 2) SIN target: devolver lista de usuarios
    // logística que son sus descendientes
    // ═══════════════════════════════════════════════════════════════
    if ((id_rol === 1 || id_rol === 2) && !idUsuarioTarget) {
      const usuariosLogistica = await this.databaseService.uSUARIOS.findMany({
        where: {
          id_usuario: { in: idsAccesibles },
          id_rol: 4,
          activo: true,
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
      if (idUsuarioTarget !== id_usuario && !idsAccesibles.includes(idUsuarioTarget)) {
        throw new ForbiddenException('No tienes acceso a este usuario logístico');
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

    let usuariosPermitidos: number[] = idsAccesibles;

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
                ciudad: true,
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
            nota_opcional: true,
            usuario: {
              select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
            },
          },
        },
      },
      orderBy: { hora_transaccion: 'desc' },
    });

    // PASO 2: Búsqueda hacia adelante — transacciones referenciadas por las
    // del resultado base (vía id_transaccion_rel). Cuando se consulta un mes
    // histórico, las transacciones consolidadas apuntan al ticket de ese mes
    // (que puede estar en un mes posterior). Sin este paso, el ticket no aparece.
    const todasLasTransacciones = [...transaccionesBase];
    const idsBaseSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsForward = transaccionesBase
      .map(t => t.id_transaccion_rel)
      .filter(id => id !== null && !idsBaseSet.has(id as number)) as number[];

    if (idsForward.length > 0) {
      const transaccionesForward = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: id_usuario,
          id_transaccion: { in: idsForward },
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
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesForward) {
        if (!idsBaseSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
          idsBaseSet.add(t.id_transaccion);
        }
      }
    }

    // PASO 3: Búsqueda inversa — transacciones cuyo id_transaccion_rel apunta
    // a cualquiera del resultado combinado (base + forward). Captura las
    // pendientes viejas que fueron consolidadas en este mes (estado 2 vinculadas
    // al ticket del mes actual).
    if (todasLasTransacciones.length > 0) {
      const idsCombinados = todasLasTransacciones.map(t => t.id_transaccion);
      const idsCombinadosSet = new Set(idsCombinados);

      const transaccionesReferenciadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: id_usuario,
          id_transaccion_rel: { in: idsCombinados },
          id_transaccion: { notIn: idsCombinados },
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
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesReferenciadas) {
        if (!idsCombinadosSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    // Ordenar todas las transacciones por fecha descendente
    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transacciones = todasLasTransacciones;

    // Formatear las transacciones para la respuesta (solo campos esenciales)
    const transaccionesFormateadas = transacciones.map(transaccion => {
      // Solo agregar info_pago en transacciones consolidadas (id_empaque = null)
      const infoPago = (transaccion.id_empaque === null && transaccion.transaccionRel) ? {
        id_usuario_pago: transaccion.transaccionRel.usuario.id_usuario,
        nombre_usuario_pago: `${transaccion.transaccionRel.usuario.nombre_usuario} ${transaccion.transaccionRel.usuario.apellido_usuario}`,
        nota_opcional_pago: transaccion.transaccionRel.nota_opcional
      } : null;

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
  async getNeverasActivas(id_usuario: number, accessibleUserIds?: number[]) {
    const idsAccesibles = accessibleUserIds || [id_usuario];

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

    // Obtener tiendas de los usuarios accesibles (ya resueltos por el guard)
    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: { in: idsAccesibles } },
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
            ciudad: true
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
    const { monto, nota_opcional } = consolidacionDto;

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

    const transaccionesPendientes = await this.transaccionesService.getPendientes({
      idUsuario: id_usuario_consolidar,
    });

    if (monto === 0 && transaccionesPendientes.length === 0) {
      throw new BadRequestException(
        'No se puede realizar una consolidación con monto 0 si no hay transacciones pendientes.',
      );
    }

    if (transaccionesPendientes.length === 0) {
      try {
        const notaConMonto = nota_opcional
          ? `${nota_opcional} - Monto abonado: ${monto}`
          : `Monto abonado: ${monto}`;

        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: id_usuario_credenciales,
          idUsuarioReceptor: id_usuario_consolidar,
          monto,
          notaOpcional: notaConMonto,
          tipoReceptor: 2,
          montoReceptorNegativo: true,
          notaReceptorOpcional: 'monto adelantado pendiente',
        });

        return {
          message: 'Abono adelantado registrado exitosamente',
          resumen: {
            usuario_consolidado: id_usuario_consolidar,
            usuario_acreedor: id_usuario_credenciales,
            monto_abonado: monto,
            tipo_operacion: 'adelanto_sin_deuda'
          }
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Error al registrar abono adelantado: ${errorMessage}`);
      }
    }

    const idsPendientes = transaccionesPendientes.map(t => t.id_transaccion);

    try {
      await this.transaccionesService.consolidar({
        idsPendientes,
        montoPagado: monto,
        idUsuarioTicket: id_usuario_consolidar,
        idUsuarioPagador: id_usuario_credenciales,
        notaOpcional: nota_opcional
          ? `${nota_opcional} - ${monto === 0 ? 'Cierre de caja (saldo neto 0)' : `Monto abonado: ${monto}`}`
          : monto === 0
            ? 'Cierre de caja — transacciones pendientes con saldo neto 0'
            : `Monto abonado: ${monto}`,
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

  async getHermanosLogisticaPorScope(requesterId: number, requesterRole: number, accessibleUserIds: number[]) {
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
        id_usuario: { in: accessibleUserIds },
        id_rol: 4,
        activo: true,
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
    const idsBaseSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsForward = transaccionesBase
      .map(t => t.id_transaccion_rel)
      .filter(id => id !== null && !idsBaseSet.has(id as number)) as number[];

    if (idsForward.length > 0) {
      const transaccionesForward = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario,
          id_transaccion: { in: idsForward },
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
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesForward) {
        if (!idsBaseSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
          idsBaseSet.add(t.id_transaccion);
        }
      }
    }

    if (todasLasTransacciones.length > 0) {
      const idsCombinados = todasLasTransacciones.map(t => t.id_transaccion);
      const idsCombinadosSet = new Set(idsCombinados);

      const transaccionesReferenciadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario,
          id_transaccion_rel: { in: idsCombinados },
          id_transaccion: { notIn: idsCombinados },
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
              nota_opcional: true,
              usuario: {
                select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true },
              },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesReferenciadas) {
        if (!idsCombinadosSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transacciones = todasLasTransacciones;

    const transaccionesFormateadas = transacciones.map(transaccion => {
      const infoPago = (transaccion.id_empaque === null && transaccion.transaccionRel) ? {
        id_usuario_pago: transaccion.transaccionRel.usuario.id_usuario,
        nombre_usuario_pago: `${transaccion.transaccionRel.usuario.nombre_usuario} ${transaccion.transaccionRel.usuario.apellido_usuario}`,
        nota_opcional_pago: transaccion.transaccionRel.nota_opcional,
      } : null;

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
    } else if (esTransferencia) {
      const esPagadorAdmin = idRol === 2;
      const idPagador = esPagadorAdmin ? idUsuarioAdmin : idUsuarioLogistica;
      const idReceptor = esPagadorAdmin ? idUsuarioLogistica : idUsuarioAdmin;
      const nombrePagador = esPagadorAdmin ? nombreAdmin : nombreLogistica;
      const nombreReceptor = esPagadorAdmin ? nombreLogistica : nombreAdmin;

      const nReceptor = nota_opcional
        ? `Egreso de ${nombrePagador} - ${nota_opcional}`
        : `Egreso de ${nombrePagador}`;
      const nPagador = nota_opcional
        ? `Entrega a ${nombreReceptor} - ${nota_opcional}`
        : `Entrega a ${nombreReceptor}`;

      try {
        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: idPagador,
          idUsuarioReceptor: idReceptor,
          monto,
          notaOpcional: nReceptor,
          notaReceptorOpcional: nReceptor,
          notaPagadorOpcional: nPagador,
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
      const resultado = await this.transaccionesService.consolidar({
        idsPendientes: todosIds,
        montoPagado: monto,
        idUsuarioTicket: idUsuarioLogistica,
        idUsuarioReceptor: idUsuarioAdmin,
        idTipoTransaccionSaldo: 4,
        idTipoTransaccionSaldoNegativo: 5,
        notaOpcional: nota_opcional
          ? `${nota_opcional} - ${monto === 0 ? 'Cierre de caja (saldo neto 0)' : `Consolidación logística (${nombreLogistica})`}`
          : monto === 0
            ? 'Cierre de caja — transacciones pendientes con saldo neto 0'
            : `Consolidación logística (${nombreLogistica})`,
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
            nota_opcional: true,
            usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
          },
        },
      },
      orderBy: { hora_transaccion: 'desc' },
    });

    // PASO 2: Búsqueda hacia adelante — transacciones referenciadas por las
    // del resultado base (vía id_transaccion_rel). Captura el ticket de
    // consolidación cuando se consulta un mes anterior al de la consolidación.
    const todasLasTransacciones = [...transaccionesBase];
    const idsBaseSet = new Set(transaccionesBase.map(t => t.id_transaccion));

    const idsForward = transaccionesBase
      .map(t => t.id_transaccion_rel)
      .filter(id => id !== null && !idsBaseSet.has(id as number)) as number[];

    if (idsForward.length > 0) {
      const transaccionesForward = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: idUsuarioTienda,
          id_nevera: idNevera,
          id_transaccion: { in: idsForward },
        },
        include: {
          estadoTransaccion: { select: { id_estado_transaccion: true, nombre_estado: true } },
          tipoTransaccion: { select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true } },
          empaque: { select: { id_empaque: true, EPC_id: true, id_nevera: true, costo_tienda: true } },
          transaccionRel: {
            select: {
              id_transaccion: true,
              nota_opcional: true,
              usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesForward) {
        if (!idsBaseSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
          idsBaseSet.add(t.id_transaccion);
        }
      }
    }

    // PASO 3: Búsqueda inversa — transacciones cuyo id_transaccion_rel apunta
    // a cualquiera del resultado combinado (base + forward).
    if (todasLasTransacciones.length > 0) {
      const idsCombinados = todasLasTransacciones.map(t => t.id_transaccion);
      const idsCombinadosSet = new Set(idsCombinados);

      const transaccionesReferenciadas = await this.databaseService.tRANSACCIONES.findMany({
        where: {
          id_usuario: idUsuarioTienda,
          id_nevera: idNevera,
          id_transaccion_rel: { in: idsCombinados },
          id_transaccion: { notIn: idsCombinados },
        },
        include: {
          estadoTransaccion: { select: { id_estado_transaccion: true, nombre_estado: true } },
          tipoTransaccion: { select: { id_tipo: true, nombre_codigo: true, descripcion_amigable: true } },
          empaque: { select: { id_empaque: true, EPC_id: true, id_nevera: true, costo_tienda: true } },
          transaccionRel: {
            select: {
              id_transaccion: true,
              nota_opcional: true,
              usuario: { select: { id_usuario: true, nombre_usuario: true, apellido_usuario: true } },
            },
          },
        },
        orderBy: { hora_transaccion: 'desc' },
      });

      for (const t of transaccionesReferenciadas) {
        if (!idsCombinadosSet.has(t.id_transaccion)) {
          todasLasTransacciones.push(t);
        }
      }
    }

    todasLasTransacciones.sort((a, b) =>
      new Date(b.hora_transaccion).getTime() - new Date(a.hora_transaccion).getTime(),
    );

    const transaccionesFormateadas = todasLasTransacciones.map(t => {
      const infoPago = (t.id_empaque === null && t.transaccionRel)
        ? {
            id_usuario_pago: t.transaccionRel.usuario.id_usuario,
            nombre_usuario_pago: `${t.transaccionRel.usuario.nombre_usuario} ${t.transaccionRel.usuario.apellido_usuario}`,
            nota_opcional_pago: t.transaccionRel.nota_opcional,
          }
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
    const { monto, nota_opcional, empaques: idsEmpaques } = liquidacionDto;

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

    // ─── CASO B: Liquidación sin empaques (procesar transacciones pendientes) ───
    const transaccionesPendientes = await this.transaccionesService.getPendientes({
      idUsuario: idUsuarioTienda,
      idNevera: idNevera,
    });

    if (transaccionesPendientes.length === 0) {
      if (monto <= 0) {
        throw new BadRequestException(
          'No hay transacciones pendientes. El monto debe ser mayor a 0.',
        );
      }

      const montoAdelanto = Math.abs(monto);
      const notaPago = `Cobrado por: ${nombreLogistico} (ID: ${idUsuarioLogistico}) | Nota: adelanto de $${montoAdelanto.toLocaleString('es-CO')} hecho por el usuario tienda (ID: ${idUsuarioTienda}) | #NEVERA:${idNevera}`;

      try {
        const r = await this.transaccionesService.transferenciaDirecta({
          idUsuarioPagador: idUsuarioTienda,
          idUsuarioReceptor: idUsuarioLogistico,
          monto: montoAdelanto,
          notaOpcional: notaPago,
          idNevera,
        });

        return {
          message: 'Adelanto registrado exitosamente',
          resumen: {
            nevera: { id_nevera: idNevera, nombre_tienda: nevera.tienda.nombre_tienda },
            usuario_tienda: idUsuarioTienda,
            usuario_logistico: idUsuarioLogistico,
            monto_adelantado: montoAdelanto,
          },
          transacciones: {
            id_transaccion_receptor: r.idTransaccionReceptor,
            id_transaccion_pagador: r.idTransaccionPagador,
            monto_adelantado: montoAdelanto,
          },
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Error al registrar adelanto: ${errorMessage}`);
      }
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
      const notaPago = `Cobrado por: ${nombreLogistico} (ID: ${idUsuarioLogistico}) | Nota: abono de $${monto.toLocaleString('es-CO')} hecho por el usuario tienda (ID: ${idUsuarioTienda}) | #NEVERA:${idNevera}`;

      const resultado = await this.transaccionesService.consolidar({
        idsPendientes: idsTransaccionesPendientes,
        montoPagado: monto,
        idUsuarioTicket: idUsuarioTienda,
        idUsuarioReceptor: idUsuarioLogistico,
        idTipoTransaccionSaldo: 4,
        idTipoTransaccionSaldoNegativo: 5,
        notaOpcional: notaPago,
        idNevera,
      });

      return {
        message: 'Consolidación de pendientes realizada exitosamente',
        resumen: {
          nevera: { id_nevera: idNevera, nombre_tienda: nevera.tienda.nombre_tienda },
          usuario_tienda: idUsuarioTienda,
          usuario_logistico: idUsuarioLogistico,
          total_pendiente_consolidado: resultado.montoConsolidado,
          monto_recibido: monto,
          saldo_pendiente: resultado.saldo?.monto ?? 0,
          transacciones_pendientes_procesadas: resultado.pendientesProcesadas,
        },
        detalle_pendientes: transaccionesPendientes.map(t => ({
          id_transaccion_pendiente: t.id_transaccion,
          monto_pendiente: parseFloat(t.monto.toString()),
        })),
        transacciones: {
          id_transaccion_consolidada: resultado.idTicket,
          id_transaccion_pago: resultado.idPagoReceptor,
          total_pendiente_consolidado: resultado.montoConsolidado,
          monto_recibido: monto,
          saldo_pendiente: resultado.saldo?.monto ?? 0,
        },
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
        const notaPago = `Cobrado por: ${nombreLogistico} (ID: ${idUsuarioLogistico}) | Nota: abono de $${monto.toLocaleString('es-CO')} hecho por el usuario tienda (ID: ${idUsuarioTienda}) | #NEVERA:${idNevera}`;

        const consolidado = await this.transaccionesService.consolidarEnTx(prisma, {
          idsPendientes: idsPendientesPrevias,
          montoPagado: monto,
          montoConsolidado: totalLiquidar,
          idUsuarioTicket: idUsuarioTienda,
          idUsuarioReceptor: idUsuarioLogistico,
          idTipoTransaccionSaldo: 4,
          idTipoTransaccionSaldoNegativo: 5,
          idNevera,
          notaOpcional: `#NEVERA:${idNevera} EMPAQUES:${idsEmpaquesStr}${nota_opcional ? ' | ' + nota_opcional : ''}`,
          notaReceptorOpcional: notaPago,
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
        message: 'Liquidación de nevera realizada exitosamente',
        resumen: {
          nevera: { id_nevera: idNevera, nombre_tienda: nombreTienda },
          usuario_tienda: idUsuarioTienda,
          usuario_logistico: idUsuarioLogistico,
          total_liquidado: totalLiquidar,
          monto_recibido: monto,
          saldo_pendiente: resultado.saldo_pendiente,
          empaques_procesados: detallesCalculo.length,
        },
        detalle_calculo: detallesCalculo,
        transacciones: resultado,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Error al liquidar nevera: ${errorMessage}`);
    }
  }
}