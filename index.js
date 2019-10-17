
const { deepGet, deepWatch, deepWrite, createClient } = require('./lib/zoo');
const { exportData } = require('./lib/export');
const { importData } = require('./lib/import');

module.exports = {
  deepGet,
  deepWatch,
  deepWrite,
  createClient,
  exportData,
  importData,
};
