export interface CrearTransaccionParams {
  id_empaque?: number | null;
  id_usuario: number;
  id_admin?: number;
  id_transaccion_rel?: number | null;
  id_nevera?: number | null;
  monto: number;
  id_tipo_transaccion: number;
  nota_opcional?: string | null;
  estado_transaccion: number;
}
