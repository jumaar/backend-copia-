import { Nevera } from './nevera.entity';

export class TemperaturaNevera {
  id_estatus_code: number;
  id_nevera: number;
  temperatura: number;
  fecha_lectura: Date;
  nevera?: Nevera;
}