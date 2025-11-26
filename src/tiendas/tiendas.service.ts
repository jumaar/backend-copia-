import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TiendasService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Verifica si un usuario tiene permisos para acceder a una nevera
   * Jerarquía: Rol 1 → Rol 2 → Rol 4 → Rol 5
   * @param rolUsuario Rol del usuario actual
   * @param idUsuarioActual ID del usuario actual
   * @param idUsuarioTienda ID del usuario propietario de la tienda
   * @param idNevera ID de la nevera a verificar
   * @returns boolean - true si tiene permiso, false si no
   */
  private async verificarPermisoNevera(
    rolUsuario: number,
    idUsuarioActual: number,
    idUsuarioTienda: number,
    idNevera: number
  ): Promise<boolean> {
    switch (rolUsuario) {
      case 1: // Super Admin - puede ver todo
        return true;

      case 2: // Admin - solo puede ver lo creado por sus "hijos" (rol 4) y "nietos" (rol 5)
        // Verificar si el usuario actual es creador directo del usuario de la tienda (hijo directo)
        const esHijoDirecto = await this.databaseService.tOKEN_REGISTRO.findFirst({
          where: {
            id_usuario_creador: idUsuarioActual,
            id_usuario_nuevo: idUsuarioTienda
          }
        });

        if (esHijoDirecto) return true;

        // Verificar si es un "nieto" (usuario rol 5 creado por un rol 4 que fue creado por el admin actual)
        if (idUsuarioTienda) {
          const usuarioTienda = await this.databaseService.uSUARIOS.findUnique({
            where: { id_usuario: idUsuarioTienda },
            select: { id_rol: true }
          });

          if (usuarioTienda?.id_rol === 5) {
            // Encontrar quién creó este rol 5
            const quienCreoElRol5 = await this.databaseService.tOKEN_REGISTRO.findFirst({
              where: {
                id_usuario_nuevo: idUsuarioTienda
              }
            });

            if (quienCreoElRol5) {
              // Verificar si quien lo creó es un rol 4
              const supervisor = await this.databaseService.uSUARIOS.findUnique({
                where: { id_usuario: quienCreoElRol5.id_usuario_creador },
                select: { id_rol: true }
              });

              if (supervisor?.id_rol === 4) {
                // Verificar si ese supervisor (rol 4) fue creado por el admin actual
                const supervisorEsHijoDelAdmin = await this.databaseService.tOKEN_REGISTRO.findFirst({
                  where: {
                    id_usuario_creador: idUsuarioActual,
                    id_usuario_nuevo: quienCreoElRol5.id_usuario_creador
                  }
                });

                return !!supervisorEsHijoDelAdmin;
              }
            }
          }
        }

        return false;

      case 4: // Supervisor - puede ver tiendas de sus "hijos" (rol 5)
        // Verificar si el usuario actual es creador del usuario propietario de la tienda
        const relacionSupervisor = await this.databaseService.tOKEN_REGISTRO.findFirst({
          where: {
            id_usuario_creador: idUsuarioActual,
            id_usuario_nuevo: idUsuarioTienda
          }
        });
        return !!relacionSupervisor;

      case 5: // Cliente final - solo sus propias tiendas/neveras
        return idUsuarioActual === idUsuarioTienda;

      default:
        return false;
    }
  }

  async create(createTiendaDto: CreateTiendaDto, id_usuario: number) {
    const { nombre_tienda, direccion, id_ciudad } = createTiendaDto;

    // Verificar que el usuario no tenga tiendas con neveras inactivas o sin neveras
    const tiendasExistentes = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: id_usuario },
      include: {
        neveras: {
          select: {
            id_estado_nevera: true
          }
        }
      }
    });

    // Verificar cada tienda existente
    for (const tienda of tiendasExistentes) {
      const neverasActivas = tienda.neveras.filter(nevera => nevera.id_estado_nevera === 2).length;
      const tieneNeverasInactivas = tienda.neveras.some(nevera => nevera.id_estado_nevera === 1);

      // Si la tienda no tiene neveras activas (no tiene neveras o solo tiene inactivas)
      if (neverasActivas === 0 || tieneNeverasInactivas) {
        throw new HttpException(
          {
            status: HttpStatus.FORBIDDEN,
            error: 'Creación de tienda bloqueada',
            message: 'No puedes crear una nueva tienda. Debes activar las neveras de tu tienda existente antes de crear otra.',
            code: 'TIENDA_CREATION_BLOCKED',
            tiendaPendiente: {
              id_tienda: tienda.id_tienda,
              nombre_tienda: tienda.nombre_tienda,
              neveras_inactivas: tienda.neveras.filter(n => n.id_estado_nevera === 1).length,
              total_neveras: tienda.neveras.length
            }
          },
          HttpStatus.FORBIDDEN
        );
      }
    }

    // Crear la tienda
    const nuevaTienda = await this.databaseService.tIENDAS.create({
      data: {
        id_usuario,
        nombre_tienda,
        direccion,
        id_ciudad
      },
      include: {
        ciudad: {
          select: {
            nombre_ciudad: true,
            departamento: {
              select: {
                nombre_departamento: true
              }
            }
          }
        }
      }
    });

    return {
      message: 'Tienda creada exitosamente',
      tienda: {
        id_tienda: nuevaTienda.id_tienda,
        nombre_tienda: nuevaTienda.nombre_tienda,
        direccion: nuevaTienda.direccion,
        ciudad: nuevaTienda.ciudad.nombre_ciudad,
        departamento: nuevaTienda.ciudad.departamento.nombre_departamento
      }
    };
  }

  async getTiendasByUsuario(id_usuario: number) {
    // Obtener todas las tiendas del usuario con sus neveras
    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: id_usuario },
      include: {
        ciudad: {
          select: {
            nombre_ciudad: true,
            departamento: {
              select: {
                nombre_departamento: true
              }
            }
          }
        },
        neveras: {
          select: {
            id_nevera: true,
            contraseña: true,
            id_estado_nevera: true
          }
        }
      }
    });

    // Obtener todas las ciudades disponibles
    const ciudades = await this.databaseService.cIUDAD.findMany({
      include: {
        departamento: {
          select: {
            nombre_departamento: true
          }
        }
      },
      orderBy: [
        { departamento: { nombre_departamento: 'asc' } },
        { nombre_ciudad: 'asc' }
      ]
    });

    return {
      tiendas: tiendas.map(tienda => ({
        id_tienda: tienda.id_tienda,
        nombre_tienda: tienda.nombre_tienda,
        direccion: tienda.direccion,
        ciudad: tienda.ciudad.nombre_ciudad,
        departamento: tienda.ciudad.departamento.nombre_departamento,
        neveras: tienda.neveras.map(nevera => ({
          id_nevera: nevera.id_nevera,
          contraseña: nevera.contraseña,
          id_estado_nevera: nevera.id_estado_nevera
        }))
      })),
      ciudades_disponibles: ciudades.map(ciudad => ({
        id_ciudad: ciudad.id_ciudad,
        nombre_ciudad: ciudad.nombre_ciudad,
        departamento: ciudad.departamento.nombre_departamento
      }))
    };
  }

  async createNevera(createNeveraDto: any, id_usuario: number) {
    const { id_tienda } = createNeveraDto;

    // Verificar que la tienda pertenece al usuario
    const tienda = await this.databaseService.tIENDAS.findFirst({
      where: {
        id_tienda: id_tienda,
        id_usuario: id_usuario
      }
    });

    if (!tienda) {
      throw new Error('Tienda no encontrada o no tienes permiso para agregar neveras');
    }

    // Verificar que no haya neveras inactivas pendientes
    const neverasInactivas = await this.databaseService.nEVERAS.count({
      where: {
        id_tienda: id_tienda,
        id_estado_nevera: 1, // Estado inactiva
      },
    });

    if (neverasInactivas > 0) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Creación de nevera bloqueada',
          message: `No puedes crear una nueva nevera. Tienes ${neverasInactivas} nevera(s) pendiente(s) de activación.`,
          code: 'NEVERA_CREATION_BLOCKED',
          pendingNeveras: neverasInactivas
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Generar contraseña única
    let contraseña = '';
    let isUnique = false;
    while (!isUnique) {
      contraseña = this.generatePassword(12);
      const existingNevera = await this.databaseService.nEVERAS.findFirst({
        where: { contraseña: contraseña }
      });
      if (!existingNevera) {
        isUnique = true;
      }
    }

    // Crear la nevera con estado inactiva (1)
    const nuevaNevera = await this.databaseService.nEVERAS.create({
      data: {
        contraseña: contraseña,
        id_estado_nevera: 1, // Estado inactiva
        id_tienda: id_tienda,
        version_software: 0
      }
    });

    return {
      message: 'Nevera creada exitosamente',
      nevera: {
        id_nevera: nuevaNevera.id_nevera,
        id_tienda: nuevaNevera.id_tienda,
        id_estado_nevera: nuevaNevera.id_estado_nevera,
        contraseña: nuevaNevera.contraseña
      }
    };
  }

  private generatePassword(length: number): string {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  findAll() {
    return `This action returns all tiendas`;
  }

  async findOne(id: number, id_usuario: number) {
    // Obtener todas las tiendas del usuario
    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: id_usuario },
      include: {
        ciudad: {
          select: {
            nombre_ciudad: true
          }
        },
        neveras: {
          include: {
            estadoNevera: {
              select: {
                id_estado_nevera: true
              }
            },
            reportes_estado: {
              orderBy: {
                hora_reporte: 'desc'
              },
              take: 1,
              select: {
                temperatura_c: true
              }
            },
            stockProductos: {
              include: {
                producto: {
                  select: {
                    id_producto: true,
                    nombre_producto: true,
                    peso_nominal_g: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Formatear la respuesta
    const tiendasFormateadas = tiendas.map(tienda => ({
      id_tienda: tienda.id_tienda,
      nombre_tienda: tienda.nombre_tienda,
      direccion: tienda.direccion,
      ciudad: tienda.ciudad.nombre_ciudad,
      neveras: tienda.neveras.map(nevera => ({
        id_nevera: nevera.id_nevera,
        id_estado_nevera: nevera.estadoNevera.id_estado_nevera,
        temperatura_nevera: nevera.reportes_estado.length > 0
          ? nevera.reportes_estado[0].temperatura_c
          : null,
        productos: nevera.stockProductos.map(stock => ({
          id_producto: stock.producto.id_producto,
          nombre_producto: stock.producto.nombre_producto,
          peso_nominal_g: stock.producto.peso_nominal_g,
          stock_minimo: stock.stock_minimo,
          stock_maximo: stock.stock_maximo,
          venta_semanal: stock.venta_semanal,
          stock_ideal_final: stock.stock_ideal_final,
          stock_en_tiempo_real: stock.stock_en_tiempo_real,
          activo: stock.activo
        }))
      }))
    }));

    return {
      tiendas: tiendasFormateadas
    };
  }

  async update(id: number, updateTiendaDto: UpdateTiendaDto, id_usuario: number) {
    // Verificar que la tienda pertenece al usuario
    const tienda = await this.databaseService.tIENDAS.findFirst({
      where: {
        id_tienda: id,
        id_usuario: id_usuario
      }
    });

    if (!tienda) {
      throw new Error('Tienda no encontrada o no tienes permiso para editarla');
    }

    // Actualizar la tienda
    const tiendaActualizada = await this.databaseService.tIENDAS.update({
      where: { id_tienda: id },
      data: updateTiendaDto,
      include: {
        ciudad: {
          select: {
            nombre_ciudad: true,
            departamento: {
              select: {
                nombre_departamento: true
              }
            }
          }
        }
      }
    });

    return {
      message: 'Tienda actualizada exitosamente',
      tienda: {
        id_tienda: tiendaActualizada.id_tienda,
        nombre_tienda: tiendaActualizada.nombre_tienda,
        direccion: tiendaActualizada.direccion,
        ciudad: tiendaActualizada.ciudad.nombre_ciudad,
        departamento: tiendaActualizada.ciudad.departamento.nombre_departamento
      }
    };
  }

  async remove(id: number, id_usuario: number) {
    // Verificar que la tienda pertenece al usuario
    const tienda = await this.databaseService.tIENDAS.findFirst({
      where: {
        id_tienda: id,
        id_usuario: id_usuario
      },
      include: {
        neveras: {
          select: {
            id_estado_nevera: true
          }
        }
      }
    });

    if (!tienda) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Tienda no encontrada',
          message: 'La tienda no existe o no tienes permisos para eliminarla.',
          code: 'TIENDA_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Verificar que la tienda no tenga neveras activas
    const neverasActivas = tienda.neveras.filter(nevera => nevera.id_estado_nevera === 2).length;

    if (neverasActivas > 0) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Eliminación bloqueada',
          message: `No puedes eliminar esta tienda porque tiene ${neverasActivas} nevera(s) activa(s). Primero elimina todas las neveras activas.`,
          code: 'TIENDA_HAS_NEVERAS_ACTIVAS',
          neverasActivas: neverasActivas
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Si no tiene neveras activas, proceder con la eliminación
    const tiendaEliminada = await this.databaseService.tIENDAS.delete({
      where: { id_tienda: id }
    });

    return {
      message: 'Tienda eliminada exitosamente',
      tienda: {
        id_tienda: tiendaEliminada.id_tienda,
        nombre_tienda: tiendaEliminada.nombre_tienda
      }
    };
  }

  async removeNevera(id_nevera: number) {
    // Obtener la nevera con su estado
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera: id_nevera }
    });

    if (!nevera) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Nevera no encontrada',
          message: 'La nevera no existe.',
          code: 'NEVERA_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Verificar que la nevera no esté activa (estado 2)
    if (nevera.id_estado_nevera === 2) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Eliminación bloqueada',
          message: 'No puedes eliminar una nevera que está activa. Primero desactívala.',
          code: 'NEVERA_ACTIVA_NO_ELIMINABLE',
          estado_actual: nevera.id_estado_nevera
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Verificar si la nevera tiene empaques asociados
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: id_nevera
      }
    });

    if (empaques.length > 0) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Eliminación bloqueada',
          message: 'No se puede eliminar la nevera porque tiene empaques asociados.',
          code: 'NEVERA_HAS_EMPAQUES',
          empaquesCount: empaques.length
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Si no tiene empaques y no está activa, proceder con la eliminación
    const neveraEliminada = await this.databaseService.nEVERAS.delete({
      where: {
        id_nevera: id_nevera
      }
    });

    return {
      message: 'Nevera eliminada exitosamente',
      nevera: {
        id_nevera: neveraEliminada.id_nevera
      }
    };
  }

  async getProductosByNevera(id_nevera: number, id_usuario: number) {
    // Obtener información del usuario actual
    const usuarioActual = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario },
      select: {
        id_usuario: true,
        id_rol: true
      }
    });

    if (!usuarioActual) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Usuario no encontrado',
          message: 'El usuario no existe.',
          code: 'USER_NOT_FOUND'
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verificar que la nevera existe y obtener su información
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: {
        id_nevera: id_nevera
      },
      include: {
        tienda: {
          select: {
            id_tienda: true,
            nombre_tienda: true,
            id_usuario: true
          }
        }
      }
    });

    if (!nevera) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Nevera no encontrada',
          message: `La nevera con ID ${id_nevera} no existe.`,
          code: 'NEVERA_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // VERIFICACIÓN DE PERMISOS según rol
    const tienePermiso = await this.verificarPermisoNevera(
      usuarioActual.id_rol,
      usuarioActual.id_usuario,
      nevera.tienda.id_usuario,
      id_nevera
    );

    if (!tienePermiso) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a esta nevera.',
          code: 'ACCESS_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }

    // Obtener todos los productos
    const todosLosProductos = await this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true
      },
      orderBy: {
        nombre_producto: 'asc'
      }
    });

    // Obtener stock de productos de la nevera específica
    const stockNevera = await this.databaseService.sTOCK_NEVERA.findMany({
      where: {
        id_nevera: id_nevera
      },
      select: {
        id: true,
        id_producto: true,
        stock_minimo: true,
        stock_maximo: true,
        venta_semanal: true,
        stock_ideal_final: true,
        calificacion_sutido: true,
        mensaje_sistema: true,
        stock_en_tiempo_real: true,
        activo: true,
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            descripcion_producto: true,
            peso_nominal_g: true
          }
        }
      },
      orderBy: {
        producto: {
          nombre_producto: 'asc'
        }
      }
    });

    // Crear un mapa de stock por id_producto para facilitar el acceso
    const stockMap = new Map();
    stockNevera.forEach(stock => {
      stockMap.set(stock.id_producto, stock);
    });

    // Combinar productos con su información de stock
    const productosConStock = todosLosProductos.map(producto => {
      const stockInfo = stockMap.get(producto.id_producto);
      
      if (stockInfo) {
        // Si existe stock para este producto en la nevera
        return {
          // Información del producto
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          descripcion_producto: producto.descripcion_producto,
          peso_nominal_g: producto.peso_nominal_g,
          // Información del stock existente
          tiene_stock: stockInfo.stock_en_tiempo_real > 0,
          id_stock: stockInfo.id,
          stock_minimo: stockInfo.stock_minimo,
          stock_maximo: stockInfo.stock_maximo,
          venta_semanal: stockInfo.venta_semanal,
          stock_ideal_final: stockInfo.stock_ideal_final,
          calificacion_sutido: stockInfo.calificacion_sutido,
          mensaje_sistema: stockInfo.mensaje_sistema,
          stock_en_tiempo_real: stockInfo.stock_en_tiempo_real,
          activo: stockInfo.activo
        };
      } else {
        // Si no existe stock para este producto, mostrar valores en cero
        return {
          // Información del producto
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre_producto,
          descripcion_producto: producto.descripcion_producto,
          peso_nominal_g: producto.peso_nominal_g,
          // Información del stock en cero (producto no existente en esta nevera)
          tiene_stock: false,
          id_stock: null,
          stock_minimo: 0,
          stock_maximo: 0,
          venta_semanal: 0,
          stock_ideal_final: 0,
          calificacion_sutido: 'Sin configurar',
          mensaje_sistema: 'Producto no disponible en esta nevera',
          stock_en_tiempo_real: 0,
          activo: true
        };
      }
    });

    // Calcular estadísticas
    const totalProductos = todosLosProductos.length;
    // Contar productos que realmente tienen stock > 0
    const productosConStockInfo = stockNevera.filter(s => s.stock_en_tiempo_real > 0).length;
    const productosSinStock = totalProductos - productosConStockInfo;

    return {
      nevera: {
        id_nevera: nevera.id_nevera,
        id_tienda: nevera.tienda.id_tienda,
        nombre_tienda: nevera.tienda.nombre_tienda
      },
      estadisticas: {
        total_productos: totalProductos,
        productos_con_stock: productosConStockInfo,
        productos_sin_stock: productosSinStock
      },
      productos: productosConStock
    };
  }

  async updateStocksByNevera(id_nevera: number, stockUpdates: any[], id_usuario: number) {
    // Obtener información del usuario actual
    const usuarioActual = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario },
      select: {
        id_usuario: true,
        id_rol: true
      }
    });

    if (!usuarioActual) {
      throw new HttpException(
        {
          status: HttpStatus.UNAUTHORIZED,
          error: 'Usuario no encontrado',
          message: 'El usuario no existe.',
          code: 'USER_NOT_FOUND'
        },
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verificar que la nevera existe y obtener su información
    const nevera = await this.databaseService.nEVERAS.findUnique({
      where: { id_nevera: id_nevera },
      include: {
        tienda: {
          select: {
            id_tienda: true,
            nombre_tienda: true,
            id_usuario: true
          }
        }
      }
    });

    if (!nevera) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          error: 'Nevera no encontrada',
          message: `La nevera con ID ${id_nevera} no existe.`,
          code: 'NEVERA_NOT_FOUND'
        },
        HttpStatus.NOT_FOUND
      );
    }

    // VERIFICACIÓN DE PERMISOS según rol
    const tienePermiso = await this.verificarPermisoNevera(
      usuarioActual.id_rol,
      usuarioActual.id_usuario,
      nevera.tienda.id_usuario,
      id_nevera
    );

    if (!tienePermiso) {
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Acceso denegado',
          message: 'No tienes permisos para modificar esta nevera.',
          code: 'ACCESS_DENIED'
        },
        HttpStatus.FORBIDDEN
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Procesar cada actualización
    for (const update of stockUpdates) {
      try {
        const { id_stock, id_producto, stock_minimo, stock_maximo, activo } = update;

        if (id_stock) {
          // ACTUALIZAR: Registro existente
          // Primero obtener el registro actual para verificar la calificación
          const currentStock = await this.databaseService.sTOCK_NEVERA.findUnique({
            where: { id: id_stock }
          });

          // Preparar los datos de actualización
          const updateData: any = {};
          
          // Solo actualizar campos que fueron enviados
          if (stock_minimo !== undefined) updateData.stock_minimo = stock_minimo;
          if (stock_maximo !== undefined) updateData.stock_maximo = stock_maximo;
          if (activo !== undefined) updateData.activo = activo;

          // Si la calificación actual es "Sin configurar", actualizarla a "BAJA"
          if (currentStock && currentStock.calificacion_sutido === 'Sin configurar') {
            updateData.calificacion_sutido = 'BAJA';
          }

          const updatedStock = await this.databaseService.sTOCK_NEVERA.update({
            where: { id: id_stock },
            data: updateData,
            include: {
              producto: {
                select: {
                  id_producto: true,
                  nombre_producto: true
                }
              }
            }
          });

          results.push({
            accion: 'actualizado',
            id_stock: id_stock,
            id_producto: id_producto,
            nombre_producto: updatedStock.producto.nombre_producto,
            stock_minimo: updatedStock.stock_minimo,
            stock_maximo: updatedStock.stock_maximo,
            activo: updatedStock.activo
          });

        } else {
          // CREAR: Registro nuevo
          // Verificar que no exista ya un registro con este id_producto en la nevera
          const existingStock = await this.databaseService.sTOCK_NEVERA.findFirst({
            where: {
              id_nevera: id_nevera,
              id_producto: id_producto
            }
          });

          if (existingStock) {
            errors.push({
              id_producto: id_producto,
              error: 'Ya existe un registro para este producto en la nevera',
              code: 'PRODUCTO_YA_EXISTE'
            });
            continue;
          }

          const newStock = await this.databaseService.sTOCK_NEVERA.create({
            data: {
              id_nevera: id_nevera,
              id_producto: id_producto,
              stock_minimo: stock_minimo,
              stock_maximo: stock_maximo,
              venta_semanal: 0,
              stock_ideal_final: 0,
              calificacion_sutido: 'BAJA',
              mensaje_sistema: 'producto pendiente de surtir en nevera',
              stock_en_tiempo_real: 0,
              activo: activo !== undefined ? activo : true
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

          results.push({
            accion: 'creado',
            id_stock: newStock.id,
            id_producto: id_producto,
            nombre_producto: newStock.producto.nombre_producto,
            stock_minimo: newStock.stock_minimo,
            stock_maximo: newStock.stock_maximo,
            activo: newStock.activo
          });
        }

      } catch (error) {
        errors.push({
          id_producto: update.id_producto,
          error: error.message,
          code: 'PROCESAMIENTO_ERROR'
        });
      }
    }

    return {
      message: 'Procesamiento completado',
      nevera: {
        id_nevera: nevera.id_nevera,
        id_tienda: nevera.tienda.id_tienda,
        nombre_tienda: nevera.tienda.nombre_tienda
      },
      resultados: {
        exitosos: results,
        errores: errors,
        total_procesados: stockUpdates.length,
        exitosos_count: results.length,
        errores_count: errors.length
      }
    };
  }
}
