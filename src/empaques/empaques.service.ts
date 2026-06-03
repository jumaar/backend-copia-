import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const USUARIO_SELECT = {
  id_usuario: true,
  nombre_usuario: true,
  apellido_usuario: true,
  email: true,
} as const;

const CIUDAD_CON_DEPARTAMENTO = {
  id_ciudad: true,
  nombre_ciudad: true,
  departamento: {
    select: {
      id__departamento: true,
      nombre_departamento: true,
    },
  },
} as const;

const NEVERA_CON_TIENDA = {
  id_nevera: true,
  version_software: true,
  fecha_activacion: true,
  ultima_conexion: true,
  hora_ultimo_surtido: true,
  estadoNevera: {
    select: {
      id_estado_nevera: true,
      estado_nevera: true,
    },
  },
  tienda: {
    select: {
      id_tienda: true,
      nombre_tienda: true,
      direccion: true,
      ciudad: { select: CIUDAD_CON_DEPARTAMENTO },
      usuario: { select: USUARIO_SELECT },
    },
  },
} as const;

@Injectable()
export class EmpaquesService {
  private readonly logger = new Logger(EmpaquesService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async findById(id: number) {
    return this.buildRadiografia({ id_empaque: id });
  }

  async findByEpc(epc: string) {
    return this.buildRadiografia({ EPC_id: epc });
  }

  private async buildRadiografia(where: { id_empaque?: number; EPC_id?: string }) {
    const empaque = await this.databaseService.eMPAQUES.findFirst({
      where,
      include: {
        estadoEmpaque: {
          select: { id_estado_empaque: true, nombre_estado: true },
        },
        producto: {
          select: {
            id_producto: true,
            nombre_producto: true,
            descripcion_producto: true,
            peso_nominal_g: true,
            precio_venta: true,
            dias_vencimiento: true,
            precio_frigorifico: true,
          },
        },
        estacion: {
          select: {
            id_estacion: true,
            fecha_creacion: true,
            fecha_activacion: true,
            frigorifico: {
              select: {
                id_frigorifico: true,
                nombre_frigorifico: true,
                direccion: true,
                ciudad: { select: CIUDAD_CON_DEPARTAMENTO },
                usuario: { select: USUARIO_SELECT },
              },
            },
          },
        },
        logistica: {
          select: {
            id_logistica: true,
            nombre_empresa: true,
            placa_vehiculo: true,
            usuario: { select: USUARIO_SELECT },
          },
        },
        nevera: { select: NEVERA_CON_TIENDA },
        promocion: {
          select: {
            id_promocion: true,
            nombre: true,
            tipo: true,
            valor: true,
          },
        },
        transacciones: {
          select: {
            id_transaccion: true,
            monto: true,
            hora_transaccion: true,
            nota_opcional: true,
            tipoTransaccion: {
              select: {
                id_tipo: true,
                nombre_codigo: true,
                descripcion_amigable: true,
              },
            },
            estadoTransaccion: {
              select: {
                id_estado_transaccion: true,
                nombre_estado: true,
              },
            },
            usuario: { select: USUARIO_SELECT },
            nevera: { select: { id_nevera: true } },
          },
          orderBy: { hora_transaccion: 'desc' },
        },
      },
    });

    if (!empaque) {
      throw new HttpException(
        {
          success: false,
          error: 'Empaque no encontrado',
          code: 'EMPAQUE_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    let neveraAnterior: any = null;
    if (empaque.id_nevera_anterior) {
      neveraAnterior = await this.databaseService.nEVERAS.findUnique({
        where: { id_nevera: empaque.id_nevera_anterior },
        select: NEVERA_CON_TIENDA,
      });
    }

    return {
      empaque: {
        id_empaque: empaque.id_empaque,
        EPC_id: empaque.EPC_id,
        peso_exacto_g: empaque.peso_exacto_g,
        precio_venta_total: empaque.precio_venta_total,
        costo_frigorifico: empaque.costo_frigorifico,
        costo_tienda: empaque.costo_tienda,
        fecha_vencimiento: empaque.fecha_vencimiento,
        estado_actual: empaque.estadoEmpaque,
        linea_de_tiempo: {
          creacion: empaque.fecha_empaque_1,
          envio_logistica: empaque.hora_en_logistica_2,
          llegada_nevera: empaque.hora_en_nevera_3,
          pendiente_pago: empaque.hora_pendiente_pago_4,
          marcado_para_cambio: empaque.hora_para_cambio_5,
          surtido_final: empaque.hora_surtido_final_6,
          finalizacion: empaque.fecha_finalizacion_7_8,
        },
        producto: empaque.producto,
        origen: {
          estacion: {
            id_estacion: empaque.estacion.id_estacion,
            fecha_creacion: empaque.estacion.fecha_creacion,
            fecha_activacion: empaque.estacion.fecha_activacion,
          },
          frigorifico: empaque.estacion.frigorifico,
        },
        logistica: empaque.logistica,
        nevera_actual: empaque.nevera,
        nevera_anterior: neveraAnterior,
        promocion: empaque.promocion,
        transacciones: empaque.transacciones,
      },
    };
  }
}
