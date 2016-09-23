"use strict";

// ensure we're in testing mode
process.env.NODE_ENV = 'test';

require('co-mocha'); // monkey-patch mocha

const _ = {
  fromPairs: require('lodash.frompairs')
};

const path = require('path'),
  liveServer = require("live-server"),
  fs = require('fs'),
  Q = require('bluebird'),
  genomatic = require('genomatic'),
  chai = require('chai'),
  sinon = require('sinon');
  

chai.use(require('sinon-chai'));

// pkg
const EthereumClients = require('../src');


module.exports = function(_module) {
  const tools = {
    buildPlatformConfig: function(platform, arch, cfg) {
      if (platform === 'darwin') {
        platform = 'mac';
      } else if (platform === 'win32') {
        platform = 'win';
      }
      
      const p = {};
      p[`${platform}`] = {};
      p[`${platform}`][`${arch}`] = cfg;
      return p;
    },
    startServer: function*() {
      liveServer.start({
        port: 38081, // Set the server port. Defaults to 8080.
        root: path.join(__dirname, 'archives'), // Set root directory that's being served. Defaults to cwd.
        open: false, // When false, it won't load your browser by default.
        logLevel: 0, // 0 = errors only, 1 = some, 2 = lots
      });
      
      yield Q.delay(1000);
      
      this.archiveTestHost = 'http://localhost:38081';
    },
    stopServer: function*() {
      liveServer.shutdown();
      
      yield Q.delay(1000);
    },
  };

  const test = {
    before: function*() {
      this.assert = chai.assert;
      this.expect = chai.expect;
      this.should = chai.should();
      
      this.Manager = EthereumClients.Manager;
      this.DefaultConfig = EthereumClients.DefaultConfig;

      for (let k in tools) {
        this[k] = genomatic.bind(tools[k], this);
      }
      
      // test help
      console.debug = console.log.bind(console);
      process.env.PATH += `:${path.join(__dirname, 'bin')}`;
    },
    beforeEach: function*() {
      this.mocker = sinon.sandbox.create();      
    },
    afterEach: function*() {
      this.mocker.restore();
    },
    tests: {},
  };

  _module.exports[path.basename(_module.filename)] = test;

  return test.tests;
};
