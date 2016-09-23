"use strict";

const got = require('got'),
  fs = require('fs'),
  path = require('path'),
  tmp = require('tmp'),
  mkdirp = require('mkdirp'),
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
   * @param {Object} [options] Additional options.
   * @param {Array} [options.folders] Additional folders to search in for client binaries.
   * 
   * @return {Promise}
   */
  init(options) {
    this._logger.info('Initializing...');
    
    this._resolvePlatform();
    
    return this._scan(options);
  }
  
  
  /**
   * Download a particular client.
   *
   * If client supports this platform then 
   * it will be downloaded from the download URL, whether it is already available 
   * on the system or not.
   * 
   * If client doesn't support this platform then the promise will be rejected.
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
    
    this._logger.info(`Download binary for ${clientId} ...`);

    const client = (this._clients || []).filter((c) => c.id === clientId).pop();
    
    const activeCli = _.get(client, `activeCli`),
      downloadCfg = _.get(activeCli, `download`);

    return Promise.resolve()
    .then(() => {
      // not for this machine?
      if (!client) {
        throw new Error(`${clientId} missing configuration for this platform.`);
      }

      if (!_.get(downloadCfg, 'url') || !_.get(downloadCfg, 'unpack')) {
        throw new Error(`Download info not available for ${clientId}`);
      }
      
      let resolve, reject;
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      });

      this._logger.debug('Generating download folder path ...');
      
      const downloadFolder = path.join(
        options.downloadFolder || tmp.dirSync().name,
        client.id
      );
      
      this._logger.debug(`Ensure download folder ${downloadFolder} exists ...`);
      
      mkdirp.sync(downloadFolder);
        
      const downloadFile = path.join(downloadFolder, `download.archive`);

      this._logger.info(`Downloading package from ${downloadCfg.url} to ${downloadFile} ...`);

      const writeStream = fs.createWriteStream(downloadFile);
      
      const stream = got.stream(downloadCfg.url);
      
      // stream.pipe(progress({
      //   time: 100
      // }));
      
      stream.pipe(writeStream);
      
      // stream.on('progress', (info) => );
      
      stream.on('error', (err) => {
        this._logger.error(err);
        
        reject(new Error(`Error downloading package for ${clientId}: ${err.message}`));
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

      const cmd = (downloadCfg.unpack)
        .replace('$inputFile', downloadFile)
        .replace('$outputDir', unzipFolder)
        .split(' ');

      return this._spawn(cmd[0], cmd.slice(1))
      then(() => {
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
   * @param {Object} [options] Additional options.
   * @param {Array} [options.folders] Additional folders to search in for client binaries.
   * 
   * @return {Promise}
   */
  _scan (options) {    
    this._clients = [];

    return this._calculatePossibleClients()
    .then((clients) => {
      this._clients = clients;
      
      this._logger.info(`${this._clients.length} possible clients.`);          

      if (!this._clients.length) {
        return;
      }
      
      return this._verifyClientStatus(this._clients, options);
    });
  }
  
  
  /**
   * Calculate possible clients for this machine by searching for binaries.
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
   * @param {Object} [options] Additional options.
   * @param {Array} [options.folders] Additional folders to search in for client binaries.
   * 
   * @return {Promise}
   */
  _verifyClientStatus (clients, options) {
    options = Object.assign({
      folders: []
    }, options);
    
    this._logger.info(`Verifying status of all ${clients.length} possible clients...`);
    
    return Promise.all(clients.map((client) => {
      this._logger.info(`Checking ${client.id} availability ...`);
      
      const binName = client.activeCli.bin;
      
      // reset state
      client.state = {};
      delete client.activeCli.binPath;
      
      this._logger.debug(`${client.id} binary name: ${binName}`);
            
      const binPaths = [];
      
      return this._spawn('command', ['-v', binName]) 
      .then((output) => {
        const systemPath = _.get(output, 'stdout', '').trim();
        
        if (_.get(systemPath, 'length')) {
          this._logger.debug(`Got PATH binary for ${client.id}: ${systemPath}`);

          binPaths.push(systemPath);
        }
      })
      .then(() => {
        // now let's search additional folders
        if (_.get(options, 'folders.length')) {
          options.folders.forEach((folder) => {
            const fullPath = path.join(folder, binName);
            
            try {
              fs.accessSync(fullPath, fs.F_OK | fs.X_OK);
              
              this._logger.debug(`Got optional folder binary for ${client.id}: ${fullPath}`);

              binPaths.push(fullPath);
            } catch (err) { 
              /* do nothing */
            }
          });
        }
      })
      .then(() => {
        if (!binPaths.length) {
          throw new Error(`No binaries found for ${client.id}`);
        }
      })
      .catch((err) => {
        this._logger.error(`Unable to resolve ${client.id} executable: ${binName}`);
        
        client.state.available = false;
        client.state.failReason = 'notFound';
        
        throw err;
      })
      .then(() => {        
        // sanity check each available binary until a good one is found
        return Promise.all(binPaths.map((binPath) => {
          this._logger.debug(`Running ${client.id} sanity check for binary: ${binPath} ...`);
          
          return this._runSanityCheck(client, binPath)
          .catch((err) => {
            this._logger.debug(`Sanity check failed for: ${binPath}`);
          });          
        }))
        .then(() => {
          // if one succeeded then we're good
          if (client.activeCli.fullPath) {
            return;
          }
          
          client.state.available = false;
          client.state.failReason = 'sanityCheckFail';
          
          throw new Error('All sanity checks failed');
        });
      })
      .then(() => {
        client.state.available = true;
      })
      .catch((err) => {
        this._logger.debug(`${client.id} deemed unavailable`);

        client.state.available = false;
      })
    }));
  }
  
  
  /**
   * Run sanity check for client.
   
   * @param {Object} client Client config info.
   * @param {String} binPath Path to binary (to sanity-check).
   *
   * @return {Promise}
   */
  _runSanityCheck (client, binPath) {
    this._logger.debug(`${client.id} binary path: ${binPath}`);
    
    this._logger.info(`Checking for ${client.id} sanity check ...`);
            
    const sanityCheck = _.get(client, 'cli.commands.sanityCheck');
    
    return Promise.resolve()
    .then(() => {
      if (!sanityCheck) {
        throw new Error(`No ${client.id} sanity check found.`);
      }      
    })
    .then(() => {
      this._logger.info(`Checking sanity for ${client.id} ...`)
      
      return this._spawn(binPath, sanityCheck.args);      
    })
    .then((output) => {
      const haystack = output.stdout + output.stderr;
      
      this._logger.debug(`Sanity check output: ${haystack}`);
      
      const needles = sanityCheck.output || [];
      
      for (let needle of needles) {
        if (0 > haystack.indexOf(needle)) {
          throw new Error(`Unable to find "${needle}" in ${client.id} output`);
        }
      }
      
      this._logger.debug(`Sanity check passed for ${binPath}`);      

      // set it!
      client.activeCli.fullPath = binPath;
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





