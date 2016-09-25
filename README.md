# ethereum-clients

[![Build Status](https://secure.travis-ci.org/hiddentao/ethereum-clients.png?branch=master)](http://travis-ci.org/hiddentao/ethereum-clients) [![NPM module](https://badge.fury.io/js/ethereum-clients.png)](https://badge.fury.io/js/ethereum-clients) [![Twitter URL](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/hiddentao)

Scan for and download Ethereum client software to run locally.

When you wish to run a local Ethereum client node it would be beneficial to first 
scan for existing node client software on the machine and then download 
appropriate client software if none found. This package makes this process easy.

It is structured so that it can be optionally be used in conjunction with a UI, 
e.g. if one wishes to allow a user to select the client software they wish to 
download.

Features:
* Configurable client types (Geth, Eth, Parity, etc)
* Configurable *sanity* checks
* Can scan and download to specific folders
* Can be integrated into Electron.js apps

## Installation

```shell
npm i ethereum-clients
```

## Usage

### Basic setup

First a config object needs to be defined. This specifies the possible clients 
and the platforms they support. For example:

```js
const config = {
  "clients": {
    "Geth": {
      "cli": {
        "platforms": {
          "linux": {
            "x64": {
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
              }
            },
          }
        }
      }
    }
  }
}
```

Now we can create an instance of the client `Manager` and initialise it.

```js
const Manager = require('ethereum-clients').Manager;

const mgr =  new Manager(config);

mgr.init()
.then(() => {
  console.log( 'Client config: ', mgr.clients );
})
.catch(process.exit);
```

Let's say the current platform is `linux` with an `x64` architecture, and that 
`geth` has been resolved successfully to `/usr/local/bin/geth`, the `mgr.clients` 
propery will return something like the following:

```js

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

