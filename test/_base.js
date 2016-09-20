"use strict";

// ensure we're in testing mode
process.env.NODE_ENV = 'test';

require('co-mocha'); // monkey-patch mocha

const _ = {
  fromPairs: require('lodash.frompairs')
};

const path = require('path'),
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
    }
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
