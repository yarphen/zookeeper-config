
# Cli tool   
## Syntax: zookeeper-config <OPTIONS>

### Options:

* ``--mode, -m``: mode 'export' means export from zookeeper,
    mode 'import' means import to zookeeper.
    Possible values: export|import
* ``--format, -F``: input/output file format.
    Possible values: json|yaml|env
* ``--file, -f``: path to the input/output file
* ``--path, -p``: path to the target ZNode
* ``--zookeeperHost, -z``: host of zookeeper; optional.
    The default value is 'localhost:2181'
