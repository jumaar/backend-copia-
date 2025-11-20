import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TiendasService {
  constructor(private readonly databaseService: DatabaseService) {}

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
            contraseña: true
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
          contraseña: nevera.contraseña
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
          stock_en_tiempo_real: stock.stock_en_tiempo_real
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
}
