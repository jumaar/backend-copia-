import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';
import { CuentasDto } from './dto/cuentas.dto';
import { ConsolidacionCuentasDto } from './dto/consolidacion-cuentas.dto';

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
    return `This action returns a #${id}`;
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
        peso_exacto_g: empaque.peso_exacto_g,
        EPC_id: empaque.EPC_id
      });

      return acc;
    }, {});

    // Convertir objeto a array para la respuesta
    const resultado = Object.values(productosAgrupados);

    // Obtener la última hora de calificación de surtido
    const productosIds = Object.keys(productosAgrupados).map(id => parseInt(id));
    let ultimaHoraCalificacion: string | null = null;

    if (productosIds.length > 0) {
      const ultimaCalificacion = await this.databaseService.sTOCK_NEVERA.findFirst({
        where: {
          id_producto: { in: productosIds },
          hora_calificacion: { not: null }
        },
        select: { hora_calificacion: true },
        orderBy: { hora_calificacion: 'desc' }
      });

      if (ultimaCalificacion && ultimaCalificacion.hora_calificacion) {
        ultimaHoraCalificacion = ultimaCalificacion.hora_calificacion.toISOString();
      }
    }

    return {
      productos_por_logistica: resultado,
      total_productos_diferentes: resultado.length,
      total_empaques: empaques.length,
      id_logistica_usuario: usuarioLogistica.id_logistica,
      ultima_hora_calificacion: ultimaHoraCalificacion
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
            id_transaccion: true,
            nota_opcional: true,
            usuario: {
              select: {
                id_usuario: true,
                nombre_usuario: true,
                apellido_usuario: true
              }
            }
          }
        }
      },
      orderBy: {
        hora_transaccion: 'desc'
      }
    });

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
        es_periodo_actual: !mesParam && !añoParam
      }
    };
  }
  async getNeverasActivas(id_usuario: number) {
    // Obtener el rol del usuario
    const usuario = await this.databaseService.uSUARIOS.findUnique({
      where: { id_usuario: id_usuario },
      select: { id_rol: true }
    });

    if (!usuario) {
      return {
        error: 'Usuario no encontrado',
        neveras_activas: []
      };
    }

    // Función recursiva para obtener todos los descendientes
    const obtenerDescendientes = async (id_creador: number): Promise<number[]> => {
      const tokens = await this.databaseService.tOKEN_REGISTRO.findMany({
        where: { id_usuario_creador: id_creador },
        select: { id_usuario_nuevo: true }
      });

      const descendientesDirectos = tokens
        .filter(token => token.id_usuario_nuevo !== null)
        .map(token => token.id_usuario_nuevo!);

      let todosDescendientes = [...descendientesDirectos];

      for (const descendiente of descendientesDirectos) {
        const subDescendientes = await obtenerDescendientes(descendiente);
        todosDescendientes.push(...subDescendientes);
      }

      return todosDescendientes;
    };

    let usuariosPermitidos: number[] = [id_usuario]; // Incluir al propio usuario

    if (usuario.id_rol === 2) {
      // Rol 2: obtener todos sus descendientes
      const descendientes = await obtenerDescendientes(id_usuario);
      usuariosPermitidos.push(...descendientes);
    } else if (usuario.id_rol === 4) {
      // Rol 4: obtener todos sus descendientes (si tiene)
      const descendientes = await obtenerDescendientes(id_usuario);
      usuariosPermitidos.push(...descendientes);
    } else {
      // Otros roles no tienen acceso
      return {
        error: 'Rol no autorizado para esta operación',
        neveras_activas: []
      };
    }

    // Obtener tiendas de los usuarios permitidos
    const tiendas = await this.databaseService.tIENDAS.findMany({
      where: { id_usuario: { in: usuariosPermitidos } },
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
    const neverasFormateadas = neveras.map(nevera => ({
      id_nevera: nevera.id_nevera,
      nombre_tienda: nevera.tienda.nombre_tienda,
      direccion: nevera.tienda.direccion,
      ciudad: nevera.tienda.ciudad.nombre_ciudad,
      id_ciudad: nevera.tienda.ciudad.id_ciudad
    }));

    return {
      neveras_activas: neverasFormateadas,
      total_neveras: neverasFormateadas.length
    };
  }




  async consolidarCuentas(
    id_usuario_consolidar: number,
    id_usuario_credenciales: number,
    consolidacionDto: ConsolidacionCuentasDto
  ) {
    const { monto, nota_opcional } = consolidacionDto;

    // Validar que el usuario a consolidar tenga rol 3
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

    // Obtener transacciones pendientes: empaques reales + saldos de consolidación anterior
    const transaccionesPendientes = await this.databaseService.tRANSACCIONES.findMany({
      where: {
        id_usuario: id_usuario_consolidar,
        estado_transaccion: 1 // estado pendiente
      },
      select: {
        id_transaccion: true,
        monto: true,
        id_empaque: true,
        nota_opcional: true
      }
    });
    const idsTransaccionesPendientes = transaccionesPendientes.map(
      (transaccion) => transaccion.id_transaccion
    );

    // Separar empaques reales de saldos de consolidación anterior
    const empaquesReales = transaccionesPendientes.filter(t => 
      t.id_empaque !== null || 
      (t.id_empaque === null && !t.nota_opcional?.includes('Saldo pendiente consolidación'))
    );

    const saldosAnteriores = transaccionesPendientes.filter(t => 
      t.id_empaque === null && 
      t.nota_opcional?.includes('Saldo pendiente consolidación')
    );

    if (transaccionesPendientes.length === 0) {
      throw new BadRequestException('No hay transacciones pendientes para consolidar');
    }

    // Calcular suma total de transacciones pendientes y redondear a entero
    const montoConsolidadoRaw = transaccionesPendientes.reduce(
      (sum, transaccion) => sum + parseFloat(transaccion.monto.toString()),
      0
    );
    
    // Redondear a entero usando Math.round (0.5 redondea hacia arriba, <0.5 hacia abajo)
    const montoConsolidado = Math.round(montoConsolidadoRaw);

    // Validar que el monto solicitado tenga relación con el consolidado
    // Ahora permitimos abonos mayores para manejar casos donde el frigorífico nos debe

    // Analizar tipo de abono
    const esAbonoCompleto = monto === montoConsolidado;
    const esAbonoParcial = monto < montoConsolidado;
    const esAbonoMayor = monto > montoConsolidado;

    let saldoPendiente = 0;

    if (esAbonoParcial) {
      // Usuario paga menos: debe saldo positivo
      saldoPendiente = montoConsolidado - monto; // Positivo: el usuario nos debe
    } else if (esAbonoMayor) {
      // Usuario paga más: tiene saldo a favor (negativo)
      saldoPendiente = montoConsolidado - monto; // Negativo: nosotros le debemos
    }

    // Crear IDs de empaques reales para la nota
    const idsEmpaques = empaquesReales
      .filter(t => t.id_empaque !== null)
      .map(t => t.id_empaque)
      .join(',');

    try {
      // Iniciar transacción de base de datos
      await this.databaseService.$transaction(async (prisma) => {
        // PASO 1: Crear transacción del acreedor (pago recibido)
        const notaConMonto = nota_opcional
          ? `${nota_opcional} - Monto abonado: ${monto}`
          : `Monto abonado: ${monto}`;

        const transaccionAcreedor = await prisma.tRANSACCIONES.create({
          data: {
            id_empaque: null,
            id_usuario: id_usuario_credenciales,
            id_transaccion_rel: null, // NULO en la transacción del pago
            monto: -monto, // NEGATIVO (pago realizado)
            hora_transaccion: new Date(),
            id_tipo_transaccion: 5, // dinero entregado a acreedor
            nota_opcional: notaConMonto,
            estado_transaccion: 2 // pagado
          }
        });

        // PASO 2: Crear transacción consolidada (todo lo que debe el usuario)
        const transaccionConsolidada = await prisma.tRANSACCIONES.create({
          data: {
            id_empaque: null,
            id_usuario: id_usuario_consolidar,
            id_transaccion_rel: transaccionAcreedor.id_transaccion, // PUNTA A LA TRANSACCIÓN DEL PAGO
            monto: -montoConsolidado, // NEGATIVO (todo lo que debe)
            hora_transaccion: new Date(),
            id_tipo_transaccion: 3, // ticket_consolidado
            nota_opcional: idsEmpaques || null,
            estado_transaccion: 4 // consolidado
          }
        });

        // PASO 3: Actualizar todas las transacciones pendientes incluidas en la consolidación
        await prisma.tRANSACCIONES.updateMany({
          where: {
            id_usuario: id_usuario_consolidar,
            estado_transaccion: 1, // pendiente
            id_transaccion: { in: idsTransaccionesPendientes }
          },
          data: {
            estado_transaccion: 2, // pagado
            id_transaccion_rel: transaccionConsolidada.id_transaccion
          }
        });

        // PASO 4: Crear transacción pendiente para saldo (abonos parciales y mayores)
        if (esAbonoParcial || esAbonoMayor) {
          // Para abonos parciales: el usuario debe saldo (positivo)
          // Para abonos mayores: el usuario tiene saldo a favor (negativo)
          const saldoNegativo = esAbonoMayor; // true si nosotros debemos al usuario

          await prisma.tRANSACCIONES.create({
            data: {
              id_empaque: null,
              id_usuario: id_usuario_consolidar, // Siempre va al usuario consolidado
              id_transaccion_rel: transaccionConsolidada.id_transaccion, // Referencia al consolidado
              monto: saldoPendiente, // Positivo para deuda, negativo para saldo a favor
              hora_transaccion: new Date(),
              id_tipo_transaccion: 2, // costo_frigorifico (como los empaques)
              nota_opcional: `Saldo ${saldoNegativo ?  'adelantado pendiente':'a favor del usuario'} consolidación ${transaccionConsolidada.id_transaccion}`,
              estado_transaccion: 1 // pendiente
            }
          });
        }
      });

      return {
        message: 'Consolidación realizada exitosamente',
        resumen: {
          usuario_consolidado: id_usuario_consolidar,
          usuario_acreedor: id_usuario_credenciales,
          monto_consolidado: montoConsolidado,
          monto_abonado: monto,
        }
      };

    } catch (error) {
      throw new BadRequestException(`Error al consolidar cuentas: ${error.message}`);
    }
  }
}
