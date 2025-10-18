import { User } from '../../auth/entities/user.entity';

export class Frigorifico {
  id_frigorifico: number;
  id_usuario: number;
  nombre_frigorifico: string;
  direccion: string;
  usuario?: User;
}
