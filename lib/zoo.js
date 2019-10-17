const zookeeper = require('node-zookeeper-client');
const { unflatten, flatten } = require('flat');
const debounce = require('lodash.debounce');

const resolvePath = (...paths) => '/' + paths.map(path => path.replace(/^\/|\/$/g, '')).filter(item => !!item).join('/').replace(/\/\//g, '/');

const get = (client, path, watcher) => new Promise((resolve, reject) => {
  console.log('get', path);
  client.getData(path, watcher, (error, data) => {
    if (error) {
      console.error('get', error);
      return reject(error);
    }
    resolve(data && data.toString('utf-8'));
  });
});

const exists = (client, path, watcher) => new Promise((resolve, reject) => {
  console.log('exists', path);
  client.exists(path, watcher, (error, stat) => {
    if (error) {
      console.error('exists', error);
      return reject(error);
    }
    resolve(!!stat);
  });
});

const list = (client, path, watcher) => new Promise((resolve, reject) => {
  console.log('list', path);
  client.getChildren(path, watcher, (error, children) => {
    if (error) {
      return reject(error);
    }
    resolve(children);
  });
});

const removeRecursive = (client, path) => new Promise((resolve, reject) => {
  console.log('removeRecursive', path);
  client.removeRecursive(path, (error) => {
    if (error) {
      console.error('removeRecursive', error);
      return reject(error);
    }
    resolve();
  });
});

const mkdirp = (client, path) => new Promise((resolve, reject) => {
  console.log('mkdirp', path);
  client.mkdirp(path, (error) => {
    if (error) {
      console.error('mkdirp', error);
      return reject(error);
    }
    resolve();
  });
});

const deepGet = async (client, path, watcher) => {
  const children = await list(client, path, watcher);
  if (children.length) {
    const entries = await Promise.all(children.map((child) => {
      const absolutePath = resolvePath(path, child);
      return deepGet(client, absolutePath, watcher).then(data => ({ [child]: data }))
    }));
    const entriesObj = Object.assign({}, ...entries);
    return unflatten(entriesObj, { delimiter: '/' })
  } else {
    return get(client, path, watcher);
  }
};

const deepWrite = async (client, path, rawData, cleanup = true) => {
  const data = unflatten(flatten(rawData));
  if (cleanup) {
    if (await exists(client, path)) {
      await removeRecursive(client, path);
    }
    await mkdirp(client, path);
  }
  let transaction = client.transaction();
  Object.entries(data).forEach(([relativePath, value]) => {
    const absolutePath = resolvePath(path, relativePath);
    if (typeof value === "object") {
      console.log('create', absolutePath);
      transaction.create(absolutePath);
    } else {
      console.log('create', absolutePath, value);
      transaction.create(absolutePath, Buffer.from(value.toString()));
    }
  });
  await new Promise((resolve, reject) => transaction.commit((error) => {
    if (error) {
      console.error('error', error);
      return reject(error);
    }
    resolve();
    console.log('commit');
  }));
  await Promise.all(Object.entries(data).map(([relativePath, value]) => {
    const absolutePath = resolvePath(path, relativePath);
    if (typeof value === "object") {
      return deepWrite(client, absolutePath, value, false);
    }
  }));
};

const deepWatch = (client, path, onChange, onError, wait = 5000) => {
  const debouncedWatcher = debounce(() => deepGet(client, path, debouncedWatcher).then(onChange).catch(onError), wait);
  return deepGet(client, path, debouncedWatcher).then(onChange).catch(onError);
};

const createClient = (zookeeperHost) => new Promise((resolve, reject) => {
  let resolved = false;
  const client = zookeeper.createClient(zookeeperHost);

  client.once('connected', function () {
    console.log('Connected to ZooKeeper.');
    resolved = true;
    resolve(client);
  });

  client.once('connectedReadOnly', function () {
    console.log('Connected to ZooKeeper.');
    resolved = true;
    resolve(client);
  });

  client.once('disconnected', function () {
    console.log('Disonnected from ZooKeeper.');
    if (!resolved) {
      reject(new Error('Disonnected from ZooKeeper.'));
    }
  });

  client.once('expired', function () {
    console.log('Session expired.');
    if (!resolved) {
      reject(new Error('Session expired.'));
    }
  });

  client.once('authenticationFailed', function () {
    console.log('Authentication failed.');
    if (!resolved) {
      reject(new Error('Authentication failed.'));
    }
  });

  client.connect();
})

module.exports = {
  deepGet,
  deepWrite,
  deepWatch,
  createClient,
};
