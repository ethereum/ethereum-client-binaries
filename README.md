# ethereum-client-binaries

[![Build Status](https://secure.travis-ci.org/hiddentao/ethereum-client-binaries.png?branch=master)](http://travis-ci.org/hiddentao/ethereum-client-binaries) [![NPM module](https://badge.fury.io/js/ethereum-client-binaries.png)](https://badge.fury.io/js/ethereum-client-binaries) [![Twitter URL](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/hiddentao)

Download Ethereum client binaries for your OS.

When you wish to run a local Ethereum client node it would be beneficial to first 
scan for existing node client binaries on the machine and then download 
appropriate client binaries if none found. **This package does both.**

It is structured so that it can be optionally be used in conjunction with a UI, 
e.g. if one wishes to allow a user to select the client software they wish to 
download.

Features:
* Configurable client types (Geth, Eth, Parity, etc)
* Security: Binary *sanity* checks, URL regex checks, SHA256 hash checks
* Can scan and download to specific folders
* Logging can be toggled on/off at runtime
* Can be integrated into Electron.js apps

## Installation

```shell
npm install --save ethereum-client-binaries
```

## Usage

### Config object

First a config object needs to be defined. This specifies the possible clients 
and the platforms they support. 

For example, a config object which specifies the [Geth client](https://github.com/ethereum/go-ethereum) for only 64-bit Linux platforms and the [Parity client](https://github.com/ethcore/parity) for only 32-bit Windows platforms might be:

```js
const config = {
  "clients": {
    "Geth": {
      "platforms": {
        "linux": {
          "x64": {
            "download": {
              "url": "https://geth.com/latest.tgz",
              "type": "tar",
              "bin": "geth-linux-x64",
              "sha256": "8359e8e647b168dbd053ec56438ab4cea8d76bd5153d681d001c5ce1a390401c",
            },
            "bin": "geth",
            "commands": {
              "sanity": {
                "args": ["version"],
                "output": [ "Geth", "1.4.12" ]
              }                
            }
          },
        }
      }
    },
    "Parity": {
      "platforms": {
        "win": {
          "ia32": {
            "download": {
              "url": "https://parity.com/latest.zip",
              "type": "zip"
            },
            "bin": "parity",
            "commands": {
              "sanity": {
                "args": ["version"],
                "output": [ "Parity", "11.0" ]
              }                
            }
          },
        }
      }      
    }
  }
}
```

Every client must specify one or more platforms, each of which must specify 
one or more architectures. Supported platforms are as documented for Node's [process.platform](https://nodejs.org/dist/latest-v6.x/docs/api/process.html#process_process_platform) except that `mac` is used instead of `darwin` and `win` is used instead of `win32`. Supported architectures are as documented for Node's [process.arch](https://nodejs.org/dist/latest-v6.x/docs/api/process.html#process_process_arch).

Each *platform-arch* entry needs to specify a `bin` key which holds the name of the executable on the system, a `download` key which holds info on where the binary can be downloaded from if needed, and a `commands` key which holds information on different kinds of commands that can be run against the binary. 

The `download` key holds the download `url`, the `type` of archive being downloaded, and - optionally - the filename of the binary (`bin`) inside the archive in case it differs from the expected filename of the binary. As a security measure, a `sha256` key equalling the SHA256 hash calculation of the downloadable file may be provided, in which the downloaded file's hash is tested 
for equality with this value.

The `sanity` command is mandatory and is a way to check a found binary to ensure that is is actually a valid client binary and not something else. In the above config the `sanity` command denotes that running `geth version` should return output containing *both* `Geth` and `1.4.12`.

Now we can construct a `Manager` with this config:

```js
const Manager = require('ethereum-client-binaries').Manager;

// construct
const mgr =  new Manager(config);
```

**Note:** If no config is provided then the default config ([src/config.json](https://github.com/hiddentao/ethereum-client-binaries/blob/master/src/config.json)) gets used.

### Scanning for binaries

Initialising a *manager* tells it to scan the system for available binaries:

```js
// initialise (scan for existing binaries on system)
mgr.init()
.then(() => {
  console.log( 'Client config: ', mgr.clients );
})
.catch(process.exit);
```

Let's say the current platform is `linux` with an `x64` architecture, and that `geth` has been resolved successfully to `/usr/local/bin/geth`, the `mgr.clients` property will look like:

```js
/*
[
  {
    id: 'Geth',
    state: {
      available: true,
    },
    platforms: { .... same as original ... }
    activeCli: {
      "download": {
        "url": "https://geth.com/latest.tgz",
        "type": "tar"
      },
      "bin": "geth",
      "commands": {
        "sanity": {
          "args": ["version"],
          "output": [ "Geth", "1.4.12" ]
        }                
      },
      fullPath: '/usr/local/bin/geth'
    }
  }
]
*/
```

The `state.available` property is the key property to check. If `false` then `state.failReason` will also be set. There are currently two possible values for `state.failReason`:

1. `notFound` - a binary with matching name (`geth` in above example) could not be found.
2. `sanityCheckFail` - a binary with matching name was found, but it failed the sanity check when executed.

The `activeCli.fullPath` property denotes the full path to the resolved client binary - this is only valid if `state.available` is `true`.

**NOTE:** The Parity client isn't present in `mgr.clients` shown above because there is no linux-x64 entry specified in the Parity config shown earlier. Thus, only *possible* clients (as per the original config) will be present in `mgr.clients`.

### Scan additional folders

By default the manager only scan the system `PATH` for available binaries, i.e. it doesn't do a full-disk scan. You can specify additional folders to scan using the `folders` option:

```js
mgr.init({
  folders: [
    '/path/to/my/folder/1',
    '/path/to/my/folder/2'
  ]
})
.then(...)
.catch(...)
```

This features is useful if you have previously downloaded the client binaries elsewhere or you already know that client binaries will be located within specific folders.

### Download client binaries

Client binaries can be downloaded whether already available on the system or not. The downloading mechanism supports downloading and unpacking ZIP and TAR files. 

The initial config object specifies where a package can be downloaded from, e.g:

```js
"download": {
  "url": "https://geth.com/latest.tgz",
  "type": "tar"
},
```

To perform the download, specify the client id:

```js
mgr.download("Geth")
.then(console.log)
.catch(console.error);
```

The returned result will be an object which looks like:

```js
{
  downloadFolder: /* where archive got downloaded */,
  downloadFile: /* the downloaded archive file */,
  unpackFolder: /* folder archive was unpacked to */,
  client: {
    id: 'Geth',
    state: {...},
    platforms: {...},
    activeCli: {...},
  }
}
```

The `client` entry in the returned info will be the same as is present for the given client within the `mgr.clients` property (see above).

After downloading and unpacking the client binary the sanity check is run against it to check that it is indeed the required binary, which means that the client's `state.available` and `state.failReason` keys will be updated with the results.

### Download to specific folder

By default the client binary archive will be downloaded to a temporarily created folder. But you can override this using the `downloadFolder` option:

```js
mgr.download("Geth", {
  downloadFolder: '/path/to/my/folder'
})
.then(...)
.catch(...)
```

If download and unpacking is successful the returned object will look something like:

```js
{
  downloadFolder: '/path/to/my/folder',
  downloadFile: '/path/to/my/folder/archive.tgz',
  unpackFolder: '/path/to/my/folder/unpacked',
}
```

The next time you initialise the manager you can pass in `/path/to/my/folder/unpacked` as an additional folder to scan for binaries in:

```js
mgr.init({
  folders: [
    `/path/to/my/folder/unpacked`
  ]
});
```

### URL regular expression (regex) check

Even though you can check the SHA 256 hash of the downloaded package (as shown 
  above) you may additionally wish to ensure that the download URL points to 
a domain you control. This is important if for example you are obtaining the 
initial JSON config object from a remote server.

This is how you use it:

```js
mgr.download("Geth", {
  urlRegex: /^https:\/\/ethereum.org\/.+$/
})
.then(...)
.catch(...)
```

The above regex states that ONLY download URLs beginning with
`https://ethereum.org/` are valid and allowed.


### Logging

By default internal logging is silent. But you can turn on logging at any time by setting the logger property:

```js
mgr.logger = console;    /* log everything to console */
```

The supplied logger object must have 3 methods: info, warn and error. If any one of these methods isn't provided then the built-in method (i.e. silent method) get used. For example:

```js
// let's output only the error messages
mgr.logger = {
  error: console.error.bind(console)
}
```


## Development

To build and run the tests:

```shell
$ npm install
$ npm test
```

## Contributions

Contributions welcome - see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT - see [LICENSE.md](LICENSE.md)
