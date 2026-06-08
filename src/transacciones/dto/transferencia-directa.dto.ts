export interface TransferenciaDirectaParams {
  idUsuarioPagador: number;
  idUsuarioReceptor: number;
  monto: number;
  notaOpcional?: string;
  tipoReceptor?: number;
  tipoPagador?: number;
  montoReceptorNegativo?: boolean;
  notaReceptorOpcional?: string;
  notaPagadorOpcional?: string;
}

export interface TransferenciaDirectaResultado {
  idTransaccionReceptor: number;
  idTransaccionPagador: number;
  monto: number;
}
