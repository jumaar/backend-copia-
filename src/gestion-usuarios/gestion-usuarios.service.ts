import { ConflictException, Injectable, Logger, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateGestionUsuarioDto } from './dto/update-gestion-usuario.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class GestionUsuariosService {
  private readonly logger = new Logger(GestionUsuariosService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private formatUser(user) {
    if (!user) return null;
    
    // Formatear usuario base
    const formattedUser: any = {
      id: user.id_usuario,
      nombre_completo: `${user.nombre_usuario || ''} ${user.apellido_usuario || ''}`.trim(),
      celular: user.celular,
      rol: user.rol?.nombre_rol,
      activo: user.activo,
    };
    
    // Si es un usuario de logística, incluir sus datos de empresa y vehículo
    if (user.rol?.nombre_rol === 'Logistica') {
      if (user.logisticas && user.logisticas.length > 0) {
        formattedUser.logistica = {
          nombre_empresa: user.logisticas[0].nombre_empresa,
          placa_vehiculo: user.logisticas[0].placa_vehiculo
        };
      } else {
        // Siempre incluir logistica como array vacío cuando no hay datos
        formattedUser.logistica = [];
      }
    }
    
    return formattedUser;
  }

  async findAll(user: { id_usuario: number; roleId: number }) {
    const userRole = user.roleId;
    this.logger.debug(`Iniciando findAll para el usuario ID: ${user.id_usuario} con Rol ID: ${userRole}`);

    // Incluir logisticas para el usuario actual si es rol 4
    const includeRelations = { rol: true };
    if (userRole === 4) {
      includeRelations['logisticas'] = true;
    }

    let currentUser;
    try {
      currentUser = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: user.id_usuario },
        include: includeRelations,
      });
    } catch (error) {
      if (error.code === 'P1001') {
        this.logger.error(`Database connection error: ${error.message}`);
        throw new ServiceUnavailableException('Database server is temporarily unavailable');
      }
      throw error;
    }

    // Vista simple para roles no jerárquicos
    if (userRole === 3 || userRole === 5) { // Frigorifico o Tienda
      return {
        usuario_actual: this.formatUser(currentUser),
        jerarquia: [],
        tokens: [],
      };
    }

    // Vista especial para usuarios de logística (rol 4)
    if (userRole === 4) {
      // Obtener usuarios tienda creados por este usuario logística
      const tiendaUsers = await this.databaseService.tOKEN_REGISTRO.findMany({
        where: {
          id_usuario_creador: user.id_usuario,
          es_usado: true,
          id_usuario_nuevo: { not: null },
          id_rol_nuevo_usuario: 5, // Rol tienda
          nuevo_usuario: { email: { not: { endsWith: '@borrado.com' } } },
        },
        include: {
          nuevo_usuario: {
            include: {
              rol: true,
              tiendas: {
                include: {
                  ciudad: {
                    include: {
                      departamento: true
                    }
                  },
                  neveras: {
                    select: {
                      id_nevera: true,
                      id_estado_nevera: true
                    }
                  }
                }
              }
            }
          }
        },
      });

      // Formatear las tiendas creadas
      const tiendasCreadas = tiendaUsers
        .map(token => token.nuevo_usuario)
        .filter(user => user !== null)
        .map(tiendaUser => ({
          id_usuario: tiendaUser.id_usuario,
          nombre_completo: `${tiendaUser.nombre_usuario || ''} ${tiendaUser.apellido_usuario || ''}`.trim(),
          celular: tiendaUser.celular,
          rol: tiendaUser.rol?.nombre_rol,
          activo: tiendaUser.activo,
          tiendas_creadas: tiendaUser.tiendas.map(tienda => ({
            id_tienda: tienda.id_tienda,
            nombre_tienda: tienda.nombre_tienda,
            direccion: tienda.direccion,
            ciudad: tienda.ciudad.nombre_ciudad,
            departamento: tienda.ciudad.departamento.nombre_departamento,
            neveras: tienda.neveras.map(nevera => ({
              id_nevera: nevera.id_nevera,
              estado: nevera.id_estado_nevera
            }))
          }))
        }));

      // Obtener tokens disponibles
      const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
        where: { id_usuario_creador: user.id_usuario, es_usado: false, expira_en: { gte: new Date() } },
        select: {
          token: true,
          expira_en: true,
          rol_nuevo_usuario: { select: { nombre_rol: true } },
        },
      });

      return {
        usuario_actual: this.formatUser(currentUser),
        tiendas_creadas: tiendasCreadas,
        tokens,
      };
    }

    // Vista jerárquica para Super Admin, Admin
    const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: { id_usuario_creador: user.id_usuario, es_usado: false, expira_en: { gte: new Date() } },
      select: {
        token: true,
        expira_en: true,
        rol_nuevo_usuario: { select: { nombre_rol: true } },
      },
    });

    // Función recursiva para construir el árbol de descendientes
    const getDescendants = async (creatorId: number) => {
      const includeDescRelations = { rol: true };
      if (userRole === 4) {
        includeDescRelations['logisticas'] = true;
      }

      const createdTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
        where: {
          id_usuario_creador: creatorId,
          es_usado: true,
          id_usuario_nuevo: { not: null },
          nuevo_usuario: { email: { not: { endsWith: '@borrado.com' } } },
        },
        include: { nuevo_usuario: { include: includeDescRelations } },
      });

      if (createdTokens.length === 0) {
        return [];
      }

      return Promise.all(
        createdTokens.map(async (token) => {
          const childUser = token.nuevo_usuario;
          if (!childUser) return null;

          const descendants = await getDescendants(childUser.id_usuario);
          return {
            ...this.formatUser(childUser),
            usuarios_creados: descendants,
          };
        }),
      );
    };

    const hierarchy = await getDescendants(user.id_usuario);

    return {
      usuario_actual: this.formatUser(currentUser),
      jerarquia: hierarchy.filter(Boolean),
      tokens,
    };
  }
  
  async findOne(id: number, requester: { id_usuario: number; roleId: number }) {
    const isOwner = requester.id_usuario === id;
    const canViewAll = requester.roleId === 1 || requester.roleId === 2 || requester.roleId === 4; // Super Admin, Admin, Logistica
    const canViewOwn = requester.roleId === 3 || requester.roleId === 5; // Frigorifico, Tienda

    // Validar permisos
    if (!isOwner && !canViewAll) {
      throw new ForbiddenException('No tienes permiso para ver los detalles de este usuario.');
    }

    if (!isOwner && canViewOwn) {
      throw new ForbiddenException('Los usuarios de tipo Frigorífico y Tienda solo pueden ver sus propios datos.');
    }

    // Incluir relaciones según el rol del solicitante
    const includeRelations: any = {
      rol: true,
      // Incluir relaciones para roles administrativos
      ...(canViewAll ? {
        tiendas: true,
        frigorificos: true,
        logisticas: true,
      } : {}),
    };

    // Asegurarnos de incluir logisticas siempre para usuarios con rol 4
    if (requester.roleId === 4) {
      includeRelations.logisticas = true;
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
      include: includeRelations,
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const { contraseña, ...result } = usuario;
    return result;
  }

  async update(id: number, updateGestionUsuarioDto: UpdateGestionUsuarioDto, requester: { id_usuario: number; roleId: number }) {
    const isOwner = requester.id_usuario === id;
    const canModifyAll = requester.roleId === 1 || requester.roleId === 2 || requester.roleId === 4; // Super Admin, Admin, Logistica
    const canModifyOwn = requester.roleId === 3 || requester.roleId === 5; // Frigorifico, Tienda

    // Validar permisos
    if (!isOwner && !canModifyAll) {
      throw new ForbiddenException('No tienes permiso para modificar a este usuario.');
    }

    if (!isOwner && canModifyOwn) {
      throw new ForbiddenException('Los usuarios de tipo Frigorífico y Tienda solo pueden modificar sus propios datos.');
    }


    // Verificar usuario objetivo
    const userToUpdate = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
      include: { rol: true, logisticas: true }
    });

    if (!userToUpdate) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    // Verificar si el usuario que se está actualizando es de rol 4 (Logística)
    const isLogisticaUser = userToUpdate.id_rol === 4;

    // Extraer campos de logística si el usuario es de logística
    let logisticaData: any = {};
    if (isLogisticaUser && (updateGestionUsuarioDto.nombre_empresa || updateGestionUsuarioDto.placa_vehiculo)) {
      if (updateGestionUsuarioDto.nombre_empresa) {
        logisticaData.nombre_empresa = updateGestionUsuarioDto.nombre_empresa;
      }
      if (updateGestionUsuarioDto.placa_vehiculo) {
        logisticaData.placa_vehiculo = updateGestionUsuarioDto.placa_vehiculo;
      }
      
      // Eliminar los campos de logística del DTO para no intentar actualizarlos en la tabla USUARIOS
      const { nombre_empresa, placa_vehiculo, ...usuarioData } = updateGestionUsuarioDto;
      updateGestionUsuarioDto = usuarioData as any;
    }

    const { email, identificacion_usuario, celular } = updateGestionUsuarioDto;
    if (email) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { email, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`El email '${email}' ya está en uso.`);
    }
    if (identificacion_usuario) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { identificacion_usuario, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`La identificación '${identificacion_usuario}' ya está en uso.`);
    }
    if (celular) {
      const existingUser = await this.databaseService.uSUARIOS.findFirst({ where: { celular, NOT: { id_usuario: id } } });
      if (existingUser) throw new ConflictException(`El celular '${celular}' ya está en uso.`);
    }

    // Actualizar los datos del usuario
    const updatedUser = await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: updateGestionUsuarioDto,
    });

    // Manejar datos de logística si existen
    let logisticaResult: any = null;
    if (isLogisticaUser && Object.keys(logisticaData).length > 0) {
      // Verificar si el usuario ya tiene un registro de logística
      if (userToUpdate.logisticas && userToUpdate.logisticas.length > 0) {
        // Actualizar el registro existente
        logisticaResult = await this.databaseService.lOGISTICA.update({
          where: { id_logistica: userToUpdate.logisticas[0].id_logistica },
          data: logisticaData,
        });
      } else {
        // Crear un nuevo registro de logística
        logisticaResult = await this.databaseService.lOGISTICA.create({
          data: {
            id_usuario: id,
            ...logisticaData as any
          },
        });
      }
    }

    // Preparar la respuesta combinando datos del usuario y logística si existe
    const userResult: any = { ...updatedUser, contraseña: undefined };
    
    if (logisticaResult) {
      userResult.logisticas = [logisticaResult];
    } else if (userToUpdate.logisticas && userToUpdate.logisticas.length > 0) {
      userResult.logisticas = userToUpdate.logisticas;
    } else {
      userResult.logisticas = [];
    }

    return userResult;
  }

  async remove(id: number, remover: { id: number; roleId: number }) {
    if (id === remover.id) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }

    // Verificar permisos de eliminación
    if (remover.roleId === 2) {
      const tokenLink = await this.databaseService.tOKEN_REGISTRO.findFirst({
        where: { id_usuario_nuevo: id, id_usuario_creador: remover.id },
      });
      if (!tokenLink) {
        throw new ForbiddenException('No tienes permiso para eliminar a este usuario.');
      }
    } else if (remover.roleId === 4) {
      // Verificar si el usuario a eliminar es de rol 5 (tienda)
      const usuarioAEliminar = await this.databaseService.uSUARIOS.findUnique({
        where: { id_usuario: id },
      });
      
      if (!usuarioAEliminar) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
      }
      
      if (usuarioAEliminar.id_rol !== 5) {
        throw new ForbiddenException('No tienes permiso para eliminar este tipo de usuario.');
      }
      
      // Verificar si el usuario rol 5 tiene tiendas con neveras activas que tienen empaques
      const tiendas = await this.databaseService.tIENDAS.findMany({
        where: { id_usuario: id }
      });
      
      if (tiendas.length > 0) {
        for (const tienda of tiendas) {
          // Buscar neveras activas en la tienda (asumiendo que id_estado_nevera = 2 es activo basado en otros archivos)
          const neverasActivas = await this.databaseService.nEVERAS.findMany({
            where: {
              id_tienda: tienda.id_tienda,
              id_estado_nevera: 2 // Estado activa
            }
          });
          
          for (const nevera of neverasActivas) {
            // Verificar si alguna nevera activa tiene empaques asociados
            const empaques = await this.databaseService.eMPAQUES.findMany({
              where: {
                id_nevera: nevera.id_nevera
              }
            });
            
            if (empaques.length > 0) {
              throw new ForbiddenException('No se puede eliminar el usuario porque tiene tiendas con neveras activas que contienen empaques.');
            }
          }
        }
      }
    } else if (remover.roleId !== 1 && remover.roleId !== 2) {
      // Solo Super Admin (1), Admin (2) y Logística (4) pueden eliminar usuarios
      throw new ForbiddenException('No tienes permiso para eliminar usuarios.');
    }

    const childrenTokens = await this.databaseService.tOKEN_REGISTRO.findMany({
      where: { id_usuario_creador: id, es_usado: true },
      select: { id_usuario_nuevo: true },
    });
    const childrenIds = childrenTokens.map(t => t.id_usuario_nuevo).filter((id): id is number => id !== null);

    if (childrenIds.length > 0) {
      const activeChildrenCount = await this.databaseService.uSUARIOS.count({
        where: { id_usuario: { in: childrenIds }, activo: true },
      });
      if (activeChildrenCount > 0) {
        throw new ForbiddenException('Este usuario no puede ser eliminado porque tiene otros usuarios activos a su cargo.');
      }
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const timestamp = Date.now();
    const deletedEmail = `borrado_${timestamp}_${id}@borrado.com`;
    const hashedPassword = await bcrypt.hash(timestamp.toString(), 10);
  
    // Actualizar el usuario para desactivarlo y cambiar sus datos sensibles
   await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: {
        activo: false,
        email: deletedEmail,
        contraseña: hashedPassword,
        identificacion_usuario: null,
        celular: null,
      },
    });
  
    // Eliminar todos los refresh tokens asociados al usuario para invalidar todas sus sesiones
    await this.databaseService.rEFRESH_TOKENS.deleteMany({
      where: { id_usuario: id }
    });
  
    return { message: `Usuario con ID ${id} ha sido borrado lógicamente.` };
  }

  async toggleStatus(id: number, requesterId: number) {
    if (id === requesterId) {
      throw new ForbiddenException('No puedes cambiar tu propio estado de activación.');
    }

    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const newStatus = !usuario.activo;

    const updatedUser = await this.databaseService.uSUARIOS.update({
      where: { id_usuario: id },
      data: { activo: newStatus },
    });

    // Si el usuario se está desactivando, eliminar todos sus tokens de refresco
    if (!newStatus) {
      await this.databaseService.rEFRESH_TOKENS.deleteMany({
        where: { id_usuario: id }
      });
    }

    const { contraseña, ...result } = updatedUser;
    return result;
  }
}
