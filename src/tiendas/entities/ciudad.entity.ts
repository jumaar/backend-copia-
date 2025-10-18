import { Departamento } from './departamento.entity';

export class Ciudad {
  id_ciudad: number;
  nombre_ciudad: string | null;
  id__departamento: number;
  departamento?: Departamento;
}