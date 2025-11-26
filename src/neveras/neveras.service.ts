import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NeverasService {
  private readonly logger = new Logger(NeverasService.name);

  constructor(private readonly databaseService: DatabaseService) {}

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

  /**
   * Endpoint principal de surtido de neveras
   * GET /api/neveras/surtir?id_ciudad=1,3
   */
  async surtirNeveras(idCiudadesParam: string, idUsuario: number) {
    const horaCalificacion = new Date();
    this.logger.debug(`Iniciando surtido de neveras para ciudades: ${idCiudadesParam}`);

    // Parsear ciudades
    const idCiudades = idCiudadesParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (idCiudades.length === 0) {
      throw new HttpException({
        success: false,
        error: 'Debe proporcionar al menos un id_ciudad válido',
        code: 'INVALID_CIUDAD_IDS'
      }, HttpStatus.BAD_REQUEST);
    }

    // FASE 1: RECOLECCIÓN DE DATOS
    this.logger.debug('FASE 1: Recolección de datos');

    // 1.1 Obtener neveras activas de las ciudades
    const neverasActivas = await this.databaseService.nEVERAS.findMany({
      where: {
        id_estado_nevera: 2, // Activas
        tienda: {
          ciudad: {
            id_ciudad: { in: idCiudades }
          }
        }
      },
      select: {
        id_nevera: true,
        tienda: {
          select: {
            id_tienda: true,
            nombre_tienda: true,
            ciudad: {
              select: {
                id_ciudad: true,
                nombre_ciudad: true
              }
            }
          }
        }
      }
    });

    if (neverasActivas.length === 0) {
      throw new HttpException({
        success: false,
        error: 'No hay neveras disponibles para surtir en las ciudades seleccionadas',
        code: 'NO_NEVERAS_DISPONIBLES'
      }, HttpStatus.NOT_FOUND);
    }

    const idsNeveras = neverasActivas.map(n => n.id_nevera);
    this.logger.debug(`Neveras activas encontradas: ${idsNeveras.length}`);

    // 1.2 Obtener STOCK_NEVERA de esas neveras (filtrar activo=false)
    const stockExistente = await this.databaseService.sTOCK_NEVERA.findMany({
      where: {
        id_nevera: { in: idsNeveras }
      },
      select: {
        id: true,
        id_nevera: true,
        id_producto: true,
        stock_en_tiempo_real: true,
        venta_semanal: true,
        calificacion_surtido: true,
        stock_minimo: true,
        stock_maximo: true,
        stock_ideal_final: true,
        activo: true
      }
    });

    // 1.3 Obtener productos en logística del usuario
    const usuarioLogistica = await this.databaseService.lOGISTICA.findFirst({
      where: { id_usuario: idUsuario },
      select: { id_logistica: true }
    });

    if (!usuarioLogistica) {
      throw new HttpException({
        success: false,
        error: 'Usuario no tiene logística asociada',
        code: 'NO_LOGISTICA'
      }, HttpStatus.BAD_REQUEST);
    }

    const productosEnLogistica = await this.databaseService.eMPAQUES.groupBy({
      by: ['id_producto'],
      where: {
        id_estado_empaque: 2, // En logística
        id_logistica: usuarioLogistica.id_logistica
      },
      _count: {
        id_empaque: true
      }
    });

    if (productosEnLogistica.length === 0) {
      throw new HttpException({
        success: false,
        error: 'No hay productos en logística para surtir',
        code: 'NO_PRODUCTOS_LOGISTICA'
      }, HttpStatus.BAD_REQUEST);
    }

    this.logger.debug(`Productos en logística: ${productosEnLogistica.length}`);

    // Convertir a formato más manejable
    const productosLogistica = productosEnLogistica.map(p => ({
      id_producto: p.id_producto,
      cantidad: p._count.id_empaque
    }));

    // LOOP: Iterar por cada producto en logística
    for (const productoLog of productosLogistica) {
      const { id_producto, cantidad: cantidadLogistica } = productoLog;
      this.logger.debug(`Procesando producto ${id_producto} con ${cantidadLogistica} empaques`);

      // FASE 2: VERIFICACIÓN Y CREACIÓN DE REGISTROS
      this.logger.debug(`FASE 2: Verificación de registros para producto ${id_producto}`);

      // 2.1 Para cada nevera, verificar si existe registro
      for (const nevera of neverasActivas) {
        const stockExistenteNevera = stockExistente.find(
          s => s.id_nevera === nevera.id_nevera && s.id_producto === id_producto
        );

        // Verificar si el registro existe y está activo
        const stockActivo = stockExistenteNevera && stockExistenteNevera.activo;
        
        if (!stockExistenteNevera) {
          // NO existe → CREAR registro con calificación MEDIA
          await this.databaseService.sTOCK_NEVERA.create({
            data: {
              id_nevera: nevera.id_nevera,
              id_producto: id_producto,
              stock_en_tiempo_real: 0,
              venta_semanal: 0,
              calificacion_surtido: 'MEDIA',
              stock_minimo: 0,
              stock_maximo: 0,
              stock_ideal_final: 0,
              activo: true,
              hora_calificacion: horaCalificacion
            }
          });
          this.logger.debug(`Registro creado para nevera ${nevera.id_nevera}, producto ${id_producto}`);
        }
      }

      // Refrescar stock después de crear nuevos registros (solo activos)
      const stockProducto = await this.databaseService.sTOCK_NEVERA.findMany({
        where: {
          id_nevera: { in: idsNeveras },
          id_producto: id_producto,
          activo: true
        },
        select: {
          id: true,
          id_nevera: true,
          id_producto: true,
          stock_en_tiempo_real: true,
          venta_semanal: true,
          calificacion_surtido: true,
          stock_minimo: true,
          stock_maximo: true
        }
      });

      // 2.2 Clasificar neveras: NUEVO vs RESURTIDO
      const neverasNuevas = stockProducto.filter(
        s => s.stock_en_tiempo_real === 0 && s.venta_semanal === 0
      );
      const neverasResurtido = stockProducto.filter(
        s => s.venta_semanal > 0 || s.stock_en_tiempo_real > 0
      );

      this.logger.debug(`Neveras nuevas: ${neverasNuevas.length}, Resurtido: ${neverasResurtido.length}`);

      // FASE 3: CALIFICACIÓN DE NEVERAS RESURTIDO
      this.logger.debug(`FASE 3: Calificación de neveras resurtido para producto ${id_producto}`);

      if (neverasResurtido.length > 0) {
        // 3.1 Ordenar por venta_semanal
        const neverasOrdenadas = [...neverasResurtido].sort(
          (a, b) => a.venta_semanal - b.venta_semanal
        );

        // 3.2 Calcular valores de corte
        const ventaMaxima = Math.max(...neverasResurtido.map(n => n.venta_semanal));
        const MEDIA_corte = ventaMaxima / 2;
        const BAJA_corte = MEDIA_corte * 0.5;
        const ALTA_corte = MEDIA_corte * 1.5;

        this.logger.debug(`Cortes - BAJA: ${BAJA_corte}, MEDIA: ${MEDIA_corte}, ALTA: ${ALTA_corte}`);

        // 3.3 y 3.4 Asignar calificación y UPDATE
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
              hora_calificacion: horaCalificacion
            }
          });
        }

        // 3.5 UPDATE PRODUCTOS con valores de corte
        await this.databaseService.pRODUCTOS.update({
          where: { id_producto: id_producto },
          data: {
            media: MEDIA_corte,
            baja: BAJA_corte,
            alta: ALTA_corte
          }
        });
      }

      // FASE 4: Neveras nuevas ya tienen MEDIA desde fase 2
      // No se requiere acción adicional

      // CHECKPOINT: Calificaciones listas
      this.logger.debug('CHECKPOINT: Calificaciones completadas');

      // FASE 5: DISTRIBUCIÓN DE PRODUCTOS
      this.logger.debug(`FASE 5: Distribución de productos para producto ${id_producto}`);

      // Refrescar stock con calificaciones actualizadas
      const stockActualizado = await this.databaseService.sTOCK_NEVERA.findMany({
        where: {
          id_nevera: { in: idsNeveras },
          id_producto: id_producto,
          activo: true
        },
        select: {
          id: true,
          id_nevera: true,
          stock_en_tiempo_real: true,
          calificacion_surtido: true
        }
      });

      // 5.1 Calcular totales
      const stockRealTotal = stockActualizado.reduce((sum, s) => sum + s.stock_en_tiempo_real, 0);
      const totalDisponible = cantidadLogistica + stockRealTotal;

      const N_alta = stockActualizado.filter(s => s.calificacion_surtido === 'ALTA').length;
      const N_media = stockActualizado.filter(s => s.calificacion_surtido === 'MEDIA').length;
      const N_baja = stockActualizado.filter(s => s.calificacion_surtido === 'BAJA').length;

      const pesoTotal = (2 * N_alta) + (1 * N_media) + (0.5 * N_baja);

      this.logger.debug(`Total disponible: ${totalDisponible}, Peso total: ${pesoTotal}`);
      this.logger.debug(`ALTA: ${N_alta}, MEDIA: ${N_media}, BAJA: ${N_baja}`);

      // 5.2 Calcular asignación con FLOOR
      const MEDIA_asig = Math.floor(totalDisponible / pesoTotal);
      const BAJA_asig = Math.floor(MEDIA_asig * 0.5);
      const ALTA_asig = Math.floor(MEDIA_asig * 2);

      this.logger.debug(`Asignaciones - ALTA: ${ALTA_asig}, MEDIA: ${MEDIA_asig}, BAJA: ${BAJA_asig}`);

      // 5.3 Calcular distribución inicial y sobrante
      const totalAsignado = (ALTA_asig * N_alta) + (MEDIA_asig * N_media) + (BAJA_asig * N_baja);
      let sobrante = totalDisponible - totalAsignado;

      this.logger.debug(`Total asignado: ${totalAsignado}, Sobrante: ${sobrante}`);

      // 5.4 Repartir sobrante a neveras MEDIA
      const neverasMedia = stockActualizado
        .filter(s => s.calificacion_surtido === 'MEDIA')
        .sort((a, b) => a.stock_en_tiempo_real - b.stock_en_tiempo_real);

      // Crear mapa de asignación extra por nevera
      const asignacionExtra: Map<number, number> = new Map();
      for (const n of stockActualizado) {
        asignacionExtra.set(n.id, 0);
      }

      // Distribuir sobrante
      let indice = 0;
      while (sobrante > 0 && neverasMedia.length > 0) {
        const neveraActual = neverasMedia[indice % neverasMedia.length];
        const extraActual = asignacionExtra.get(neveraActual.id) || 0;
        asignacionExtra.set(neveraActual.id, extraActual + 1);
        sobrante--;
        indice++;
      }

      // 5.5, 5.6, 5.7 Actualizar cada registro de STOCK_NEVERA
      for (const stock of stockActualizado) {
        let asignacion: number;
        
        if (stock.calificacion_surtido === 'ALTA') {
          asignacion = ALTA_asig;
        } else if (stock.calificacion_surtido === 'MEDIA') {
          asignacion = MEDIA_asig + (asignacionExtra.get(stock.id) || 0);
        } else {
          asignacion = BAJA_asig;
        }

        const stockMinimo = Math.floor(asignacion * 0.25);

        await this.databaseService.sTOCK_NEVERA.update({
          where: { id: stock.id },
          data: {
            stock_ideal_final: asignacion,
            stock_maximo: asignacion,
            stock_minimo: stockMinimo
          }
        });
      }

      this.logger.debug(`Producto ${id_producto} procesado exitosamente`);
    }

    // FIN LOOP
    this.logger.debug('Surtido completado para todos los productos');

    return {
      success: true,
      message: 'Surtido procesado exitosamente',
      hora_calificacion: horaCalificacion.toISOString(),
      resumen: {
        ciudades_procesadas: idCiudades,
        neveras_procesadas: neverasActivas.length,
        productos_procesados: productosLogistica.length
      }
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
        id_nevera: id
      }
    });

    if (empaques.length > 0) {
      throw new Error('No se puede eliminar la nevera porque tiene empaques asociados');
    }

    // Si no tiene empaques, proceder con la eliminación
    const neveraEliminada = await this.databaseService.nEVERAS.delete({
      where: {
        id_nevera: id
      }
    });

    return {
      message: 'Nevera eliminada exitosamente',
      nevera: {
        id_nevera: neveraEliminada.id_nevera
      }
    };
  }
}
