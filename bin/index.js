#!/usr/bin/env node
const fs = require('fs');
const zoo = require('../lib/zoo');
const { exportData } = require('../lib/export');
const { importData } = require('../lib/import');
let { mode, m, format, F, file, f, zookeeperHost, z, path, p } = require('minimist')(process.argv.slice(2));

const DEFAULT_ZOOKEEPER_HOST = 'localhost:2181';
const MODE_EXPORT = 'export';
const MODE_IMPORT = 'import';

mode = mode || m;
format = format || F;
file = file || f;
zookeeperHost = zookeeperHost || z || DEFAULT_ZOOKEEPER_HOST;
path = path || p;

const run = async () => {

  if (!mode) {
    throw new Error('mode is missing');
  }
  if (!format) {
    throw new Error('format is missing');
  }
  if (!file) {
    throw new Error('file is missing');
  }
  if (!zookeeperHost) {
    throw new Error('zookeeperHost is missing');
  }
  if (!path) {
    throw new Error('path is missing');
  }

  if (path === '/' && mode === MODE_IMPORT) {
    throw new Error('cannot overwrite root node');
  }

  const client = await zoo.createClient(zookeeperHost);

  switch(mode) {
    case MODE_EXPORT: {
      zoo.deepGet(client, path)
        .then(data => exportData(data, format.toLowerCase()))
        .then(data => fs.writeFileSync(file, data))
        .catch(err => console.error(err))
        .then(() => client.close())
        .then(() => console.log('Finished'));
    };
    break;
    case MODE_IMPORT: {
      Promise.resolve(fs.readFileSync(file))
        .then(data => importData(data, format.toLowerCase()))
        .then(data => zoo.deepWrite(client, path, data))
        .catch(err => console.error(err))
        .then(() => client.close())
        .then(() => console.log('Finished'));
    };
    break;
    default: 
      throw new Error('No such mode');
  }
};

try {
  run();
} catch(e) {
  console.error(e);
  console.log(`
    Syntax: zookeeper-config <OPTIONS>

    Options:
    --mode, -m: mode 'export' means export from zookeeper,
      mode 'import' means import to zookeeper.
      Possible values: export|import
    --format, -F: input/output file format.
      Possible values: json|yaml|env
    --file, -f: <FILE> - path to the input/output file
    --path, -p: <PATH> - path to the target ZNode
    --zookeeperHost, -z: <ZOOKEEPER_HOST> - host of zookeeper; optional.
      The default value is 'localhost:2181'
  `)
}