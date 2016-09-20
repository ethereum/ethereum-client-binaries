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
   * Initialise the manager.
   *
   * Upon completion `this.clients` will have all the info you need.
   *
   * @return {Promise}
   */
  init() {
    this._logger.info('Initializing...');
    
    this._resolvePlatform();
    
    return this._scan();
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
        const fullPath = output.stdout;
        
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
                
        const sanityCheck = _.get(this._config[client.id], 'cli.commands.sanityCheck');
        
        if (!sanityCheck) {
          this._logger.debug(`No sanity check set for ${client.id}, so skipping.`);
          
          return;
        }
        
        return this._spawn(client.cli.fullPath, sanityCheck.args)
        .then((output) => {
          const haystack = output.stdout + output.stderr;
          
          const needles = sanityCheck.output || [];
          
          for (let needle of needles) {
            if (0 > haystack.indexOf(needle)) {
              throw new Error(`Unable to find "${needle}" in ${client.id} output`);
            }
          }
        })
        .catch((err) => {
          this._logger.error(`Sanity check failed for ${client.id}`);
          
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
    args = args = [];
    
    this._logger.debug(`Exec: ${cmd} ${args.join(' ')}`);
    
    return spawn(cmd, args);
  }
}


exports.Manager = Manager;





