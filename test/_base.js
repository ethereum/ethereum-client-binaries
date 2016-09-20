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
  const tools = {};

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
