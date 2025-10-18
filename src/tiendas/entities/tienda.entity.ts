import { User } from '../../auth/entities/user.entity';
import { Ciudad } from './ciudad.entity';

export class Tienda {
  id_tienda: number;
  id_usuario: number;
  nombre_tienda: string;
  direccion: string;
  id_ciudad: number;
  usuario?: User;
  ciudad?: Ciudad;
}
