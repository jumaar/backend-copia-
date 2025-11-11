import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';

@Injectable()
export class FrigorificoService {
  private readonly logger = new Logger(FrigorificoService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async create(idUsuario: number, createFrigorificoDto: CreateFrigorificoDto) {
    return this.databaseService.fRIGORIFICO.create({
      data: {
        id_usuario: idUsuario,
        nombre_frigorifico: createFrigorificoDto.nombre_frigorifico,
        direccion: createFrigorificoDto.direccion,
        id_ciudad: createFrigorificoDto.id_ciudad,
      },
    });
  }

  async findAll(idUsuario: number) {
    // Obtener todos los frigoríficos del usuario con ciudad, departamento y básculas
    const frigorificos = await this.databaseService.fRIGORIFICO.findMany({
      where: { id_usuario: idUsuario },
      include: {
        ciudad: {
          include: {
            departamento: true,
          },
        },
        estaciones: {
          select: {
            id_estacion: true,
            clave_vinculacion: true,
          },
        },
      },
    });

    // Lotes en stock: suma de empaques con id_estado_empaque = 1 y suma de peso_exacto_g
    // Solo de los frigoríficos del usuario
    const frigorificoIds = frigorificos.map(f => f.id_frigorifico);
    const lotesEnStock = await this.databaseService.eMPAQUES.aggregate({
      where: {
        estacion: {
          frigorifico: {
            id_frigorifico: { in: frigorificoIds },
          },
        },
        id_estado_empaque: 1,
      },
      _count: {
        id_empaque: true,
      },
      _sum: {
        peso_exacto_g: true,
      },
    });

    // Lotes despachados: suma de empaques con id_estado_empaque = 2, fecha de hoy, y suma de peso_exacto_g
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const lotesDespachados = await this.databaseService.eMPAQUES.aggregate({
      where: {
        estacion: {
          frigorifico: {
            id_frigorifico: { in: frigorificoIds },
          },
        },
        id_estado_empaque: 2,
        fecha_empaque_1: {
          gte: hoy,
          lt: manana,
        },
      },
      _count: {
        id_empaque: true,
      },
      _sum: {
        peso_exacto_g: true,
      },
    });

    // Total transacciones: suma de monto en TRANSACCIONES para el id_usuario
    const totalTransacciones = await this.databaseService.tRANSACCIONES.aggregate({
      where: {
        id_usuario: idUsuario,
      },
      _sum: {
        monto: true,
      },
    });

    // Lista de todas las ciudades disponibles (esto es global, no necesita filtrado por usuario)
    const ciudadesDisponibles = await this.databaseService.cIUDAD.findMany({
      select: {
        id_ciudad: true,
        nombre_ciudad: true,
      },
      orderBy: {
        nombre_ciudad: 'asc',
      },
    });

    // Inventario agrupado por producto: empaques con estado 1, agrupados por id_producto
    // Solo de los frigoríficos del usuario
    const inventarioPorProducto = await this.databaseService.eMPAQUES.groupBy({
      by: ['id_producto'],
      where: {
        estacion: {
          frigorifico: {
            id_frigorifico: { in: frigorificoIds },
          },
        },
        id_estado_empaque: 1,
      },
      _count: {
        id_empaque: true,
      },
      _max: {
        fecha_empaque_1: true,
      },
    });

    // Obtener detalles adicionales para cada producto (nombre, peso, EPC del último)
    const inventarioDetallado = await Promise.all(
      inventarioPorProducto.map(async (item) => {
        const producto = await this.databaseService.pRODUCTOS.findUnique({
          where: { id_producto: item.id_producto },
          select: {
            nombre_producto: true,
            peso_nominal_g: true,
          },
        });

        // Obtener el EPC del último empaque (por fecha) - de cualquier frigorífico del usuario
        const ultimoEmpaque = item._max?.fecha_empaque_1 ? await this.databaseService.eMPAQUES.findFirst({
          where: {
            estacion: {
              frigorifico: {
                id_frigorifico: { in: frigorificoIds },
              },
            },
            id_estado_empaque: 1,
            id_producto: item.id_producto,
            fecha_empaque_1: item._max.fecha_empaque_1,
          },
          select: {
            EPC_id: true,
          },
          orderBy: {
            fecha_empaque_1: 'desc',
          },
        }) : null;

        return {
          id_producto: item.id_producto,
          nombre_producto: producto?.nombre_producto || '',
          cantidad: item._count.id_empaque,
          ultima_fecha: item._max.fecha_empaque_1,
          epc_id_ultimo: ultimoEmpaque?.EPC_id || '',
        };
      })
    );

    // Obtener información del usuario actual
    const usuarioActual = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: idUsuario },
      include: {
        rol: {
          select: {
            nombre_rol: true,
          },
        },
      },
    });

    return {
      usuario_actual: {
        id: usuarioActual?.id_usuario,
        nombre_completo: `${usuarioActual?.nombre_usuario || ''} ${usuarioActual?.apellido_usuario || ''}`.trim(),
        celular: usuarioActual?.celular,
        rol: usuarioActual?.rol?.nombre_rol,
        activo: usuarioActual?.activo,
      },
      frigorificos: frigorificos.map(frigorifico => ({
        id_frigorifico: frigorifico.id_frigorifico,
        nombre_frigorifico: frigorifico.nombre_frigorifico,
        direccion: frigorifico.direccion,
        ciudad: {
          id_ciudad: frigorifico.ciudad.id_ciudad,
          nombre_ciudad: frigorifico.ciudad.nombre_ciudad,
          departamento: {
            id__departamento: frigorifico.ciudad.departamento.id__departamento,
            nombre_departamento: frigorifico.ciudad.departamento.nombre_departamento,
          },
        },
        estaciones: frigorifico.estaciones,
      })),
      ciudades_disponibles: ciudadesDisponibles,
      lotes_en_stock: {
        cantidad: lotesEnStock._count.id_empaque,
        peso_total_g: lotesEnStock._sum.peso_exacto_g || 0,
      },
      lotes_despachados: {
        cantidad: lotesDespachados._count.id_empaque,
        peso_total_g: lotesDespachados._sum.peso_exacto_g || 0,
      },
      total_transacciones: totalTransacciones._sum.monto || 0,
      inventario_por_producto: inventarioDetallado,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} frigorifico`;
  }

  async update(idUsuario: number, updateFrigorificoDto: UpdateFrigorificoDto) {
    const { id_frigorifico, ...updateData } = updateFrigorificoDto;

    // Verificar que el frigorífico pertenece al usuario
    const frigorifico = await this.databaseService.fRIGORIFICO.findFirst({
      where: {
        id_frigorifico: id_frigorifico,
        id_usuario: idUsuario,
      },
    });

    if (!frigorifico) {
      throw new Error('Frigorífico no encontrado o no autorizado');
    }

    return this.databaseService.fRIGORIFICO.update({
      where: { id_frigorifico: id_frigorifico },
      data: updateData,
    });
  }

  async remove(idUsuario: number, idFrigorifico: number) {
    // Verificar que el frigorífico pertenece al usuario
    const frigorifico = await this.databaseService.fRIGORIFICO.findFirst({
      where: {
        id_frigorifico: idFrigorifico,
        id_usuario: idUsuario,
      },
    });

    if (!frigorifico) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Frigorífico no encontrado',
          message: 'El frigorífico no existe o no tienes permisos para eliminarlo.',
          code: 'FRIGORIFICO_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Verificar si el frigorífico tiene estaciones activas
    const estacionesCount = await this.databaseService.eSTACIONES.count({
      where: { id_frigorifico: idFrigorifico },
    });

    if (estacionesCount > 0) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Eliminación bloqueada',
          message: `No puedes eliminar este frigorífico porque tiene ${estacionesCount} estación(es) asociada(s). Elimina primero todas las estaciones.`,
          code: 'FRIGORIFICO_HAS_ESTACIONES',
          estacionesCount: estacionesCount
        },
        HttpStatus.FORBIDDEN
      );
    }

    try {
      return await this.databaseService.fRIGORIFICO.delete({
        where: { id_frigorifico: idFrigorifico },
      });
    } catch (error) {
      // Manejar errores de Prisma (como violaciones de clave foránea)
      if (error.code === 'P2003') {
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Eliminación bloqueada',
            message: 'No puedes eliminar este frigorífico porque tiene datos relacionados (estaciones, empaques, etc.).',
            code: 'FRIGORIFICO_HAS_RELATIONS',
            constraint: error.meta?.constraint
          },
          HttpStatus.FORBIDDEN
        );
      }
      // Re-lanzar otros errores
      throw error;
    }
  }

  async createProducto(createProductoDto: any, idUsuario: number) {
    // Verificar que el usuario tiene permisos para crear productos (roles 1, 2)
    // Los productos son globales, no específicos de frigorífico

    // Asegurarse de que no se envíe id_producto
    const { id_producto, ...data } = createProductoDto;

    // Convertir tipos de datos según el schema de Prisma
    const processedData = {
      nombre_producto: data.nombre_producto,
      descripcion_producto: data.descripcion_producto || null,
      peso_nominal_g: parseInt(data.peso_nominal_g),
      precio_venta: data.precio_venta.toString(), // Mantener como string para Decimal
      dias_vencimiento: parseInt(data.dias_vencimiento),
      precio_frigorifico: data.precio_frigorifico.toString(), // Mantener como string para Decimal
    };

    return this.databaseService.pRODUCTOS.create({
      data: processedData,
    });
  }

  async findAllProductos(idUsuario: number) {
    // Los productos son globales, cualquier usuario autorizado puede verlos
    return this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
        precio_venta: true,
        dias_vencimiento: true,
        precio_frigorifico: true,
      },
    });
  }

  async updateProducto(id: number, updateProductoDto: any, idUsuario: number) {
    // Verificar que el usuario tiene permisos para actualizar productos (roles 1, 2)
    // Los productos son globales
    return this.databaseService.pRODUCTOS.update({
      where: { id_producto: id },
      data: updateProductoDto,
    });
  }

  async removeProducto(id: number, idUsuario: number) {
    // Verificar que el usuario tiene permisos para eliminar productos (roles 1, 2)
    // Los productos son globales
    return this.databaseService.pRODUCTOS.delete({
      where: { id_producto: id },
    });
  }

  async createEstacion(idFrigorifico: number, idUsuario: number) {
    // Verificar que el frigorífico pertenece al usuario
    const frigorifico = await this.databaseService.fRIGORIFICO.findFirst({
      where: {
        id_frigorifico: idFrigorifico,
        id_usuario: idUsuario,
      },
    });

    if (!frigorifico) {
      throw new Error('Frigorífico no encontrado o no autorizado');
    }

    // Verificar que no haya claves inactivas pendientes
    const clavesInactivas = await this.databaseService.eSTACIONES.count({
      where: {
        id_frigorifico: idFrigorifico,
        activa: false,
      },
    });

    if (clavesInactivas > 0) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Creación de estación bloqueada',
          message: `No puedes crear una nueva estación. Tienes ${clavesInactivas} clave(s) pendiente(s) de activación.`,
          code: 'STATION_CREATION_BLOCKED',
          pendingStations: clavesInactivas
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Generar ID compuesto para la estación: ID_ESTACION-ID_USUARIO
    // Primero necesitamos obtener el próximo ID de estación
    const ultimoId = await this.databaseService.eSTACIONES.findFirst({
      orderBy: { id_estacion: 'desc' },
      select: { id_estacion: true },
    });

    // Extraer el número del último ID compuesto o usar 0 si no hay ninguno
    // Necesitamos encontrar el número más alto de todas las estaciones
    const todasLasEstaciones = await this.databaseService.eSTACIONES.findMany({
      select: { id_estacion: true },
    });

    let maxNumero = 0;
    for (const estacion of todasLasEstaciones) {
      const idString = estacion.id_estacion as string;
      // Buscar el último separador '00' desde la derecha
      const indexSeparador = idString.lastIndexOf('00');
      if (indexSeparador > 0) {
        const numero = parseInt(idString.substring(0, indexSeparador));
        if (!isNaN(numero) && numero > maxNumero) {
          maxNumero = numero;
        }
      }
    }

    const nuevoNumero = maxNumero + 1;
    const idCompuesto = `${nuevoNumero}00${idUsuario}`;

    // Generar clave de vinculación completa
    const claveVinculacion = this.generarClaveVinculacionCompleta(
      nuevoNumero,
      idFrigorifico,
      idUsuario
    );

    // Crear la estación con el ID compuesto
    const estacion = await this.databaseService.eSTACIONES.create({
      data: {
        id_estacion: idCompuesto,
        id_frigorifico: idFrigorifico,
        clave_vinculacion: claveVinculacion,
        activa: false, // Nueva estación inicia inactiva
      },
      select: {
        id_estacion: true,
        clave_vinculacion: true,
        activa: true,
      },
    });

    return estacion;
  }

  // Método para activar una estación cuando se conecta por primera vez
  async activarEstacion(idEstacion: string) {
    const estacion = await this.databaseService.eSTACIONES.update({
      where: { id_estacion: idEstacion },
      data: { activa: true },
      select: {
        id_estacion: true,
        activa: true,
      },
    });

    return estacion;
  }

  async deleteEstacion(idEstacion: string, idUsuario: number) {
    // Verificar que la estación pertenece a un frigorífico del usuario
    const estacion = await this.databaseService.eSTACIONES.findFirst({
      where: {
        id_estacion: idEstacion,
        frigorifico: {
          id_usuario: idUsuario,
        },
      },
    });

    if (!estacion) {
      throw new Error('Estación no encontrada o no autorizada');
    }

    return this.databaseService.eSTACIONES.delete({
      where: { id_estacion: idEstacion },
    });
  }

  private generarClaveVinculacionCompleta(
    idEstacion: number,
    idFrigorifico: number,
    idUsuario: number
  ): string {
    // Formato: ID_ESTACION + 00 + ID_FRIGORIFICO + 00 + ID_USUARIO + TOKEN (10 caracteres)
    const tokenAleatorio = this.generarCadenaAleatoria(10);
    const clave = `${idEstacion}00${idFrigorifico}00${idUsuario}${tokenAleatorio}`;

    return clave;
  }

  private async generarClaveVinculacion(idFrigorifico: number): Promise<string> {
    let clave: string;
    let existe: boolean;

    do {
      // Generar clave: ID_FRIGORIFICO + "001" + 20 caracteres aleatorios
      const parteAleatoria = this.generarCadenaAleatoria(20);
      clave = `${idFrigorifico.toString().padStart(3, '0')}001${parteAleatoria}`;

      // Verificar si ya existe
      const estacionExistente = await this.databaseService.eSTACIONES.findUnique({
        where: { clave_vinculacion: clave },
      });

      existe = !!estacionExistente;
    } while (existe);

    return clave;
  }

  private generarCadenaAleatoria(longitud: number): string {
    // Siempre empezar con una letra para evitar confusión con IDs numéricos
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const todosCaracteres = letras + numeros;

    // Primer caracter siempre es una letra
    let resultado = letras.charAt(Math.floor(Math.random() * letras.length));

    // Resto pueden ser letras o números
    for (let i = 1; i < longitud; i++) {
      resultado += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length));
    }
    return resultado;
  }

  async crearEmpaquesBatch(empaques: any[], estacionId: string, frigorificoId: number) {
    const resultados: { creados: any[], errores: any[] } = { creados: [], errores: [] };

    // Procesar en lotes de 10 para optimizar BD
    const lotes = this.chunkArray(empaques, 10);

    for (const lote of lotes) {
      for (const empaqueData of lote) {
        try {
          
          // 1. Obtener datos del producto
          const producto = await this.databaseService.pRODUCTOS.findUnique({
            where: { id_producto: empaqueData.id_producto }
          });

          if (!producto) {
            resultados.errores.push({
              id_producto: empaqueData.id_producto,
              error: 'Producto no encontrado'
            });
            continue;
          }

          
          // 2. Usar el EPC proporcionado por el frontend
          const epcId = empaqueData.epc;

          // 3. Timestamp actual para fecha_empaque_1
          const fechaEmpaque = new Date();

          // 4. El peso ya viene en gramos del frontend (no multiplicar por 1000)
          const pesoGramos = empaqueData.peso_g;

          
          if (!pesoGramos || isNaN(pesoGramos)) {
            resultados.errores.push({
              id_producto: empaqueData.id_producto,
              error: 'Peso inválido o faltante'
            });
            continue;
          }

         
          // 5. Calcular precio_venta_total: (peso * precio_venta) / peso_nominal_g
          const precioVenta = parseFloat(producto.precio_venta.toString());
          const precioFrigorifico = parseFloat(producto.precio_frigorifico.toString());
          const precioVentaTotal = (pesoGramos * precioVenta) / producto.peso_nominal_g;

          // 6. Calcular fecha_vencimiento: fecha_empaque_1 + dias_vencimiento
          const fechaVencimiento = new Date(fechaEmpaque);
          fechaVencimiento.setDate(fechaEmpaque.getDate() + producto.dias_vencimiento);

          // 7. Calcular costo_frigorifico: precio_venta_total * (precio_frigorifico / 100)
          const costoFrigorifico = precioVentaTotal * (precioFrigorifico / 100);

          // 8. Crear empaque con todos los campos calculados
          const empaque = await this.databaseService.eMPAQUES.create({
            data: {
              EPC_id: epcId,
              fecha_empaque_1: fechaEmpaque,
              id_estacion: estacionId, // Del WebSocket (ej: "39008")
              id_producto: empaqueData.id_producto,
              peso_exacto_g: pesoGramos.toString(), // Decimal como string
              precio_venta_total: precioVentaTotal.toString(), // Mantener como string para Decimal
              fecha_vencimiento: fechaVencimiento,
              costo_frigorifico: costoFrigorifico.toString(), // Mantener como string para Decimal
              id_estado_empaque: 1, // En stock
            }
          });

          // Formatear fecha de vencimiento en español sin "de"
          const opcionesFecha: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: 'long', day: 'numeric'
          };
          const fechaFormateada = fechaVencimiento.toLocaleDateString('es-ES', opcionesFecha);
          const fechaVencimientoFormateada = fechaFormateada.replace(/ de /g, ' ');

          resultados.creados.push({
            epc: epcId,
            precio_venta_total: precioVentaTotal,
            fecha_vencimiento: fechaVencimientoFormateada
          });

        } catch (error) {
          // Manejar error específico de EPC duplicado
          if (error.code === 'P2002' && error.meta?.target?.includes('EPC_id')) {
            this.logger.warn(`⚠️ EPC duplicado detectado: ${empaqueData.epc} para producto ${empaqueData.id_producto}`);
            resultados.errores.push({
              id_producto: empaqueData.id_producto,
              epc: empaqueData.epc,
              error: 'EPC ya existe en el sistema',
              code: 'EPC_DUPLICADO'
            });
          } else {
            this.logger.error(`❌ Error creando empaque para producto ${empaqueData.id_producto}:`, error.message);
            resultados.errores.push({
              id_producto: empaqueData.id_producto,
              error: error.message,
              stack: error.stack
            });
          }
        }
      }
    }

    return resultados;
  }

  async getHistorialEstacion(estacionId: string) {
    // Obtener todos los empaques de la estación con estado 1 (en stock)
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_estacion: estacionId,
        id_estado_empaque: 1,
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
      orderBy: {
        fecha_empaque_1: 'desc',
      },
    });

    // Agrupar empaques por producto
    const empaquesPorProducto = empaques.reduce((acc, empaque) => {
      const productoId = empaque.id_producto;
      if (!acc[productoId]) {
        acc[productoId] = {
          id_producto: productoId,
          nombre_producto: empaque.producto.nombre_producto,
          peso_nominal_g: empaque.producto.peso_nominal_g,
          cantidad_total: 0,
          empaques: [],
        };
      }

      acc[productoId].cantidad_total++;
      acc[productoId].empaques.push({
        epc: empaque.EPC_id,
        peso_g: empaque.peso_exacto_g,
        precio_venta_total: parseFloat(empaque.precio_venta_total.toString()),
        fecha_empaque: empaque.fecha_empaque_1,
      });

      return acc;
    }, {});

    // Convertir objeto a array
    const productos = Object.values(empaquesPorProducto);

    return { productos };
  }

  async deleteEmpaqueByEpc(estacionId: string, epc: string, idUsuario?: number) {
    // Si se proporciona idUsuario, verificar que la estación pertenece a sus frigoríficos
    if (idUsuario) {
      const estacion = await this.databaseService.eSTACIONES.findFirst({
        where: {
          id_estacion: estacionId,
          frigorifico: {
            id_usuario: idUsuario,
          },
        },
      });

      if (!estacion) {
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Acceso denegado',
            message: 'La estación no pertenece a tus frigoríficos.',
            code: 'ESTACION_NO_AUTORIZADA'
          },
          HttpStatus.FORBIDDEN
        );
      }
    }

    // Verificar si el empaque existe antes de intentar eliminarlo
    const empaqueExistente = await this.databaseService.eMPAQUES.findFirst({
      where: {
        EPC_id: epc,
        id_estacion: estacionId,
        id_estado_empaque: 1,
      },
    });

    if (!empaqueExistente) {
      this.logger.warn(`⚠️ Intento de eliminar empaque inexistente: ${epc} en estación ${estacionId}`);
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Empaque no encontrado',
          message: 'El empaque no existe, no pertenece a esta estación o ya fue vendido.',
          code: 'EMPAQUE_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Eliminar un empaque específico por EPC, verificando que pertenezca a la estación y esté en estado 1
    const result = await this.databaseService.eMPAQUES.deleteMany({
      where: {
        EPC_id: epc,
        id_estacion: estacionId,
        id_estado_empaque: 1,
      },
    });

    if (result.count === 0) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error interno',
          message: 'Error interno al eliminar el empaque.',
          code: 'DELETE_FAILED'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return { deleted: true, epc: epc };
  }

  async getCatalogoProductos(frigorificoId: number) {
    // Obtener productos disponibles para el frigorífico
    return this.databaseService.pRODUCTOS.findMany({
      where: {
        // Los productos son globales, pero podríamos filtrar por frigorífico si es necesario
      },
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
        precio_venta: true,
        precio_frigorifico: true,
        dias_vencimiento: true,
      },
      orderBy: {
        nombre_producto: 'asc'
      }
    });
  }

  private async generarEPC(): Promise<string> {
    // Generar código EPC único (similar a RFID)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EPC-${timestamp}-${random}`.toUpperCase();
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getGestionFrigorifico(idUsuario: number) {
    // Obtener información básica del usuario y sus frigoríficos
    const frigorificos = await this.databaseService.fRIGORIFICO.findMany({
      where: { id_usuario: idUsuario },
      include: {
        ciudad: {
          include: {
            departamento: true,
          },
        },
        estaciones: {
          select: {
            id_estacion: true,
            clave_vinculacion: true,
            activa: true,
          },
        },
      },
    });

    if (frigorificos.length === 0) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Frigoríficos no encontrados',
          message: 'No se encontraron frigoríficos asociados al usuario.',
          code: 'FRIGORIFICOS_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Obtener información del usuario
    const usuarioActual = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: idUsuario },
      include: {
        rol: {
          select: {
            nombre_rol: true,
          },
        },
      },
    });

    // Procesar cada frigorífico y sus estaciones
    const frigorificosProcesados = await Promise.all(
      frigorificos.map(async (frigorifico) => {
        // Obtener datos generales del frigorífico
        const frigorificoIds = [frigorifico.id_frigorifico];

        // Lotes en stock del frigorífico
        const lotesEnStock = await this.databaseService.eMPAQUES.aggregate({
          where: {
            estacion: {
              frigorifico: {
                id_frigorifico: { in: frigorificoIds },
              },
            },
            id_estado_empaque: 1,
          },
          _count: {
            id_empaque: true,
          },
          _sum: {
            peso_exacto_g: true,
          },
        });

        // Lotes despachados del día
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        const lotesDespachados = await this.databaseService.eMPAQUES.aggregate({
          where: {
            estacion: {
              frigorifico: {
                id_frigorifico: { in: frigorificoIds },
              },
            },
            id_estado_empaque: 2,
            fecha_empaque_1: {
              gte: hoy,
              lt: manana,
            },
          },
          _count: {
            id_empaque: true,
          },
          _sum: {
            peso_exacto_g: true,
          },
        });

        // Total transacciones del usuario
        const totalTransacciones = await this.databaseService.tRANSACCIONES.aggregate({
          where: {
            id_usuario: idUsuario,
          },
          _sum: {
            monto: true,
          },
        });

        // Procesar cada estación del frigorífico
        const estacionesProcesadas = await Promise.all(
          frigorifico.estaciones.map(async (estacion) => {
            // Obtener empaques de la estación agrupados por producto
            const empaques = await this.databaseService.eMPAQUES.findMany({
              where: {
                id_estacion: estacion.id_estacion,
                id_estado_empaque: 1,
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
              orderBy: {
                fecha_empaque_1: 'desc',
              },
            });

            // Agrupar empaques por producto
            const productosAgrupados = empaques.reduce((acc, empaque) => {
              const productoId = empaque.id_producto;
              if (!acc[productoId]) {
                acc[productoId] = {
                  id_producto: productoId,
                  nombre_producto: empaque.producto.nombre_producto,
                  peso_nominal_g: empaque.producto.peso_nominal_g,
                  cantidad_total: 0,
                  peso_total_g: 0,
                  empaques: [],
                };
              }

              acc[productoId].cantidad_total++;
              acc[productoId].peso_total_g += parseFloat(empaque.peso_exacto_g.toString());
              acc[productoId].empaques.push({
                epc: empaque.EPC_id,
                peso_g: empaque.peso_exacto_g,
                precio_venta_total: parseFloat(empaque.precio_venta_total.toString()),
                fecha_empaque: empaque.fecha_empaque_1,
              });

              return acc;
            }, {});

            // Convertir a array y calcular totales por estación
            const productosArray = Object.values(productosAgrupados);
            const totalEmpaquesEstacion = productosArray.reduce((sum, prod: any) => sum + prod.cantidad_total, 0);
            const totalPesoEstacion = productosArray.reduce((sum, prod: any) => sum + prod.peso_total_g, 0);

            return {
              id_estacion: estacion.id_estacion,
              clave_vinculacion: estacion.clave_vinculacion,
              activa: estacion.activa,
              total_empaques: totalEmpaquesEstacion,
              peso_total_g: totalPesoEstacion,
              productos: productosArray,
            };
          })
        );

        return {
          id_frigorifico: frigorifico.id_frigorifico,
          nombre_frigorifico: frigorifico.nombre_frigorifico,
          direccion: frigorifico.direccion,
          ciudad: {
            id_ciudad: frigorifico.ciudad.id_ciudad,
            nombre_ciudad: frigorifico.ciudad.nombre_ciudad,
            departamento: {
              id__departamento: frigorifico.ciudad.departamento.id__departamento,
              nombre_departamento: frigorifico.ciudad.departamento.nombre_departamento,
            },
          },
          lotes_en_stock: {
            cantidad: lotesEnStock._count.id_empaque,
            peso_total_g: lotesEnStock._sum.peso_exacto_g || 0,
          },
          lotes_despachados: {
            cantidad: lotesDespachados._count.id_empaque,
            peso_total_g: lotesDespachados._sum.peso_exacto_g || 0,
          },
          total_transacciones: totalTransacciones._sum.monto || 0,
          estaciones: estacionesProcesadas,
        };
      })
    );

    // Lista de ciudades disponibles
    const ciudadesDisponibles = await this.databaseService.cIUDAD.findMany({
      select: {
        id_ciudad: true,
        nombre_ciudad: true,
      },
      orderBy: {
        nombre_ciudad: 'asc',
      },
    });

    return {
      usuario_actual: {
        id: usuarioActual?.id_usuario,
        nombre_completo: `${usuarioActual?.nombre_usuario || ''} ${usuarioActual?.apellido_usuario || ''}`.trim(),
        celular: usuarioActual?.celular,
        rol: usuarioActual?.rol?.nombre_rol,
        activo: usuarioActual?.activo,
      },
      frigorificos: frigorificosProcesados,
      ciudades_disponibles: ciudadesDisponibles,
    };
  }

  async getGestionFrigorificoPorUsuario(id_usuario: number, requesterId: number, requesterRole: number) {
    // Verificar que el usuario solicitado existe y es de rol 3
    const usuarioSolicitado = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario },
      include: {
        rol: {
          select: {
            nombre_rol: true,
          },
        },
      },
    });

    if (!usuarioSolicitado) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Usuario no encontrado',
          message: 'El usuario solicitado no existe.',
          code: 'USER_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    if (usuarioSolicitado.id_rol !== 3) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'El usuario solicitado no es un frigorífico.',
          code: 'NOT_FRIGORIFICO'
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Verificar que el solicitante tiene permisos (rol 2 o 4)
    if (requesterRole !== 2 && requesterRole !== 4) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a esta información.',
          code: 'PERMISSION_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Determinar el admin según el rol del solicitante
    let adminId: number;
    
    if (requesterRole === 2) {
      // Si el solicitante es un admin (rol 2), él mismo es el admin
      adminId = requesterId;
    } else {
      // Para rol 4, buscar su creador
      const tokenCreator = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: {
          id_usuario_nuevo: requesterId,
        },
        select: {
          id_usuario_creador: true,
        },
      });
      
      if (!tokenCreator || !tokenCreator.id_usuario_creador) {
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Acceso denegado',
            message: 'No se pudo determinar el administrador que creó este usuario.',
            code: 'HIERARCHY_ERROR'
          },
          HttpStatus.FORBIDDEN
        );
      }
      
      adminId = tokenCreator.id_usuario_creador;
    }

    // Verificar que el usuario solicitado fue creado por el mismo admin
    const tokenSolicitado = await this.databaseService.tOKEN_REGISTRO.findFirst({
      where: {
        id_usuario_nuevo: id_usuario,
        id_usuario_creador: adminId,
      },
    });

    if (!tokenSolicitado) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para ver la información de este frigorífico.',
          code: 'PERMISSION_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Si se permite el acceso, devolver la información del frigorífico
    return this.getGestionFrigorifico(id_usuario);
  }

  // Método para cambiar el estado de los empaques
  async cambiarEstadoEmpaques(id_estacion: string, id_producto: number, id_logistica: number, id_usuario: number) {
    // Verificar que el usuario tiene permisos (solo rol 4)
    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario },
      include: {
        rol: true
      }
    });
    
    if (!usuario || usuario.id_rol !== 4) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para realizar esta operación.',
          code: 'PERMISSION_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }
    
    // Verificar que la estación existe y está asociada a un frigorífico del mismo admin
    // Solo usuarios rol 4 pueden utilizar este endpoint
    const adminId = await this.obtenerAdminId(usuario.id_usuario);
    
    if (!adminId) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No se pudo determinar la jerarquía del usuario.',
          code: 'HIERARCHY_ERROR'
        },
        HttpStatus.FORBIDDEN
      );
    }
    
    // Verificar que la estación pertenece a un frigorífico del mismo admin
    const estacion = await this.databaseService.eSTACIONES.findFirst({
      where: {
        id_estacion: id_estacion,
        frigorifico: {
          id_usuario: {
            in: await this.obtenerUsuariosPorAdmin(adminId, 3),
          },
        },
      },
    });
    
    if (!estacion) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Estación no encontrada',
          message: 'La estación no existe o no tienes permisos para acceder a ella.',
          code: 'ESTACION_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }
    
    // Cambiar el estado de los empaques del producto en la estación
    const fechaActual = new Date();
    
    // Actualizar los empaques con estado 1 a estado 2
    const result = await this.databaseService.eMPAQUES.updateMany({
      where: {
        id_estacion: id_estacion,
        id_producto: id_producto,
        id_estado_empaque: 1, // Solo cambiar los que están en estado 1
      },
      data: {
        id_estado_empaque: 2, // Cambiar a estado 2
        hora_en_logistica_2: fechaActual,
        id_logistica: id_logistica, // Agregar el id_logistica
      },
    });
    
    return {
      actualizados: result.count,
      fecha_cambio: fechaActual,
      id_logistica: id_logistica,
    };
  }

  // Función auxiliar para obtener el ID del admin de un usuario
  private async obtenerAdminId(userId: number): Promise<number | null> {
    const token = await this.databaseService.tOKEN_REGISTRO.findFirst({
      where: {
        id_usuario_nuevo: userId,
      },
      select: {
        id_usuario_creador: true,
      },
    });
    
    return token?.id_usuario_creador || null;
  }
  
  // Función auxiliar para obtener usuarios por admin y rol
  private async obtenerUsuariosPorAdmin(adminId: number, roleId: number): Promise<number[]> {
    const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: {
        id_usuario_creador: adminId,
        id_rol_nuevo_usuario: roleId,
      },
      select: {
        id_usuario_nuevo: true,
      },
    });
    
    return tokens.map(t => t.id_usuario_nuevo).filter(id => id !== null) as number[];
  }

  async getHermanosFrigorifico(requesterId: number, requesterRole: number) {
    // Verificar que el solicitante tiene permisos (rol 2 o 4)
    if (requesterRole !== 2 && requesterRole !== 4) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a esta información.',
          code: 'PERMISSION_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Obtener información del usuario solicitante
    const usuarioSolicitante = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: requesterId },
      include: {
        rol: true,
        logisticas: true // Incluir datos de logística si existen
      }
    });

    if (!usuarioSolicitante) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Usuario no encontrado',
          message: 'El usuario solicitante no existe.',
          code: 'USER_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Inicializar el ID del admin
    let adminId: number;
    
    // Si el solicitante es un admin (rol 2), él mismo es el admin
    if (requesterRole === 2) {
      adminId = requesterId;
    }
    // Si el solicitante es logística (rol 4), buscar su creador (que debe ser un admin)
    else {
      // Para rol 4
      const tokenCreator = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: {
          id_usuario_nuevo: requesterId,
        },
        select: {
          id_usuario_creador: true,
        },
      });
      
      if (!tokenCreator || !tokenCreator.id_usuario_creador) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Error de relación jerárquica',
            message: 'No se pudo determinar el administrador que creó este usuario.',
            code: 'HIERARCHY_ERROR'
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      adminId = tokenCreator.id_usuario_creador;
    }
    
    // Buscar todos los usuarios con rol 3 que fueron creados por este admin
    // Esto incluirá usuarios de tipo Frigorífico
    const tokensFrigorificos = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: {
        id_usuario_creador: adminId,
        id_rol_nuevo_usuario: 3, // Rol de frigorífico
      },
      select: {
        id_usuario_nuevo: true,
      },
    });
    
    const hermanosIds = tokensFrigorificos.map(t => t.id_usuario_nuevo).filter(id => id !== null);
    
    // Obtener información detallada de cada frigorífico
    const hermanos = await this.databaseService.uSUARIOS.findMany({
      where: {
        id_usuario: {
          in: hermanosIds,
        },
        activo: true, // Solo usuarios activos
      },
      select: {
        id_usuario: true,
        nombre_usuario: true,
        apellido_usuario: true,
        email: true,
        celular: true,
      },
    });

    // Si es un usuario de logística, obtener los datos de logística
    let logisticaData: any = null;
    if (requesterRole === 4 && usuarioSolicitante.logisticas && usuarioSolicitante.logisticas.length > 0) {
      logisticaData = usuarioSolicitante.logisticas.map(log => ({
        id_logistica: log.id_logistica,
        nombre_empresa: log.nombre_empresa,
        placa_vehiculo: log.placa_vehiculo
      }));
    }

    return {
      logistica: logisticaData,
      hermanos: hermanos,
    };
  }

  async loginEstacion(claveVinculacion: string) {
    // Validar longitud mínima de la clave (simulación)
    if (!claveVinculacion || claveVinculacion.length < 5) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Clave inválida',
          message: 'La clave de vinculación debe tener al menos 5 caracteres.',
          code: 'CLAVE_INVALIDA'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // Buscar la estación por clave de vinculación
    const estacion = await this.databaseService.eSTACIONES.findUnique({
      where: { clave_vinculacion: claveVinculacion },
      include: {
        frigorifico: {
          select: {
            id_frigorifico: true,
            nombre_frigorifico: true,
          },
        },
      },
    });

    if (!estacion) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Estación no encontrada',
          message: 'La clave de vinculación no corresponde a ninguna estación registrada.',
          code: 'ESTACION_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Si la estación ya está activada, permitir el login sin cambiar el estado
    // Esto permite que la misma clave se use múltiples veces
    if (!estacion.activa) {
      // Solo activar si no está activada
      await this.databaseService.eSTACIONES.update({
        where: { id_estacion: estacion.id_estacion },
        data: { activa: true },
      });
    }

    // Generar token JWT para la estación (válido por 24 horas)
    const payload = {
      sub: estacion.id_estacion,
      type: 'estacion',
      frigorificoId: estacion.id_frigorifico,
      frigorificoNombre: estacion.frigorifico.nombre_frigorifico,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '24h' });

    // Nota: La tabla ESTACIONES no tiene campo ultima_conexion en el esquema actual
    // Si se necesita tracking de conexiones, habría que agregarlo al esquema

    return {
      access_token: token,
      token_type: 'bearer',
      estacion: {
        id_estacion: estacion.id_estacion,
        frigorifico: estacion.frigorifico,
        ultima_conexion: new Date(),
      },
    };
  }
}