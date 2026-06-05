export interface ConsolidarParams {
  idsPendientes: number[];

  montoPagado: number;

  idUsuarioTicket: number;

  idUsuarioPagador?: number;

  idUsuarioReceptor?: number;

  mutualLink?: boolean;

  montoConsolidadoOverride?: number;

  notaOpcional?: string;

  idNevera?: number;
}

export interface ConsolidarResultado {
  idTicket: number;
  montoConsolidado: number;
  montoPagado: number;
  pendientesProcesadas: number;
  idPagoPagador?: number;
  idPagoReceptor?: number;
  saldo?: {
    idTransaccion: number;
    monto: number;
    esSaldoAFavor: boolean;
  };
}
