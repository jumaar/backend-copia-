import { Tienda } from '../../tiendas/entities/tienda.entity';

export class Nevera {
  id_nevera: number;
  id_tienda: number;
  marca: string | null;
  version_software: number;
  ultima_conexion: Date | null;
  tienda?: Tienda;
}
