import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';

@Injectable()
export class FrigorificoService {
  constructor(private readonly databaseService: DatabaseService) {}

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
          peso_nominal_g: producto?.peso_nominal_g || 0,
          cantidad: item._count.id_empaque,
          ultima_fecha: item._max.fecha_empaque_1,
          epc_id_ultimo: ultimoEmpaque?.EPC_id || '',
        };
      })
    );

    return {
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
      throw new Error('Frigorífico no encontrado o no autorizado');
    }

    return this.databaseService.fRIGORIFICO.delete({
      where: { id_frigorifico: idFrigorifico },
    });
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

    // Generar clave de vinculación única
    const claveVinculacion = await this.generarClaveVinculacion(idFrigorifico);

    return this.databaseService.eSTACIONES.create({
      data: {
        id_frigorifico: idFrigorifico,
        clave_vinculacion: claveVinculacion,
      },
      select: {
        id_estacion: true,
        clave_vinculacion: true,
      },
    });
  }

  async deleteEstacion(idEstacion: number, idUsuario: number) {
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
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
  }
}
