"use strict";

const got = require('got'),
  path = require('path'),
  tmp = require('tmp'),
  // EventEmitter = require('events'),
  // progress = require('progress-stream'),
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
   * If client has config this platform then 
   * it will be downloaded from the download URL, whether is already available 
   * on the system or not.
   * 
   * If client doesn't have config for current platform then this will thrown an 
   * error.
   *
   * @param {Object} [options] Options.
   * @param {Object} [options.downloadFolder] Folder to download client to, and to unzip it in.
   *
   * @return {Promise} 
   */
  download (clientId, options) {
    options = Object.assign({
      downloadFolder: null,
    }, options);
    
    this._logger.info(`Download binary for client ${clientId} ...`);

    let client = (this._config || []).filter((c) => {
      return (c.id === clientId);
    });
    
    client = _.get(client, '0');

    const activeCli = _.get(client, `activeCli`),
      downloadCfg = _.get(activeCli, `download`);

    return Promise.resolve()
    .then(() => {
      // not for this machine?
      if (!client) {
        throw new Error(`Client ${clientId} missing configuration for this platform.`);
      }

      if (!_.get(downloadCfg, 'url') || !_.get(downloadCfg, 'type')) {
        throw new Error(`Download info not available for client ${clientId}`);
      }
      
      let resolve, reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });
      
      const downloadFolder = path.join(
        options.downloadFolder || path.join(tmp.dirSync(), clientId),
        clientId
      );
        
      this._logger.debug(`Downloading to folder ${downloadFolder} ...`);
      
      const downloadFile = path.join(downloadFolder, `download.${downloadCfg.type}`);

      this._logger.info(`Downloading package from ${downloadCfg.url} to ${downloadFile} ...`);

      const writeStream = fs.createWriteStream(downloadFile);
      
      const stream = got.stream(cfg.url);
      
      // stream.pipe(progress({
      //   time: 100
      // }));
      
      stream.pipe(writeStream);
      
      // stream.on('progress', (info) => );
      
      stream.on('error', (err) => {
        this._logger.error(`Error downloading package for client ${clientId}`, err);
        
        reject(err);
      })
      
      stream.on('end', () => {        
        this._logger.debug(`Downloaded ${downloadCfg.url} to ${downloadFile}`);

        resolve({
          downloadFolder: downloadFolder,
          downloadFile: downloadFile,
        });        
      });
      
      return promise;
    })
    .then((dInfo) => {
      const downloadFolder = dInfo.downloadFolder,
        downloadFile = dInfo.downloadFile;
      
      const unzipFolder = path.join(downloadFolder, 'unzipped');
      
      this._logger.debug(`Unzipping ${downloadFile} to ${unzipFolder} ...`);

      let promise;
      
      switch (downloadCfg.type) {
        case 'zip':
          promise = this._spawn('unzip', ['-o', downloadFile, '-d', unzipFolder]);
          break;
        case 'tar':
          promise = this._spawn('tar', ['-xf', downloadFile, '-C', unzipFolder]);
          break;
        default:
          throw new Error(`Unsupported zip type: ${downloadCfg.type}`);
      }
      
      return promise.then(() => {
        this._logger.debug(`Unzipped ${downloadFile} to ${unzipFolder}`);
        
        return {
          downloadFolder: downloadFolder,
          downloadFile: downloadFile,        
          unzipFolder: unzipFolder,  
        };
      });
    })
    .then((info) => {
      // check for binary
      
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
          available: false,
          failReason: 'notFound',
        };
        
        throw err;
      })
      .then((fullPath) => {
        return this._runSanityCheck(client, fullPath)
        .catch((err) => {
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
   * Run sanity check for client.
   
   * @param {Object} client Client config info.
   * @param {String} binPath Path to binary (to sanity-check).
   */
  _runSanityCheck (client, binPath) {
    this._logger.debug(`${client.id} binary path: ${fullPath}`);
    
    client.activeCli.fullPath = fullPath;

    this._logger.info(`Checking for ${client.id} sanity check...`);
            
    const sanityCheck = _.get(client, 'cli.commands.sanityCheck');
    
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
            
      throw err;
    });    
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





