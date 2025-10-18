import { Role } from './role.entity';

export class User {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string | null;
  identificacion_usuario: string;
  celular: number;
  email: string;
  contraseña?: string;
  activo: boolean;
  fecha_creacion: Date;
  fecha_ultima_modifi: Date;
  id_rol: number;
  rol?: Role;
}