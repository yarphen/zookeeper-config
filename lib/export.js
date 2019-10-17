const yaml = require('js-yaml');
const { flatten } = require('flat');

const exportToYaml = data => yaml.safeDump(data);

const exportToEnv = data => Object.entries(flatten(data)).map(keyValue => keyValue.join('=')).join('\n');

const exportToJson = data => JSON.stringify(data, null, 2);

const EXPORT_MAP = {
  yaml: exportToYaml,
  json: exportToJson,
  env: exportToEnv,
};

const exportData = (data, format) => {
  const exportFn = EXPORT_MAP[format];
  if (!exportFn) {
    throw new Error('Format not supported');
  }
  return exportFn(data);
};

module.exports = {
  exportData,
};
