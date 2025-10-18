import { Empaque } from '../../productos/entities/empaque.entity';
import { User } from '../../auth/entities/user.entity';
import { EstadoTransaccion } from './estado-transaccion.entity';
import { TipoTransaccion } from './tipo-transaccion.entity';
import { Promocion } from '../../productos/entities/promocion.entity';

export class Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_usuario: number;
  id_transaccion_rel: number | null;
  monto: number;
  hora_transaccion: Date | null;
  descripcion: string | null;
  estado_transaccion: number;
  id_tipo_transaccion: number;
  promocion_id: number | null;
  empaque?: Empaque;
  usuario?: User;
  transaccionRel?: Transaccion;
  estadoTransaccion?: EstadoTransaccion;
  tipoTransaccion?: TipoTransaccion;
  promocion?: Promocion;
}