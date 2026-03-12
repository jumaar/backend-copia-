import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ValidacionDosaTresDto } from './dto/validacion-dosatres.dto';
import { EmpaqueValidado } from './interfaces/empaque.interface';

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
        contraseña: contrasena
      },
      include: {
        tienda: true
      }
    });

    if (!nevera) {
      throw new HttpException({
        success: false,
        error: 'Contraseña incorrecta',
        code: 'CONTRASENA_INCORRECTA'
      }, HttpStatus.UNAUTHORIZED);
    }

    // Verificar que la nevera esté en estado 1 (inactiva)
    if (nevera.id_estado_nevera !== 1) {
      throw new HttpException({
        success: false,
        error: 'La nevera no está en estado inactivo',
        code: 'ESTADO_NO_PERMITIDO'
      }, HttpStatus.BAD_REQUEST);
    }

    // Actualizar el estado de la nevera de 1 a 2 (de inactiva a activa)
    await this.databaseService.nEVERAS.update({
      where: {
        id_nevera: nevera.id_nevera
      },
      data: {
        id_estado_nevera: 2
      }
    });

    // Obtener todos los productos con su nombre, descripción, peso nominal e id_producto
    const productos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true
      }
    });

    // Generar un JWT con duración infinita (sin expiración)
    const payload = {
      sub: nevera.id_nevera,
      tipo: 'nevera_activacion',
      contrasena: contrasena
    };
    
    // Generar token con una expiración muy larga (aproximadamente 100 años) para simular "infinito"
    const token = this.jwtService.sign(payload, { expiresIn: '876000h' }); // 100 años aproximadamente

    return {
      success: true,
      message: 'Nevera activada exitosamente',
      token: token,
      id_nevera: nevera.id_nevera,
      nombre_tienda: nevera.tienda?.nombre_tienda,
      productos: productos
    };
  }

  /**
   * Endpoint principal de surtido de neveras
   * GET /api/neveras/surtir?id_ciudad=1,3
   */
  async surtirNeveras(idCiudadesParam: string, idUsuario: number) {
    const horaCalificacion = new Date();

    if (!idCiudadesParam || idCiudadesParam.trim() === '') {
      throw new HttpException({
        success: false,
        error: 'El parámetro id_ciudad es requerido',
        code: 'MISSING_CIUDAD_PARAM'
      }, HttpStatus.BAD_REQUEST);
    }

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

    // Convertir a formato más manejable
    const productosLogistica = productosEnLogistica.map(p => ({
      id_producto: p.id_producto,
      cantidad: p._count.id_empaque
    }));

    // LOOP: Iterar por cada producto en logística
    for (const productoLog of productosLogistica) {
      const { id_producto, cantidad: cantidadLogistica } = productoLog;

      // FASE 2: VERIFICACIÓN Y CREACIÓN DE REGISTROS

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
        } else if (stockExistenteNevera.activo) {
          // SI existe y está activo → ACTUALIZAR hora_calificacion
          await this.databaseService.sTOCK_NEVERA.update({
            where: { id: stockExistenteNevera.id },
            data: {
              hora_calificacion: horaCalificacion
            }
          });
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

      // FASE 3: CALIFICACIÓN DE NEVERAS RESURTIDO

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

      // FASE 5: DISTRIBUCIÓN DE PRODUCTOS

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

      // 5.2 Calcular asignación con FLOOR
      const MEDIA_asig = Math.floor(totalDisponible / pesoTotal);
      const BAJA_asig = Math.floor(MEDIA_asig * 0.5);
      const ALTA_asig = Math.floor(MEDIA_asig * 2);

      // 5.3 Calcular distribución inicial y sobrante
      const totalAsignado = (ALTA_asig * N_alta) + (MEDIA_asig * N_media) + (BAJA_asig * N_baja);
      let sobrante = totalDisponible - totalAsignado;

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
    }

    // FIN LOOP

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

  async actualizarNeveras() {
    // Obtener todas las neveras activas (estado 2) con sus tiendas
    const neverasActivas = await this.databaseService.nEVERAS.findMany({
      where: {
        id_estado_nevera: 2 // Solo neveras activas
      },
      include: {
        tienda: {
          select: {
            nombre_tienda: true
          }
        }
      }
    });

    // Procesar cada nevera para generar su token y preparar la información
    const neverasProcesadas = await Promise.all(neverasActivas.map(async (nevera) => {
      // Generar token para esta nevera
      const payload = {
        sub: nevera.id_nevera,
        tipo: 'nevera_actualizacion',
        contrasena: nevera.contraseña
      };
      
      const token = this.jwtService.sign(payload, { expiresIn: '876000h' }); // 100 años aproximadamente

      return {
        id_nevera: nevera.id_nevera,
        nombre_tienda: nevera.tienda?.nombre_tienda,
        token: token
      };
    }));

    // Obtener todos los productos únicos (tabla global)
    const productos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true
      }
    });

    return {
      success: true,
      message: 'Información de neveras activas obtenida exitosamente',
      neveras: neverasProcesadas,
      productos: productos
    };
  }

  /**
    * Endpoint para validar empaques que entran a una nevera
    * POST /api/neveras/validacionDosaTres
    */
   async validacionDosaTres(dto: ValidacionDosaTresDto) {
     const { fridge_id, timestamp, pending_packages } = dto;
     this.logger.log(`Validando empaques para nevera ${fridge_id}`);

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
                 nombre_producto: true
               }
             }
           }
         });
       } else if (id_empaque) {
         empaque = await this.databaseService.eMPAQUES.findUnique({
           where: { id_empaque: id_empaque },
           include: {
             producto: {
               select: {
                 id_producto: true,
                 nombre_producto: true
               }
             }
           }
         });
       }

       // Verificar que el empaque exista y esté en estado 2 (en logística)
       if (!empaque) {
         empaquesInvalidos.push({
           epc: epc || null,
           id_empaque: id_empaque || null,
           id_nevera: null,
           error: `Empaque no encontrado: ${epc || id_empaque}`
         });
       } else if (empaque.id_estado_empaque !== 2) {
         empaquesInvalidos.push({
           epc: epc || null,
           id_empaque: id_empaque || null,
           id_nevera: empaque.id_nevera,
           error: `Empaque no está en estado de logística (estado actual: ${empaque.id_estado_empaque}): ${epc || id_empaque}`
         });
       } else {
         empaquesValidos.push({
           empaque: empaque,
           epc: epc || null,
           id_empaque: id_empaque || null
         });
       }
     }

     // Paso 2: Si hay empaques válidos, procesarlos en una transacción
     let empaquesActualizados: any[] = [];
     let success = false;
     let message = '';

     if (empaquesValidos.length > 0) {
       empaquesActualizados = await this.databaseService.$transaction(async (prisma) => {
         // 1. Actualizar la tabla de neveras con la última conexión
         await prisma.nEVERAS.update({
           where: { id_nevera: fridge_id },
           data: {
             ultima_conexion: fechaConexion
           }
         });

         // 2. Procesar cada empaque válido
         const resultados: any[] = [];

         for (const packageData of empaquesValidos) {
           const { empaque, epc, id_empaque } = packageData;

           // Actualizar el empaque
           const empaqueActualizado = await prisma.eMPAQUES.update({
             where: { id_empaque: empaque.id_empaque },
             data: {
               id_nevera: fridge_id,
               id_estado_empaque: 3, // Estado 3: en nevera
               hora_en_nevera_3: fechaTimestamp
             },
             include: {
               producto: {
                 select: {
                   id_producto: true,
                   nombre_producto: true
                 }
               }
             }
           });

           resultados.push({
             id_empaque: empaqueActualizado.id_empaque,
             epc: empaqueActualizado.EPC_id,
             peso_exacto_g: empaqueActualizado.peso_exacto_g,
             id_producto: empaqueActualizado.producto.id_producto,
             nombre_producto: empaqueActualizado.producto.nombre_producto
           });
         }

         return resultados;
       });

       success = true;
       message = empaquesInvalidos.length === 0
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
       empaques_no_procesados: empaquesInvalidos
     };
   }
}
