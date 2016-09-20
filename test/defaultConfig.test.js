"use strict";

const test = require('./_base')(module);



test['same as config.json'] = function*() {
  this.DefaultConfig.should.eql(require('../src/config.json'));
};
