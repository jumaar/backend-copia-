import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ValidacionDosaTresDto } from './dto/validacion-dosatres.dto';
import { InventarioDto } from './dto/inventario.dto';
import { EmpaqueValidado } from './interfaces/empaque.interface';
import { UMBRAL_PARA_CAMBIO, UMBRAL_VENCIDO, STOCK_MINIMO_BAJA_POR_VENCIMIENTO } from '../common/config/constants';

@Injectable()
export class NeverasService {
  private readonly logger = new Logger(NeverasService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async countActiveNeveras(): Promise<{ count: number }> {
    this.logger.debug('Iniciando conteo de neveras activas');
    const count = await this.databaseService.nEVERAS.count({
      where: {
        id_estado_nevera: 2,
      },
    });
    this.logger.debug(`Conteo resultante: ${count}`);
    return { count };
  }

  async activarNevera(contrasena: string) {
    // Buscar nevera con la contraseña proporcionada
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: {
        contraseña: contrasena,
      },
      include: {
        tienda: true,
      },
    });

    if (!nevera) {
      throw new HttpException(
        {
          success: false,
          error: 'Contraseña incorrecta',
          code: 'CONTRASENA_INCORRECTA',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Verificar que la nevera esté en estado 1 (inactiva)
    if (nevera.id_estado_nevera !== 1) {
      throw new HttpException(
        {
          success: false,
          error: 'La nevera no está en estado inactivo',
          code: 'ESTADO_NO_PERMITIDO',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Actualizar el estado de la nevera de 1 a 2 (de inactiva a activa)
    await this.databaseService.nEVERAS.update({
      where: {
        id_nevera: nevera.id_nevera,
      },
      data: {
        id_estado_nevera: 2,
        fecha_activacion: new Date(),
      },
    });

    // Obtener todos los productos con su nombre, descripción, peso nominal e id_producto
    const productos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
      },
    });

    // Generar un JWT con duración infinita (sin expiración)
    const payload = {
      sub: nevera.id_nevera,
      tipo: 'nevera_activacion',
      contrasena: contrasena,
    };

    // Generar token con una expiración muy larga (aproximadamente 100 años) para simular "infinito"
    const token = this.jwtService.sign(payload, { expiresIn: '876000h' }); // 100 años aproximadamente

    return {
      success: true,
      message: 'Nevera activada exitosamente',
      token: token,
      id_nevera: nevera.id_nevera,
      nombre_tienda: nevera.tienda?.nombre_tienda,
      productos: productos,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER: Escaneo de vencimiento (Fase 0 compartida)
  // Escanea empaques en estado 3 y 5 de neveras activas,
  // marca estado 3→5 si ≥UMBRAL_PARA_CAMBIO, y setea
  // mensaje_sistema con alertas de vencimiento.
  // ═══════════════════════════════════════════════════════════════
  private async escanearVencimientos(idsNeveras?: number[]) {
    const whereNevera: any = { id_estado_nevera: 2 };
    if (idsNeveras && idsNeveras.length > 0) {
      whereNevera.id_nevera = { in: idsNeveras };
    }

    const empaquesEnNeveras = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: { in: [3, 5] },
        nevera: whereNevera,
      },
      include: {
        producto: {
          select: { dias_vencimiento: true },
        },
      },
    });

    if (empaquesEnNeveras.length === 0) return;

    const ahora = new Date();
    const idsParaCambio: number[] = [];
    const mensajesPorNeveraProducto = new Map<
      string,
      { proximos: boolean; vencidos: boolean; idNevera: number; idProducto: number }
    >();

    for (const empaque of empaquesEnNeveras) {
      const diasVida = empaque.producto.dias_vencimiento;
      if (!diasVida || diasVida <= 0) continue;

      const msTranscurridos =
        ahora.getTime() - new Date(empaque.fecha_empaque_1).getTime();
      const diasTranscurridos = msTranscurridos / (1000 * 60 * 60 * 24);
      const porcentaje = (diasTranscurridos / diasVida) * 100;

      const key = `${empaque.id_nevera}_${empaque.id_producto}`;
      if (!mensajesPorNeveraProducto.has(key)) {
        mensajesPorNeveraProducto.set(key, {
          proximos: false,
          vencidos: false,
          idNevera: empaque.id_nevera ?? 0,
          idProducto: empaque.id_producto,
        });
      }
      const m = mensajesPorNeveraProducto.get(key)!;

      if (porcentaje >= UMBRAL_VENCIDO) {
        m.vencidos = true;
      } else if (porcentaje >= UMBRAL_PARA_CAMBIO) {
        m.proximos = true;
      }

      if (empaque.id_estado_empaque === 3 && porcentaje >= UMBRAL_PARA_CAMBIO) {
        if (porcentaje >= UMBRAL_VENCIDO || empaque.id_nevera_anterior === null) {
          idsParaCambio.push(empaque.id_empaque);
        }
      }
    }

    if (idsParaCambio.length > 0) {
      await this.databaseService.eMPAQUES.updateMany({
        where: { id_empaque: { in: idsParaCambio } },
        data: { id_estado_empaque: 5 },
      });
      this.logger.log(
        `Escaneo vencimiento: ${idsParaCambio.length} empaques marcados PARA CAMBIO`,
      );
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

  /**
   * ENDPOINT A: Calificación global de neveras
   * POST /api/neveras/calificacion
   * Ejecuta: Fase 0 (vencimiento) + Fase 2 (crear STOCK_NEVERA) + Fase 3 (calificación ALTA/MEDIA/BAJA)
   * para TODAS las neveras activas accesibles por herencia. Sin filtro de ciudad.
   * NO hace distribución de empaques — eso lo hace el endpoint de surtir.
   */
  async ejecutarCalificacion(
    idUsuario: number,
    accessibleUserIds: number[],
  ) {
    const horaCalificacion = new Date();

    // ─── FASE 1: Obtener neveras activas accesibles por herencia ───
    const neverasActivas = await this.databaseService.nEVERAS.findMany({
      where: {
        id_estado_nevera: 2,
        tienda: { id_usuario: { in: accessibleUserIds } },
      },
      select: {
        id_nevera: true,
        tienda: {
          select: {
            id_tienda: true,
            nombre_tienda: true,
            ciudad: {
              select: { id_ciudad: true, nombre_ciudad: true },
            },
          },
        },
      },
    });

    if (neverasActivas.length === 0) {
      return {
        success: true,
        message: 'No hay neveras accesibles para calibrar',
        hora_calificacion: horaCalificacion.toISOString(),
        resumen: {
          neveras_procesadas: 0,
          productos_procesados: 0,
          empaques_en_para_cambio: 0,
        },
      };
    }

    const idsNeveras = neverasActivas.map((n) => n.id_nevera);

    // ─── FASE 0: Escaneo de vencimiento ───
    await this.escanearVencimientos(idsNeveras);

    // ─── Obtener todos los productos ───
    const todosLosProductos = await this.databaseService.pRODUCTOS.findMany({
      select: { id_producto: true },
    });

    // ─── Obtener STOCK_NEVERA existente ───
    const stockExistente = await this.databaseService.sTOCK_NEVERA.findMany({
      where: { id_nevera: { in: idsNeveras } },
      select: {
        id: true,
        id_nevera: true,
        id_producto: true,
        stock_en_tiempo_real: true,
        venta_semanal: true,
        calificacion_surtido: true,
        stock_ideal_final: true,
        activo: true,
      },
    });

    // ─── FASE 2: Verificar y crear STOCK_NEVERA faltantes ───
    for (const nevera of neverasActivas) {
      for (const producto of todosLosProductos) {
        const existente = stockExistente.find(
          (s) =>
            s.id_nevera === nevera.id_nevera &&
            s.id_producto === producto.id_producto,
        );

        if (!existente) {
          await this.databaseService.sTOCK_NEVERA.create({
            data: {
              id_nevera: nevera.id_nevera,
              id_producto: producto.id_producto,
              stock_en_tiempo_real: 0,
              venta_semanal: 0,
              calificacion_surtido: 'MEDIA',
              stock_minimo: 0,
              stock_maximo: 0,
              stock_ideal_final: 0,
              activo: true,
              hora_calificacion: horaCalificacion,
            },
          });
        } else if (existente.activo) {
          await this.databaseService.sTOCK_NEVERA.update({
            where: { id: existente.id },
            data: { hora_calificacion: horaCalificacion },
          });
        }
      }
    }

    // Refrescar stock después de crear nuevos
    const stockActualizado = await this.databaseService.sTOCK_NEVERA.findMany({
      where: {
        id_nevera: { in: idsNeveras },
        activo: true,
      },
      select: {
        id: true,
        id_nevera: true,
        id_producto: true,
        stock_en_tiempo_real: true,
        venta_semanal: true,
        calificacion_surtido: true,
        stock_ideal_final: true,
      },
    });

    // ─── FASE 3: Calificación por producto ───
    const productosIds = todosLosProductos.map((p) => p.id_producto);
    let productosProcesados = 0;

    for (const idProducto of productosIds) {
      const stockProducto = stockActualizado.filter(
        (s) => s.id_producto === idProducto,
      );
      const neverasResurtido = stockProducto.filter(
        (s) => s.venta_semanal > 0 || s.stock_en_tiempo_real > 0,
      );

      if (neverasResurtido.length > 0) {
        const neverasOrdenadas = [...neverasResurtido].sort(
          (a, b) => a.venta_semanal - b.venta_semanal,
        );

        const ventaMaxima = Math.max(
          ...neverasResurtido.map((n) => n.venta_semanal),
        );

        if (ventaMaxima <= 0) {
          productosProcesados++;
          continue;
        }

        const MEDIA_corte = ventaMaxima / 2;
        const BAJA_corte = MEDIA_corte * 0.5;
        const ALTA_corte = MEDIA_corte * 1.5;

        for (const stock of neverasOrdenadas) {
          let calificacion: string;
          if (stock.venta_semanal < BAJA_corte) {
            calificacion = 'BAJA';
          } else if (stock.venta_semanal < ALTA_corte) {
            calificacion = 'MEDIA';
          } else {
            calificacion = 'ALTA';
          }

          await this.databaseService.sTOCK_NEVERA.update({
            where: { id: stock.id },
            data: {
              calificacion_surtido: calificacion,
              hora_calificacion: horaCalificacion,
            },
          });
        }

        await this.databaseService.pRODUCTOS.update({
          where: { id_producto: idProducto },
          data: {
            media: MEDIA_corte,
            baja: BAJA_corte,
            alta: ALTA_corte,
          },
        });
      }

      productosProcesados++;
    }

    // ─── FASE 4: Forzar BAJA en productos con empaques envejecidos ───
    // Si el escaneo de vencimiento (Fase 0) encontró empaques ≥75% o ≥100% vida en una nevera
    // para un producto, significa que ese producto no rota bien en esa nevera.
    // Se fuerza BAJA solo para ESTE producto en ESTA nevera. No afecta otros productos de la misma nevera.
    // Los empaques envejecidos se redistribuyen a neveras ALTA para este producto.
    const stocksConAlertas = await this.databaseService.sTOCK_NEVERA.findMany({
      where: {
        id_nevera: { in: idsNeveras },
        mensaje_sistema: { not: null },
        activo: true,
      },
      select: {
        id: true,
        id_nevera: true,
        id_producto: true,
        mensaje_sistema: true,
      },
    });

    let productosDegradadosABaja = 0;
    for (const stock of stocksConAlertas) {
      await this.databaseService.sTOCK_NEVERA.update({
        where: { id: stock.id },
        data: {
          calificacion_surtido: 'BAJA',
          stock_ideal_final: STOCK_MINIMO_BAJA_POR_VENCIMIENTO,
          stock_minimo: STOCK_MINIMO_BAJA_POR_VENCIMIENTO,
          hora_calificacion: horaCalificacion,
          mensaje_sistema: stock.mensaje_sistema
            ? stock.mensaje_sistema + ' | Calificación forzada a BAJA por empaques envejecidos'
            : 'Calificación forzada a BAJA por empaques envejecidos',
        },
      });
      productosDegradadosABaja++;
    }

    if (productosDegradadosABaja > 0) {
      this.logger.log(
        `Fase 4: ${productosDegradadosABaja} registros STOCK_NEVERA forzados a BAJA por empaques envejecidos`,
      );
    }


    // ─── Contar empaques marcados para cambio en este escaneo ───
    const empaquesParaCambioCount = await this.databaseService.eMPAQUES.count({
      where: {
        id_estado_empaque: 5,
        id_nevera: { in: idsNeveras },
      },
    });

    return {
      success: true,
      message: 'Calificación procesada exitosamente',
      hora_calificacion: horaCalificacion.toISOString(),
      resumen: {
        neveras_procesadas: neverasActivas.length,
        productos_procesados: productosProcesados,
        empaques_en_para_cambio: empaquesParaCambioCount,
        productos_degradados_a_baja: productosDegradadosABaja,
      },
    };
  }

  /**
   * ENDPOINT B: Surtido por nevera
   * GET /api/neveras/surtir?id_nevera=X&id_ciudad=Y&dias_excluir=Z
   *
   * Calcula dinámicamente la distribución de empaques disponibles
   * en logística (estado 2 + estado 6 prioritarios) entre las neveras
   * competidoras de la misma ciudad, y devuelve exactamente qué debe
   * surtir el usuario en la nevera objetivo.
   *
   * @param idNevera       ID de la nevera objetivo
   * @param idCiudad       ID de la ciudad (para scope de competidoras)
   * @param diasExcluir    Días hacia atrás para excluir neveras ya surtidas.
   *                       0 o null = incluir TODAS (incluso las surtidas hoy).
   * @param idUsuario      ID del usuario autenticado
   * @param accessibleUserIds  IDs de usuarios accesibles por herencia
   */
  async surtirNevera(
    idNevera: number,
    idCiudad: string | null,
    diasExcluir: number,
    idUsuario: number,
    accessibleUserIds: number[],
  ) {
    if (!idNevera || isNaN(idNevera)) {
      throw new HttpException(
        {
          success: false,
          error: 'El parámetro id_nevera es requerido',
          code: 'MISSING_NEVERA_PARAM',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Parsear ciudades: null/undefined/"" = todas, "4" = una, "1,3" = varias
    let idsCiudades: number[] | null = null;
    if (idCiudad && idCiudad.trim() !== '') {
      idsCiudades = idCiudad
        .split(',')
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
    }

    // ─── Verificar que la nevera existe y es accesible ───
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera: idNevera },
      include: {
        tienda: {
          select: {
            id_tienda: true,
            nombre_tienda: true,
            id_usuario: true,
            ciudad: { select: { id_ciudad: true, nombre_ciudad: true } },
          },
        },
      },
    });

    if (!nevera) {
      throw new HttpException(
        {
          success: false,
          error: 'Nevera no encontrada',
          code: 'NEVERA_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (!accessibleUserIds.includes(nevera.tienda.id_usuario)) {
      throw new HttpException(
        {
          success: false,
          error: 'No tienes acceso a esta nevera',
          code: 'NEVERA_FORBIDDEN',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // ─── Obtener logística del usuario ───
    const usuarioLogistica = await this.databaseService.lOGISTICA.findFirst({
      where: { id_usuario: idUsuario },
      select: { id_logistica: true },
    });

    if (!usuarioLogistica) {
      throw new HttpException(
        {
          success: false,
          error: 'Usuario no tiene logística asociada',
          code: 'NO_LOGISTICA',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const idLogistica = usuarioLogistica.id_logistica;

    // ─── Obtener empaques en logística (estado 2) ───
    const empaquesEstado2 = await this.databaseService.eMPAQUES.groupBy({
      by: ['id_producto'],
      where: {
        id_estado_empaque: 2,
        id_logistica: idLogistica,
      },
      _count: { id_empaque: true },
    });

    // ─── Obtener empaques prioritarios (estado 6) con % de vida ───
    const empaquesEstado6Raw = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estado_empaque: 6,
        id_logistica: idLogistica,
      },
      include: {
        producto: { select: { dias_vencimiento: true } },
      },
    });

    const ahora = new Date();
    const empaquesPrioritariosPorProducto = new Map<number, number>();
    let totalPrioritarios = 0;

    for (const e of empaquesEstado6Raw) {
      const diasVida = e.producto.dias_vencimiento;
      if (!diasVida || diasVida <= 0) continue;
      const diasTranscurridos =
        (ahora.getTime() - new Date(e.fecha_empaque_1).getTime()) /
        (1000 * 60 * 60 * 24);
      const porcentaje = (diasTranscurridos / diasVida) * 100;

      if (porcentaje >= UMBRAL_PARA_CAMBIO && porcentaje < UMBRAL_VENCIDO) {
        empaquesPrioritariosPorProducto.set(
          e.id_producto,
          (empaquesPrioritariosPorProducto.get(e.id_producto) || 0) + 1,
        );
        totalPrioritarios++;
      }
    }

    // ─── Armar mapa de disponibilidad total por producto ───
    const disponibilidadPorProducto = new Map<number, number>();
    for (const p of empaquesEstado2) {
      disponibilidadPorProducto.set(p.id_producto, p._count.id_empaque);
    }
    for (const [idProd, cant] of empaquesPrioritariosPorProducto) {
      disponibilidadPorProducto.set(
        idProd,
        (disponibilidadPorProducto.get(idProd) || 0) + cant,
      );
    }

    // ─── Obtener neveras competidoras ───
    const filtroFechaLimite = new Date();
    let fechaLimite: Date | null = null;
    if (diasExcluir && diasExcluir > 0) {
      filtroFechaLimite.setDate(filtroFechaLimite.getDate() - diasExcluir);
      fechaLimite = filtroFechaLimite;
    }

    const tiendaWhere: any = {
      id_usuario: { in: accessibleUserIds },
    };
    if (idsCiudades && idsCiudades.length > 0) {
      tiendaWhere.ciudad = { id_ciudad: { in: idsCiudades } };
    }

    const neverasCompetidoras = await this.databaseService.nEVERAS.findMany({
      where: {
        id_estado_nevera: 2,
        tienda: tiendaWhere,
        ...(fechaLimite
          ? {
              OR: [
                { hora_ultimo_surtido: null },
                { hora_ultimo_surtido: { lt: fechaLimite } },
              ],
            }
          : {}),
      },
      select: {
        id_nevera: true,
        tienda: { select: { nombre_tienda: true } },
      },
    });

    let neverasExcluidasPorSurtido = 0;
    if (diasExcluir && diasExcluir > 0) {
      const todasNeveras = await this.databaseService.nEVERAS.findMany({
        where: {
          id_estado_nevera: 2,
          tienda: tiendaWhere,
        },
        select: { id_nevera: true },
      });
      neverasExcluidasPorSurtido =
        todasNeveras.length - neverasCompetidoras.length;
    }

    const idsCompetidoras = neverasCompetidoras.map((n) => n.id_nevera);

    // ─── Obtener STOCK_NEVERA de la nevera target ───
    const stockTarget = await this.databaseService.sTOCK_NEVERA.findMany({
      where: { id_nevera: idNevera, activo: true },
      include: {
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            descripcion_producto: true,
            peso_nominal_g: true,
          },
        },
      },
    });

    // ─── Obtener STOCK_NEVERA de todas las competidoras ───
    const stockCompetidoras = await this.databaseService.sTOCK_NEVERA.findMany({
      where: { id_nevera: { in: idsCompetidoras }, activo: true },
      select: {
        id: true,
        id_nevera: true,
        id_producto: true,
        stock_en_tiempo_real: true,
        calificacion_surtido: true,
        stock_ideal_final: true,
      },
    });

    // ─── Obtener TODOS los productos ───
    const todosLosProductos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
      },
      orderBy: { nombre_producto: 'asc' },
    });

    // ─── Crear mapa de stock target ───
    const stockTargetMap = new Map<number, any>();
    for (const s of stockTarget) {
      stockTargetMap.set(s.id_producto, s);
    }

    // ─── Obtener empaques estado 5 (para cambio) de esta nevera ───
    const empaquesEstado5 = await this.databaseService.eMPAQUES.findMany({
      where: { id_nevera: idNevera, id_estado_empaque: 5 },
      select: {
        id_empaque: true,
        EPC_id: true,
        peso_exacto_g: true,
        fecha_empaque_1: true,
        fecha_vencimiento: true,
        producto: {
          select: { id_producto: true, dias_vencimiento: true },
        },
      },
    });

    const paraCambio: any[] = [];
    const vencidos: any[] = [];

    for (const empaque of empaquesEstado5) {
      const diasVida = empaque.producto.dias_vencimiento;
      const inicio = new Date(empaque.fecha_empaque_1);
      const diasTranscurridos =
        (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      const porcentaje =
        diasVida > 0
          ? Math.round((diasTranscurridos / diasVida) * 100 * 100) / 100
          : 0;

      const item = {
        id_empaque: empaque.id_empaque,
        epc: empaque.EPC_id,
        peso_exacto_g: Number(empaque.peso_exacto_g),
        id_producto: empaque.producto.id_producto,
        fecha_vencimiento: empaque.fecha_vencimiento.toISOString(),
        porcentaje_vida: porcentaje,
      };

      if (porcentaje >= UMBRAL_VENCIDO) {
        vencidos.push(item);
      } else {
        paraCambio.push(item);
      }
    }


    // ─── Para cada producto, calcular distribución y cantidad a surtir ───
    const productosConSurtido: any[] = [];

    for (const producto of todosLosProductos) {
      const stockInfo = stockTargetMap.get(producto.id_producto);
      const disponibleLogistica =
        disponibilidadPorProducto.get(producto.id_producto) || 0;

      // Datos del STOCK_NEVERA de esta nevera para este producto
      const stockActual = stockInfo?.stock_en_tiempo_real ?? 0;
      const calificacion = stockInfo?.calificacion_surtido ?? 'MEDIA';
      const ventaSemanal = stockInfo?.venta_semanal ?? 0;

      // Neveras competidoras para este producto (incluyendo la target)
      const stocksParaProducto = stockCompetidoras.filter(
        (s) => s.id_producto === producto.id_producto,
      );

      // Agregar la nevera target a la distribución si tiene registro
      const targetStockRecord = stockCompetidoras.find(
        (s) =>
          s.id_nevera === idNevera && s.id_producto === producto.id_producto,
      );
      const todosLosStocks = [...stocksParaProducto];
      if (!targetStockRecord && stockInfo) {
        todosLosStocks.push({
          id: stockInfo.id,
          id_nevera: idNevera,
          id_producto: producto.id_producto,
          stock_en_tiempo_real: stockActual,
          calificacion_surtido: calificacion,
          stock_ideal_final: stockInfo.stock_ideal_final,
        });
      }

      let stockIdealFinal = 0;
      let cantidadASurtir = 0;
      const prioritariosDisponibles =
        empaquesPrioritariosPorProducto.get(producto.id_producto) || 0;

      if (disponibleLogistica > 0 && todosLosStocks.length > 0) {
        // ─── Distribuir entre neveras ───
        const N_alta = todosLosStocks.filter(
          (s) => s.calificacion_surtido === 'ALTA',
        ).length;
        const N_media = todosLosStocks.filter(
          (s) => s.calificacion_surtido === 'MEDIA',
        ).length;
        const N_baja = todosLosStocks.filter(
          (s) => s.calificacion_surtido === 'BAJA',
        ).length;

        const pesoTotal = 2 * N_alta + 1 * N_media + 0.5 * N_baja;

        if (pesoTotal > 0) {
          // ─── Distribuir el stock TOTAL del sistema (neveras + camión) ───
          // En vez de repartir solo lo del camión, se considera el stock que
          // YA está en las neveras para que las neveras vacías reciban más
          // proporción que las que ya están bien surtidas.
          const stockRealTotal = todosLosStocks.reduce(
            (sum, s) => {
              if (s.calificacion_surtido === 'BAJA') {
                return sum + Math.min(s.stock_en_tiempo_real, (s as any).stock_ideal_final || 1);
              }
              return sum + s.stock_en_tiempo_real;
            },
            0,
          );
          const totalSistema = disponibleLogistica + stockRealTotal;
          const MEDIA_asig = Math.round(totalSistema / pesoTotal);
          const BAJA_asig = Math.round(MEDIA_asig * 0.5);
          const ALTA_asig = Math.round(MEDIA_asig * 2);

          const totalAsignado =
            ALTA_asig * N_alta + MEDIA_asig * N_media + BAJA_asig * N_baja;
          let sobrante = totalSistema - totalAsignado;
          const neverasPriorizadas = [
            ...todosLosStocks.filter((s) => s.calificacion_surtido === 'ALTA'),
            ...todosLosStocks.filter((s) => s.calificacion_surtido === 'MEDIA'),
            ...todosLosStocks.filter((s) => s.calificacion_surtido === 'BAJA'),
          ];

          const asignacionExtra = new Map<number, number>();
          for (const s of todosLosStocks) {
            asignacionExtra.set(s.id_nevera, 0);
          }

          let indice = 0;
          while (sobrante > 0 && neverasPriorizadas.length > 0) {
            const n = neverasPriorizadas[indice % neverasPriorizadas.length];
            asignacionExtra.set(
              n.id_nevera,
              (asignacionExtra.get(n.id_nevera) || 0) + 1,
            );
            sobrante--;
            indice++;
          }

          // ─── Empaques prioritarios van PRIMERO a neveras ALTA ───

          // Calcular asignación para la nevera target
          if (calificacion === 'ALTA') {
            stockIdealFinal = ALTA_asig + (asignacionExtra.get(idNevera) || 0);
          } else if (calificacion === 'MEDIA') {
            stockIdealFinal = MEDIA_asig + (asignacionExtra.get(idNevera) || 0);
          } else {
            stockIdealFinal = BAJA_asig + (asignacionExtra.get(idNevera) || 0);
          }

          // cantidad_a_surtir = lo que falta para llegar al ideal (sin exceder lo disponible)
          const faltante = Math.max(0, stockIdealFinal - stockActual);
          cantidadASurtir = Math.min(faltante, disponibleLogistica);

          // ─── Empaques prioritarios (estado 6, 75-100%): ALTA → MEDIA (si no hay ALTA) ───
          if (prioritariosDisponibles > 0) {
            const hayAltaEnCompetidoras = todosLosStocks.some(
              (s) => s.calificacion_surtido === 'ALTA',
            );
            const recibePrioritarios =
              calificacion === 'ALTA' ||
              (calificacion === 'MEDIA' && !hayAltaEnCompetidoras);
            if (recibePrioritarios) {
              const extraPrioritarios = Math.min(
                prioritariosDisponibles,
                disponibleLogistica - cantidadASurtir,
              );
              cantidadASurtir += extraPrioritarios;
            }
          }


          // ─── Persistir stock_ideal_final en STOCK_NEVERA de la target ───
          if (stockInfo) {
            await this.databaseService.sTOCK_NEVERA.update({
              where: { id: stockInfo.id },
              data: { stock_ideal_final: stockIdealFinal },
            });
          }
        }
      }

      // ─── Construir respuesta del producto ───
      if (stockInfo) {
        productosConSurtido.push({
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          descripcion_producto: producto.descripcion_producto,
          peso_nominal_g: producto.peso_nominal_g,
          tiene_stock: stockActual > 0,
          id_stock: stockInfo.id,
          stock_minimo: stockInfo.stock_minimo,
          stock_maximo: stockInfo.stock_maximo,
          venta_semanal: ventaSemanal,
          stock_ideal_final: stockIdealFinal,
          calificacion_surtido: calificacion,
          mensaje_sistema: stockInfo.mensaje_sistema,
          stock_en_tiempo_real: stockActual,
          activo: stockInfo.activo,
          cantidad_a_surtir: cantidadASurtir,
          empaques_disponibles_logistica: disponibleLogistica,
          empaques_prioritarios_asignados: Math.min(
            prioritariosDisponibles,
            cantidadASurtir,
          ),
        });
      } else {
        productosConSurtido.push({
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          descripcion_producto: producto.descripcion_producto,
          peso_nominal_g: producto.peso_nominal_g,
          tiene_stock: false,
          id_stock: null,
          stock_minimo: 0,
          stock_maximo: 0,
          venta_semanal: 0,
          stock_ideal_final: 0,
          calificacion_surtido: 'Sin configurar',
          mensaje_sistema: 'Producto no disponible en esta nevera',
          stock_en_tiempo_real: 0,
          activo: true,
          cantidad_a_surtir: 0,
          empaques_disponibles_logistica: disponibleLogistica,
          empaques_prioritarios_asignados: 0,
        });
      }
    }

    // ─── Estadísticas ───
    const totalProductos = todosLosProductos.length;
    const productosConStock = productosConSurtido.filter(
      (p) => p.stock_en_tiempo_real > 0,
    ).length;
    const productosSinStock = totalProductos - productosConStock;

    return {
      success: true,
      nevera: {
        id_nevera: nevera.id_nevera,
        id_tienda: nevera.tienda.id_tienda,
        nombre_tienda: nevera.tienda.nombre_tienda,
        hora_ultimo_surtido: nevera.hora_ultimo_surtido?.toISOString() ?? null,
      },
      estadisticas: {
        total_productos: totalProductos,
        productos_con_stock: productosConStock,
        productos_sin_stock: productosSinStock,
      },
      productos: productosConSurtido,
      para_cambio_5: {
        para_cambio: paraCambio,
        vencidos: vencidos,
      },
      resumen_logistica: {
        id_logistica: idLogistica,
        total_empaques_estado_2: empaquesEstado2.reduce(
          (sum, p) => sum + p._count.id_empaque,
          0,
        ),
        total_empaques_prioritarios_estado_6: totalPrioritarios,
        neveras_competidoras_consideradas: neverasCompetidoras.length,
        neveras_excluidas_por_surtido_reciente: neverasExcluidasPorSurtido,
        parametros: {
          dias_excluir: diasExcluir ?? 0,
          modo:
            !diasExcluir || diasExcluir === 0
              ? 'incluir_todas'
              : 'excluir_recientes',
        },
      },
    };
  }

  create(createNeveraDto: CreateNeveraDto) {
    return 'This action adds a new nevera';
  }

  findAll() {
    return `This action returns all neveras`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nevera`;
  }

  update(id: number, updateNeveraDto: UpdateNeveraDto) {
    return `This action updates a #${id} nevera`;
  }

  async remove(id: number) {
    // Verificar si la nevera tiene empaques asociados
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: id,
      },
    });

    if (empaques.length > 0) {
      throw new Error(
        'No se puede eliminar la nevera porque tiene empaques asociados',
      );
    }

    // Si no tiene empaques, proceder con la eliminación
    const neveraEliminada = await this.databaseService.nEVERAS.delete({
      where: {
        id_nevera: id,
      },
    });

    return {
      message: 'Nevera eliminada exitosamente',
      nevera: {
        id_nevera: neveraEliminada.id_nevera,
      },
    };
  }

  async actualizarNeveras() {
    // Obtener todas las neveras activas (estado 2) con sus tiendas
    const neverasActivas = await this.databaseService.nEVERAS.findMany({
      where: {
        id_estado_nevera: 2, // Solo neveras activas
      },
      include: {
        tienda: {
          select: {
            nombre_tienda: true,
          },
        },
      },
    });

    // Procesar cada nevera para generar su token y preparar la información
    const neverasProcesadas = await Promise.all(
      neverasActivas.map(async (nevera) => {
        // Generar token para esta nevera
        const payload = {
          sub: nevera.id_nevera,
          tipo: 'nevera_actualizacion',
          contrasena: nevera.contraseña,
        };

        const token = this.jwtService.sign(payload, { expiresIn: '876000h' }); // 100 años aproximadamente

        return {
          id_nevera: nevera.id_nevera,
          nombre_tienda: nevera.tienda?.nombre_tienda,
          token: token,
        };
      }),
    );

    // Obtener todos los productos únicos (tabla global)
    const productos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
      },
    });

    return {
      success: true,
      message: 'Información de neveras activas obtenida exitosamente',
      neveras: neverasProcesadas,
      productos: productos,
    };
  }

  /**
   * Endpoint para validar empaques que entran a una nevera
   * PATCH /api/neveras/validacionDosaTres
   */
  async validacionDosaTres(idNevera: number, dto: ValidacionDosaTresDto) {
    const { timestamp, pending_packages } = dto;
    this.logger.log(`Validando empaques para nevera ${idNevera}`);

    // Convertir timestamp a fecha
    const fechaTimestamp = new Date(timestamp * 1000);

    // Obtener la fecha actual para la última conexión
    const fechaConexion = new Date();

    // Procesar empaques: validar y separar válidos de inválidos
    const empaquesValidos: any[] = [];
    const empaquesInvalidos: any[] = [];

    // Paso 1: Validar todos los empaques
    for (const packageData of pending_packages) {
      const { epc, id_empaque } = packageData;

      // Buscar el empaque por EPC o ID
      let empaque;
      if (epc) {
        empaque = await this.databaseService.eMPAQUES.findUnique({
          where: { EPC_id: epc },
          include: {
            producto: {
              select: {
                id_producto: true,
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

      // Verificar que el empaque exista y esté en estado 2 (en logística), 4 (pendiente pago, devolución), 5 (para cambio) o 6 (logística prioridad)
      if (!empaque) {
        empaquesInvalidos.push({
          epc: epc || null,
          id_empaque: id_empaque || null,
          id_nevera: null,
          error: `Empaque no encontrado: ${epc || id_empaque}`,
        });
      } else if (
        empaque.id_estado_empaque !== 2 &&
        empaque.id_estado_empaque !== 4 &&
        empaque.id_estado_empaque !== 5 &&
        empaque.id_estado_empaque !== 6
      ) {
        empaquesInvalidos.push({
          epc: epc || null,
          id_empaque: id_empaque || null,
          id_nevera: empaque.id_nevera,
          error: `Empaque no está en estado válido para validación (estado actual: ${empaque.id_estado_empaque}): ${epc || id_empaque}`,
        });
      } else {
        empaquesValidos.push({
          empaque: empaque,
          epc: epc || null,
          id_empaque: id_empaque || null,
          estado_original: empaque.id_estado_empaque,
        });
      }
    }

    // Paso 2: Si hay empaques válidos, procesarlos en una transacción
    let empaquesActualizados: any[] = [];
    let success = false;
    let message = '';

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

    if (empaquesValidos.length > 0) {
      empaquesActualizados = await this.databaseService.$transaction(
        async (prisma) => {
          // 1. Actualizar la tabla de neveras con la última conexión
          await prisma.nEVERAS.update({
            where: { id_nevera: idNevera },
            data: {
              ultima_conexion: fechaConexion,
            },
          });

          // 2. Procesar cada empaque válido
          const resultados: any[] = [];

          for (const packageData of empaquesValidos) {
            const { empaque, epc, id_empaque, estado_original } = packageData;

            // Preparar los datos de actualización
            const updateData: any = {
              id_nevera: idNevera,
              id_estado_empaque: 3, // Estado 3: en nevera
            };

            // Solo setear hora_en_nevera_3 si viene de estado 2 (entrando por primera vez a la nevera)
            if (estado_original === 2) {
              updateData.hora_en_nevera_3 = fechaTimestamp;
            }

            // Si el empaque venía en estado 4, limpiar hora_pendiente_pago_4
            if (estado_original === 4) {
              updateData.hora_pendiente_pago_4 = null;
            }

            // Si el empaque venía en estado 6 (logística prioridad), registrar la nevera anterior y finalización
            if (estado_original === 6) {
              updateData.id_nevera_anterior = empaque.id_nevera;
              updateData.hora_surtido_final_6 = fechaTimestamp;
            }

            // Actualizar el empaque
            const empaqueActualizado = await prisma.eMPAQUES.update({
              where: { id_empaque: empaque.id_empaque },
              data: updateData,
              include: {
                producto: {
                  select: {
                    id_producto: true,
                    nombre_producto: true,
                  },
                },
              },
            });

            resultados.push({
              id_empaque: empaqueActualizado.id_empaque,
              epc: empaqueActualizado.EPC_id,
              peso_exacto_g: empaqueActualizado.peso_exacto_g,
              id_producto: empaqueActualizado.producto.id_producto,
              nombre_producto: empaqueActualizado.producto.nombre_producto,
            });
          }

          return resultados;
        },
      );

      success = true;
      message =
        empaquesInvalidos.length === 0
          ? 'Validación de empaques completada exitosamente'
          : `Se procesaron ${empaquesValidos.length} empaques válidos, ${empaquesInvalidos.length} no pudieron procesarse`;
    } else {
      success = false;
      message = 'Ningún empaque pudo ser procesado';
    }

    return {
      success,
      message,
      empaques_procesados: empaquesActualizados,
      empaques_no_procesados: empaquesInvalidos,
    };
  }

  /**
   * Función para obtener el inventario de una nevera específica
   * GET /api/neveras/inventario/:id_nevera
   */
  async inventarioNevera(idNevera: number): Promise<{
    success: boolean;
    message: string;
    empaques_3: {
      id_empaque: number;
      epc: string;
      peso_exacto_g: number;
      id_producto: number;
    }[];
    empaques_pendiente_pago_4: {
      id_empaque: number;
      epc: string;
      peso_exacto_g: number;
      id_producto: number;
      hora_pendiente_pago_4: string | null;
    }[];
    para_cambio_5: {
      para_cambio: {
        id_empaque: number;
        epc: string;
        peso_exacto_g: number;
        id_producto: number;
        fecha_vencimiento: string;
        porcentaje_vida: number;
      }[];
      vencidos: {
        id_empaque: number;
        epc: string;
        peso_exacto_g: number;
        id_producto: number;
        fecha_vencimiento: string;
        porcentaje_vida: number;
      }[];
    };
    ultima_conexion: string;
  }> {
    this.logger.log(`Obteniendo inventario para nevera ${idNevera}`);

    // Obtener la fecha actual para la última conexión
    const fechaConexion = new Date();

    // Buscar la nevera y actualizar su última conexión
    const nevera = await this.databaseService.nEVERAS.update({
      where: { id_nevera: idNevera },
      data: {
        ultima_conexion: fechaConexion,
      },
      include: {
        tienda: {
          select: {
            nombre_tienda: true,
          },
        },
      },
    });

    if (!nevera) {
      throw new HttpException(
        {
          success: false,
          error: 'Nevera no encontrada',
          code: 'NEVERA_NO_ENCONTRADA',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Obtener los empaques que estén en estado 3 (en nevera) y pertenezcan a esta nevera
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: idNevera,
        id_estado_empaque: 3, // Estado 3: en nevera
      },
      select: {
        id_empaque: true,
        EPC_id: true,
        peso_exacto_g: true,
        producto: {
          select: {
            id_producto: true,
          },
        },
      },
    });

    // Formatear la respuesta
    const empaquesFormateados = empaques.map((empaque) => ({
      id_empaque: empaque.id_empaque,
      epc: empaque.EPC_id,
      peso_exacto_g: Number(empaque.peso_exacto_g), // Convertir Decimal a number
      id_producto: empaque.producto.id_producto,
    }));

    // Obtener los empaques que estén en estado 4 (pendiente pago) y pertenezcan a esta nevera
    const empaquesPendientePago = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: idNevera,
        id_estado_empaque: 4, // Estado 4: pendiente pago
      },
      select: {
        id_empaque: true,
        EPC_id: true,
        peso_exacto_g: true,
        producto: {
          select: {
            id_producto: true,
          },
        },
        hora_pendiente_pago_4: true,
      },
    });

    // Formatear la respuesta de empaques pendientes de pago
    const empaquesPendientePagoFormateados = empaquesPendientePago.map(
      (empaque) => ({
        id_empaque: empaque.id_empaque,
        epc: empaque.EPC_id,
        peso_exacto_g: Number(empaque.peso_exacto_g), // Convertir Decimal a number
        id_producto: empaque.producto.id_producto,
        hora_pendiente_pago_4: empaque.hora_pendiente_pago_4
          ? empaque.hora_pendiente_pago_4.toISOString()
          : null,
      }),
    );

    // Obtener los empaques que estén en estado 5 (para cambio) y pertenezcan a esta nevera
    const empaquesParaCambio = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: idNevera,
        id_estado_empaque: 5,
      },
      select: {
        id_empaque: true,
        EPC_id: true,
        peso_exacto_g: true,
        fecha_empaque_1: true,
        fecha_vencimiento: true,
        producto: {
          select: {
            id_producto: true,
            dias_vencimiento: true,
          },
        },
      },
    });

    const ahora = new Date();
    const paraCambioFormateados: {
      id_empaque: number;
      epc: string;
      peso_exacto_g: number;
      id_producto: number;
      fecha_vencimiento: string;
      porcentaje_vida: number;
    }[] = [];
    const vencidosFormateados: {
      id_empaque: number;
      epc: string;
      peso_exacto_g: number;
      id_producto: number;
      fecha_vencimiento: string;
      porcentaje_vida: number;
    }[] = [];

    for (const empaque of empaquesParaCambio) {
      const diasVida = empaque.producto.dias_vencimiento;
      const inicio = new Date(empaque.fecha_empaque_1);
      const diasTranscurridos =
        (ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
      const porcentaje = Math.round(
        (diasTranscurridos / diasVida) * 100 * 100,
      ) / 100;

      const item = {
        id_empaque: empaque.id_empaque,
        epc: empaque.EPC_id,
        peso_exacto_g: Number(empaque.peso_exacto_g),
        id_producto: empaque.producto.id_producto,
        fecha_vencimiento: empaque.fecha_vencimiento.toISOString(),
        porcentaje_vida: porcentaje,
      };

      if (porcentaje >= UMBRAL_VENCIDO) {
        vencidosFormateados.push(item);
      } else {
        paraCambioFormateados.push(item);
      }
    }

    return {
      success: true,
      message: `Inventario obtenido exitosamente para nevera ${idNevera}`,
      empaques_3: empaquesFormateados,
      empaques_pendiente_pago_4: empaquesPendientePagoFormateados,
      para_cambio_5: {
        para_cambio: paraCambioFormateados,
        vencidos: vencidosFormateados,
      },
      ultima_conexion: fechaConexion.toISOString(),
    };
  }

  /**
   * Endpoint para procesar inventario de empaques en nevera, cambiando estado de 3 o 5 a 4
   * POST /api/neveras/inventario
   */
  async procesarInventario(idNevera: number, dto: InventarioDto) {
    const { empaques } = dto;

    // Obtener la fecha actual para la última conexión
    const fechaConexion = new Date();

    // Procesar empaques: validar y separar válidos de inválidos
    const empaquesValidos: any[] = [];
    const empaquesInvalidos: any[] = [];

    // Paso 1: Validar todos los empaques
    for (const empaqueData of empaques) {
      const { id_empaque, epc, fecha_venta } = empaqueData;

      // Buscar el empaque por ID o EPC
      let empaque;
      if (id_empaque !== undefined && id_empaque !== null) {
        empaque = await this.databaseService.eMPAQUES.findUnique({
          where: { id_empaque },
          include: {
            producto: {
              select: {
                id_producto: true,
                nombre_producto: true,
              },
            },
          },
        });
      } else if (epc) {
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
      }

      // Verificar que el empaque exista, pertenezca a la nevera y esté en estado 3
      if (!empaque) {
        empaquesInvalidos.push({
          id_empaque: id_empaque || null,
          epc: epc || null,
          error: `Empaque no encontrado con ${id_empaque ? `ID ${id_empaque}` : `EPC ${epc}`}`,
        });
      } else if (empaque.id_nevera !== idNevera) {
        empaquesInvalidos.push({
          id_empaque,
          epc,
          error: `Empaque no pertenece a la nevera ${idNevera}`,
        });
      } else if (empaque.id_estado_empaque !== 3 && empaque.id_estado_empaque !== 5) {
        empaquesInvalidos.push({
          id_empaque,
          epc,
          error: `Empaque no está en estado 3 ni 5 (estado actual: ${empaque.id_estado_empaque})`,
        });
      } else {
        empaquesValidos.push({
          empaque,
          id_empaque: id_empaque || null,
          epc: epc || null,
          fecha_venta: new Date(fecha_venta),
        });
      }
    }

    // Paso 2: Si hay empaques válidos, procesarlos en una transacción
    let empaquesActualizados: any[] = [];
    let success = false;
    let message = '';

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

    if (empaquesValidos.length > 0) {
      empaquesActualizados = await this.databaseService.$transaction(
        async (prisma) => {
          // 1. Actualizar la tabla de neveras con la última conexión
          await prisma.nEVERAS.update({
            where: { id_nevera: idNevera },
            data: {
              ultima_conexion: fechaConexion,
            },
          });

          // 2. Procesar cada empaque válido
          const resultados: any[] = [];

          for (const packageData of empaquesValidos) {
            const { empaque, id_empaque, epc, fecha_venta } = packageData;

            // Actualizar el empaque a estado 4 y setear fecha_venta
            const empaqueActualizado = await prisma.eMPAQUES.update({
              where: { id_empaque: empaque.id_empaque },
              data: {
                id_estado_empaque: 4, // Estado 4: pendiente pago
                hora_pendiente_pago_4: fecha_venta,
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

            resultados.push({
              id_empaque: empaqueActualizado.id_empaque,
              epc: empaqueActualizado.EPC_id,
              peso_exacto_g: empaqueActualizado.peso_exacto_g,
              id_producto: empaqueActualizado.producto.id_producto,
              nombre_producto: empaqueActualizado.producto.nombre_producto,
              fecha_venta: fecha_venta.toISOString(),
            });
          }

          return resultados;
        },
      );

      success = true;
      message =
        empaquesInvalidos.length === 0
          ? 'Inventario procesado exitosamente'
          : `Se procesaron ${empaquesValidos.length} empaques válidos, ${empaquesInvalidos.length} no pudieron procesarse`;
    } else {
      success = false;
      message = 'Ningún empaque pudo ser procesado';
    }

    return {
      success,
      message,
      empaques_procesados: empaquesActualizados,
      empaques_no_procesados: empaquesInvalidos,
      ultima_conexion: fechaConexion.toISOString(),
    };
  }
}
