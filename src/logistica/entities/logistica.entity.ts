import { User } from '../../auth/entities/user.entity';

export class Logistica {
  id_logistica: number;
  id_usuario: number;
  nombre_empresa: string;
  placa_vehiculo: string;
  usuario?: User;
}
