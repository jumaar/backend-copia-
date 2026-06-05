export interface TransferenciaDirectaParams {
  idUsuarioPagador: number;
  idUsuarioReceptor: number;
  monto: number;
  notaOpcional?: string;
}

export interface TransferenciaDirectaResultado {
  idTransaccionReceptor: number;
  idTransaccionPagador: number;
  monto: number;
}
