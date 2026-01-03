var Config = {
  SHEETS: {
    TURNOS: { name: 'Turnos', headers: ['id', 'rut_funcionario', 'nombre', 'fecha', 'tipo_turno', 'horario', 'estado', 'observacion', 'created_at'] },
    FUNCIONARIOS: { name: 'Funcionarios', headers: ['rut', 'nombre', 'unidad', 'contrato', 'estado'] },
    PARAMETROS: { name: 'Parametros', headers: ['tipo', 'valor', 'activo'] },
    LOGS: { name: 'Logs', headers: ['fecha', 'usuario', 'accion', 'detalle'] },
  },
  ESTADOS_TURNO: ['pendiente', 'activo', 'cerrado', 'cancelado'],
};
