var Validators = (function () {
  /**
   * Valida datos básicos de turno.
   * @param {Object} data
   */
  function validarTurno(data) {
    if (!data) throw new Error('Datos de turno requeridos.');
    var obligatorios = ['rut_funcionario', 'nombre', 'fecha', 'tipo_turno', 'horario', 'estado'];
    obligatorios.forEach(function (campo) {
      if (!data[campo]) {
        throw new Error('Campo obligatorio faltante: ' + campo);
      }
    });
    if (!Utils.esFechaValida(data.fecha)) {
      throw new Error('Fecha no válida.');
    }
    if (Config.ESTADOS_TURNO.indexOf(data.estado) === -1) {
      throw new Error('Estado no permitido.');
    }
    if (!Utils.validarRut(data.rut_funcionario)) {
      throw new Error('RUT del funcionario no válido.');
    }
  }

  /**
   * Valida datos de funcionario.
   * @param {Object} data
   */
  function validarFuncionario(data) {
    if (!data) throw new Error('Datos de funcionario requeridos.');
    var obligatorios = ['rut', 'nombre', 'unidad', 'contrato', 'estado'];
    obligatorios.forEach(function (campo) {
      if (!data[campo]) {
        throw new Error('Campo obligatorio faltante: ' + campo);
      }
    });
    if (!Utils.validarRut(data.rut)) {
      throw new Error('RUT no válido.');
    }
  }

  return {
    validarTurno: validarTurno,
    validarFuncionario: validarFuncionario,
  };
})();
