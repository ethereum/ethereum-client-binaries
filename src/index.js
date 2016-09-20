"use strict";

const got = require('got'),
  spawn = require('buffered-spawn');
  
const _ = {
  isEmpty: require('lodash.isempty'),
  get: require('lodash.get'),
};
  

const DUMMY_LOGGER = {
  debug: function() {},
  info: function() {},
  warn: function() {},
  error: function() {}
};


const DefaultConfig = exports.DefaultConfig = require('./config.json');


class Manager {
  /**
   * Construct a new instance.
   *
   * @param {Object} [config] The configuraton to use. If ommitted then the 
   * default configuration (`DefaultConfig`) will be used.
   */
  constructor (config) {
    this._config = config || DefaultConfig;
    
    this._logger = DUMMY_LOGGER;
  }
  
  /**
   * Get configuration.
   * @return {Object}
   */
  get config () {
    return this._config;
  }
  
  
  /**
   * Set the logger.
   * @param {Object} val Should have same methods as global `console` object.
   */
  set logger (val) {
    this._logger = {};
    
    for (let key in DUMMY_LOGGER) {
      this._logger[key] = (val && typeof val[key] === 'function') 
        ? val[key].bind(val)
        : DUMMY_LOGGER[key]
      ;
    }
  }
  
  
  /**
   * Get info on available clients.
   *
   * This will return an array, each item having the structure:
   *
   * {
   *  id: "client name"
   *  homepage: "client homepage url"
   *  version: "client version"
   *  versionNotes: "client version notes url"
   *  cli: {... info on all available platforms...},
   *  activeCli: {
   *    ...info for this platform...
   *  }
   *  status: {
        "available": true OR false (depending on status)
        "failReason": why it is not available (`sanityCheckFail`, `notFound`, etc)
   *  }
   * }
   * 
   * @return {Array}
   */
  get clients () {
    return this._clients;
  }

  
  /**
   * Initialize the manager.
   * 
   * This will scan for clients.
   * Upon completion `this.clients` will have all the info you need.
   *
   * @return {Promise}
   */
  init() {
    this._logger.info('Initializing...');
    
    this._resolvePlatform();
    
    return this._scan();
  }
  
  
  /**
   * Download a particular client.
   *
   * If client has config this platform and is not  available then 
   * it will be downloaded from the download URL.
   * 
   * If client doesn't have config for current platform then this will thrown an 
   * error. If has config and has been found on this platform then 
   * this will do nothing and return immediately.
   *
   * @return {Promise} This object will also emit `progress` events indicating 
   * download and unzip progress.
   */
  download (clientId) {
    this._logger.info(`Download binary for client ${clientId}...`);
    
    return Promise.resolve()
    .then(() => {
      let client = (this._config || []).filter((c) => {
        return (c.id === clientId);
      });
      
      client = _.get(client, '0');
      
      // not for this machine?
      if (!client) {
        throw new Error(`Client ${clientId} missing configuration for this platform.`);
      }
      
      // already available?
      if (_.get(client, 'state.available')) {
        return;
      }
      
      // active cli
      const cfg = _.get(client, `activeCli`);
      
      if (!cfg.url) {
        throw new Error(`No download URL available for client ${clientId}`);
      }
      
      let promise = new Promise();

      this._logger.info(`Downloading binary from ${cfg.url}...`);

      got.stream(cfg.url);
      // TODO
      
      return promise;
    });
  }
  

  
  _resolvePlatform () {
    this._logger.info('Resolving platform...');

    // platform
    switch (process.platform) {
      case 'win32':
        this._os = 'win';
        break;
      case 'darwin':
        this._os = 'mac';
        break;
      default:
        this._os = process.platform;
    }          
    
    // architecture
    this._arch = process.arch;
    
    return Promise.resolve();
  }
  
  
  /**
   * Scan the local machine for client software, as defined in the configuration.
   *
   * Upon completion `this._clients` will be set.
   *
   * @return {Promise}
   */
  _scan () {
    this._clients = [];

    return this._calculatePossibleClients()
    .then((clients) => {
      this._clients = clients;
      
      this._logger.info(`${this._clients.length} possible clients.`);          

      if (!this._clients.length) {
        return;
      }
      
      return this._verifyClientStatus(this._clients);
    });
  }
  
  
  /**
   * @return {Promise}
   */
  _calculatePossibleClients () {
    return Promise.resolve()
    .then(() => {
      // get possible clients
      this._logger.info('Calculating possible clients...');
      
      const possibleClients = [];
      
      for (let clientName in _.get(this._config, 'clients', {})) {
        let client = this._config.clients[clientName];
        
        if (_.get(client, `cli.platforms.${this._os}.${this._arch}`)) {
          possibleClients.push(
            Object.assign({}, client, {
              id: clientName,
              activeCli: client.cli.platforms[this._os][this._arch]
            })
          );
        }
      }
      
      return possibleClients;      
    });
  }
  
  
  /**
   * This will modify the items in the passed-in array according to check results.
   * 
   * @return {Promise}
   */
  _verifyClientStatus (clients) {
    this._logger.info(`Verifying status of all ${clients.length} possible clients...`);
    
    return Promise.all(clients.map((client) => {
      this._logger.info(`Checking ${client.id} availability...`);
      
      const binName = client.activeCli.bin;
      
      this._logger.debug(`${client.id} binary name: ${binName}`);
            
      return this._spawn('command', ['-v', binName]) 
      .then((output) => {
        const fullPath = _.get(output, 'stdout', '').trim();
        
        if (!_.get(fullPath, 'length')) {
          throw new Error(`Command not found: ${binName}`);
        }
        
        return fullPath;
      })
      .catch((err) => {
        this._logger.error(`Unable to resolve ${client.id} executable: ${binName}`);
        
        client.state = {
          failReason: 'notFound',
        };
        
        throw err;
      })
      .then((fullPath) => {
        this._logger.debug(`${client.id} binary path: ${fullPath}`);
        
        client.activeCli.fullPath = fullPath;

        this._logger.info(`Checking for ${client.id} sanity check...`);
                
        const sanityCheck = _.get(this._config.clients[client.id], 'cli.commands.sanityCheck');
        
        if (!sanityCheck) {
          this._logger.debug(`No sanity check set for ${client.id}, so skipping.`);
          
          return;
        }
        
        this._logger.info(`Checking sanity for ${client.id}...`)
        
        return this._spawn(client.activeCli.fullPath, sanityCheck.args)
        .then((output) => {
          const haystack = output.stdout + output.stderr;
          
          this._logger.debug(`Sanity check output: ${haystack}`);
          
          const needles = sanityCheck.output || [];
          
          for (let needle of needles) {
            if (0 > haystack.indexOf(needle)) {
              throw new Error(`Unable to find "${needle}" in ${client.id} output`);
            }
          }
        })
        .catch((err) => {
          this._logger.error(`Sanity check failed for ${client.id}`, err);
          
          client.state = {
            failReason: 'sanityCheckFail',
          };
          
          throw err;
        });
      })
      .then(() => {
        client.state = client.state || {};
        client.state.available = true;
      })
      .catch((err) => {
        client.state = client.state || {};
        client.state.available = false;
      })
    }));
  }
  
  /**
   * @return {Promise} Resolves to { stdout, stderr } object
   */
  _spawn(cmd, args) {
    args = args || [];
    
    this._logger.debug(`Exec: "${cmd} ${args.join(' ')}"`);
    
    return spawn(cmd, args);
  }
}


exports.Manager = Manager;





