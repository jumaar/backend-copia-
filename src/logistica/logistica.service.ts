import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';
import { CuentasDto } from './dto/cuentas.dto';

@Injectable()
export class LogisticaService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createLogisticaDto: CreateLogisticaDto) {
    return 'This action adds a new logistica';
  }

  findAll() {
    return `This action returns all logistica`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logistica`;
  }

  async getProductosPorLogistica(id_usuario: number) {
    // Obtener el id_logistica del usuario autenticado
    const usuarioLogistica = await this.databaseService.lOGISTICA.findFirst({
      where: { id_usuario: id_usuario },
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
          empaques: []
        };
      }

      acc[productoId].empaques.push({
        peso_exacto_g: empaque.peso_exacto_g,
        EPC_id: empaque.EPC_id
      });

      return acc;
    }, {});

    // Convertir objeto a array para la respuesta
    const resultado = Object.values(productosAgrupados);

    return {
      productos_por_logistica: resultado,
      total_productos_diferentes: resultado.length,
      total_empaques: empaques.length,
      id_logistica_usuario: usuarioLogistica.id_logistica
    };
  }

  async getCuentasTransacciones(cuentasDto: CuentasDto) {
    const { mes: mesParam, año: añoParam, id_usuario } = cuentasDto;
    
    // Si no se proporcionan mes/año, usar el último mes en vigencia (mes actual)
    const ahora = new Date();
    const mes = mesParam || (ahora.getMonth() + 1); // getMonth() devuelve 0-11, sumamos 1
    const año = añoParam || ahora.getFullYear();
    
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

    // Obtener todas las transacciones del usuario en el mes especificado
    const transacciones = await this.databaseService.tRANSACCIONES.findMany({
      where: {
        id_usuario: id_usuario,
        hora_transaccion: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      include: {
        estadoTransaccion: {
          select: {
            id_estado_transaccion: true,
            nombre_estado: true
          }
        },
        tipoTransaccion: {
          select: {
            id_tipo: true,
            nombre_codigo: true,
            descripcion_amigable: true
          }
        },
        empaque: {
          select: {
            id_empaque: true,
            EPC_id: true
          }
        },
        transaccionRel: {
          select: {
            id_transaccion: true
          }
        }
      },
      orderBy: {
        hora_transaccion: 'desc'
      }
    });

    // Formatear las transacciones para la respuesta (solo campos esenciales)
    const transaccionesFormateadas = transacciones.map(transaccion => ({
      id_transaccion: transaccion.id_transaccion,
      id_empaque: transaccion.id_empaque, // null para tickets consolidados
      id_transaccion_rel: transaccion.id_transaccion_rel, // null = normal, number = consolidada
      monto: parseFloat(transaccion.monto.toString()),
      hora_transaccion: transaccion.hora_transaccion,
      nombre_tipo_transaccion: transaccion.tipoTransaccion.nombre_codigo,
      nombre_estado_transaccion: transaccion.estadoTransaccion.nombre_estado,
      nota_opcional: transaccion.nota_opcional
    }));

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
        es_periodo_actual: !mesParam && !añoParam
      }
    };
  }

  update(id: number, updateLogisticaDto: UpdateLogisticaDto) {
    return `This action updates a #${id} logistica`;
  }

  remove(id: number) {
    return `This action removes a #${id} logistica`;
  }
}
