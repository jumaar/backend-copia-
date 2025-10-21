import { Prisma } from '@prisma/client';

export class Promocion {
  id_promocion: number;
  nombre: string | null;
  tipo: string | null;
  valor: number;
  condiciones: Prisma.JsonValue;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  activo: boolean;
}