export class User {
  id: number;
  username: string;
  password?: string; // La contraseña no siempre se devuelve
  role: string;
}