var Utils = (function () {
  /**
   * Devuelve fecha y hora en ISO local.
   * @return {string}
   */
  function nowIso() {
    return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }

  /**
   * Valida formato de fecha YYYY-MM-DD.
   * @param {string} fecha
   * @return {boolean}
   */
  function esFechaValida(fecha) {
    if (!fecha) return false;
    var partes = fecha.split('-');
    if (partes.length !== 3) return false;
    var y = Number(partes[0]);
    var m = Number(partes[1]) - 1;
    var d = Number(partes[2]);
    var date = new Date(y, m, d);
    return date && date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
  }

  /**
   * Valida RUT chileno simple con dígito verificador.
   * @param {string} rut
   * @return {boolean}
   */
  function validarRut(rut) {
    if (!rut) return false;
    var clean = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (clean.length < 2) return false;
    var body = clean.slice(0, -1);
    var dv = clean.slice(-1);
    var sum = 0;
    var multiplier = 2;
    for (var i = body.length - 1; i >= 0; i--) {
      sum += Number(body.charAt(i)) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    var expected = 11 - (sum % 11);
    var dvCalc = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
    return dvCalc === dv;
  }

  return {
    nowIso: nowIso,
    esFechaValida: esFechaValida,
    validarRut: validarRut,
  };
})();
