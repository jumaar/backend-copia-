import { Empaque } from '../../productos/entities/empaque.entity';
import { User } from '../../auth/entities/user.entity';
import { EstadoTransaccion } from './estado-transaccion.entity';
import { TipoTransaccion } from './tipo-transaccion.entity';

export class Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_usuario: number;
  id_transaccion_rel: number | null;
  id_nevera: number | null;
  monto: number;
  hora_transaccion: Date | null;
  nota_opcional: string | null;
  estado_transaccion: number;
  id_tipo_transaccion: number;
  empaque?: Empaque;
  usuario?: User;
  transaccionRel?: Transaccion;
  estadoTransaccion?: EstadoTransaccion;
  tipoTransaccion?: TipoTransaccion;
}
