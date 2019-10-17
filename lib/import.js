const yaml = require('js-yaml');
const dotenv = require('dotenv');

const importFromYaml = data => yaml.safeLoad(data);

const importFromEnv = data => dotenv.parse(data);

const importFromJson = data => JSON.parse(data);

const IMPORT_MAP = {
  yaml: importFromYaml,
  json: importFromJson,
  env: importFromEnv,
};

const importData = (data, format) => {
  const importFn = IMPORT_MAP[format];
  if (!importFn) {
    throw new Error('Format not supported');
  }
  return importFn(data);
};

module.exports = {
  importData,
};
