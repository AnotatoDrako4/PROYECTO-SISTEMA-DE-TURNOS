var Core = (function () {
  /**
   * Crea las hojas requeridas si no existen y asegura encabezados.
   */
  function ensureDataModel() {
    Object.keys(Config.SHEETS).forEach(function (key) {
      var sheetConfig = Config.SHEETS[key];
      Repository.ensureSheet(sheetConfig.name, sheetConfig.headers);
    });
  }

  /**
   * Genera un identificador único usando timestamp.
   * @return {string}
   */
  function generateId() {
    return Utilities.getUuid();
  }

  /**
   * Prepara un registro de turno listo para ser insertado.
   * @param {Object} data
   * @return {Object}
   */
  function prepararTurno(data) {
    return {
      id: data.id || generateId(),
      rut_funcionario: data.rut_funcionario,
      nombre: data.nombre,
      fecha: data.fecha,
      tipo_turno: data.tipo_turno,
      horario: data.horario,
      estado: data.estado,
      observacion: data.observacion || '',
      created_at: Utils.nowIso(),
    };
  }

  /**
   * Busca conflictos de turnos por funcionario y fecha/horario.
   * @param {Object} turno
   * @throws {Error}
   */
  function validarConflictoTurno(turno) {
    var turnos = Repository.listarTurnos();
    var conflicto = turnos.some(function (t) {
      return (
        t.rut_funcionario === turno.rut_funcionario &&
        t.fecha === turno.fecha &&
        t.horario === turno.horario &&
        t.estado !== 'cancelado'
      );
    });
    if (conflicto) {
      throw new Error('Conflicto: el funcionario ya tiene un turno en esa fecha y horario.');
    }
  }

  return {
    ensureDataModel: ensureDataModel,
    generateId: generateId,
    prepararTurno: prepararTurno,
    validarConflictoTurno: validarConflictoTurno,
  };
})();
