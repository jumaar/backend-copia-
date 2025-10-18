import { User } from '../../auth/entities/user.entity';

export class Proveedor {
  id_proveedor: number;
  id_usuario: number;
  nombre_proveedor: string;
  nit: string;
  usuario?: User;
}