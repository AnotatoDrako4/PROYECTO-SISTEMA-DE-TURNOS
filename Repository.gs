var Repository = (function () {
  /**
   * Obtiene una hoja por nombre.
   * @param {string} name
   * @return {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getSheet(name) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    return sheet;
  }

  /**
   * Asegura que la hoja exista y tenga encabezados.
   * @param {string} name
   * @param {string[]} headers
   */
  function ensureSheet(name, headers) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    } else {
      var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      var headersMissing = headers.some(function (h, idx) { return existingHeaders[idx] !== h; });
      if (headersMissing) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
      }
    }
  }

  /**
   * Inserta un turno.
   * @param {Object} turno
   */
  function insertarTurno(turno) {
    var sheet = getSheet(Config.SHEETS.TURNOS.name);
    sheet.appendRow([
      turno.id,
      turno.rut_funcionario,
      turno.nombre,
      turno.fecha,
      turno.tipo_turno,
      turno.horario,
      turno.estado,
      turno.observacion,
      turno.created_at,
    ]);
  }

  /**
   * Lista turnos como objetos.
   * @return {Object[]}
   */
  function listarTurnos() {
    var sheet = getSheet(Config.SHEETS.TURNOS.name);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(function (row) {
      return {
        id: row[0],
        rut_funcionario: row[1],
        nombre: row[2],
        fecha: row[3],
        tipo_turno: row[4],
        horario: row[5],
        estado: row[6],
        observacion: row[7],
        created_at: row[8],
      };
    });
  }

  /**
   * Inserta o actualiza un funcionario.
   * @param {Object} funcionario
   */
  function upsertFuncionario(funcionario) {
    var sheet = getSheet(Config.SHEETS.FUNCIONARIOS.name);
    var data = sheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === funcionario.rut) {
        foundIndex = i + 1;
        break;
      }
    }
    if (foundIndex > -1) {
      sheet.getRange(foundIndex, 1, 1, 5).setValues([
        [
          funcionario.rut,
          funcionario.nombre,
          funcionario.unidad,
          funcionario.contrato,
          funcionario.estado,
        ],
      ]);
    } else {
      sheet.appendRow([
        funcionario.rut,
        funcionario.nombre,
        funcionario.unidad,
        funcionario.contrato,
        funcionario.estado,
      ]);
    }
  }

  /**
   * Lista funcionarios.
   * @return {Object[]}
   */
  function listarFuncionarios() {
    var sheet = getSheet(Config.SHEETS.FUNCIONARIOS.name);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(function (row) {
      return {
        rut: row[0],
        nombre: row[1],
        unidad: row[2],
        contrato: row[3],
        estado: row[4],
      };
    });
  }

  /**
   * Inserta un log del sistema.
   * @param {Object} log
   */
  function insertarLog(log) {
    var sheet = getSheet(Config.SHEETS.LOGS.name);
    sheet.appendRow([
      log.fecha,
      log.usuario,
      log.accion,
      log.detalle,
    ]);
  }

  /**
   * Obtiene parámetros activos.
   * @return {Object[]}
   */
  function listarParametros() {
    var sheet = getSheet(Config.SHEETS.PARAMETROS.name);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(function (row) {
      return {
        tipo: row[0],
        valor: row[1],
        activo: row[2],
      };
    });
  }

  /**
   * Lista logs para auditoría.
   * @return {Object[]}
   */
  function listarLogs() {
    var sheet = getSheet(Config.SHEETS.LOGS.name);
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    return data.slice(1).map(function (row) {
      return {
        fecha: row[0],
        usuario: row[1],
        accion: row[2],
        detalle: row[3],
      };
    });
  }

  return {
    ensureSheet: ensureSheet,
    insertarTurno: insertarTurno,
    listarTurnos: listarTurnos,
    upsertFuncionario: upsertFuncionario,
    listarFuncionarios: listarFuncionarios,
    insertarLog: insertarLog,
    listarParametros: listarParametros,
    listarLogs: listarLogs,
  };
})();
