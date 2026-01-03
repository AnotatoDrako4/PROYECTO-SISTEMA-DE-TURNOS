var Services = (function () {
  /**
   * Crea un turno validando datos y registrando log.
   * @param {Object} data
   * @return {Object}
   */
  function crearTurno(data) {
    Core.ensureDataModel();
    Validators.validarTurno(data);
    var turno = Core.prepararTurno(data);
    Core.validarConflictoTurno(turno);
    Repository.insertarTurno(turno);
    registrarLog('CREAR_TURNO', 'Turno ' + turno.id + ' creado para ' + turno.rut_funcionario);
    return turno;
  }

  /**
   * Lista turnos disponibles.
   * @return {Object[]}
   */
  function listarTurnos() {
    Core.ensureDataModel();
    return Repository.listarTurnos();
  }

  /**
   * Lista funcionarios registrados.
   * @return {Object[]}
   */
  function listarFuncionarios() {
    Core.ensureDataModel();
    return Repository.listarFuncionarios();
  }

  /**
   * Registra un log.
   * @param {string} accion
   * @param {string} detalle
   */
  function registrarLog(accion, detalle) {
    var log = {
      fecha: Utils.nowIso(),
      usuario: Session.getActiveUser().getEmail() || 'anonimo',
      accion: accion,
      detalle: detalle,
    };
    Repository.insertarLog(log);
  }

  /**
   * Obtiene parámetros del sistema.
   * @return {Object[]}
   */
  function obtenerParametros() {
    Core.ensureDataModel();
    return Repository.listarParametros();
  }

  /**
   * Obtiene logs del sistema.
   * @return {Object[]}
   */
  function obtenerLogs() {
    Core.ensureDataModel();
    return Repository.listarLogs();
  }

  /**
   * Inserta o actualiza un funcionario.
   * @param {Object} funcionario
   */
  function guardarFuncionario(funcionario) {
    Validators.validarFuncionario(funcionario);
    Repository.upsertFuncionario(funcionario);
    registrarLog('GUARDAR_FUNCIONARIO', 'Funcionario ' + funcionario.rut);
    return funcionario;
  }

  return {
    crearTurno: crearTurno,
    listarTurnos: listarTurnos,
    listarFuncionarios: listarFuncionarios,
    registrarLog: registrarLog,
    obtenerParametros: obtenerParametros,
    obtenerLogs: obtenerLogs,
    guardarFuncionario: guardarFuncionario,
  };
})();

/**
 * Wrappers globales para uso desde frontend via google.script.run.
 */
function crearTurno(data) {
  return Services.crearTurno(data);
}

function listarTurnos() {
  return Services.listarTurnos();
}

function listarFuncionarios() {
  return Services.listarFuncionarios();
}

function registrarLog(accion, detalle) {
  return Services.registrarLog(accion, detalle);
}

function obtenerParametros() {
  return Services.obtenerParametros();
}

function obtenerLogs() {
  return Services.obtenerLogs();
}

function guardarFuncionario(funcionario) {
  return Services.guardarFuncionario(funcionario);
}
