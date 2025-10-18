import { Frigorifico } from '../../frigorifico/entities/frigorifico.entity';
import { Producto } from './producto.entity';
import { Logistica } from '../../logistica/entities/logistica.entity';
import { Nevera } from '../../neveras/entities/nevera.entity';
import { EstadoLote } from './estado-lote.entity';
import { Promocion } from './promocion.entity';

export class Empaque {
  id_empaque: number;
  EPC_id: string;
  fecha_empaque_1: Date | null;
  id_frigorifico: number;
  id_producto: number;
  peso_exacto: number;
  costo_frigorifico_congelado: number;
  precio_venta_congelado: number;
  fecha_vencimiento: Date | null;
  hora_en_logistica_2: Date | null;
  id_logistica: number;
  fridge_id: number;
  hora_en_nevera_3: Date | null;
  hora_pendiente_pago_4: Date | null;
  hora_para_cambio_5: Date | null;
  fridge_id_final: number | null;
  hora_surtido_final_6: Date | null;
  fecha_finalizacion_7_8: Date | null;
  estado_lote: number;
  promocion: number | null;
  frigorifico?: Frigorifico;
  producto?: Producto;
  logistica?: Logistica;
  nevera?: Nevera;
  estadoLote?: EstadoLote;
  promocionRel?: Promocion;
}