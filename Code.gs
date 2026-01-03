/**
 * Bootstrap del web app: inicializa el entorno y entrega la UI principal.
 */
function doGet() {
  Core.ensureDataModel();
  var template = HtmlService.createTemplateFromFile('UI');
  return template.evaluate()
    .setTitle('Sistema de Turnos')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Incluye archivos HTML parciales.
 * @param {string} filename
 * @return {string}
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Obtiene la vista solicitada desde la carpeta views.
 * @param {string} vista
 * @return {string}
 */
function getVista(vista) {
  Core.ensureDataModel();
  var normalized = vista && vista.trim() ? vista.trim() : 'dashboard';
  var path = 'views/' + normalized;
  return include(path);
}
