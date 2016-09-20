"use strict";

const test = require('./_base')(module);



test['DefaultConfig'] = function*() {
  this.DefaultConfig.should.eql(require('../src/config.json'));
};



test['no config given'] = function*() {
  this.mgr = new this.Manager();

  this.mgr.config.should.eql(this.DefaultConfig);
};



test['config override'] = function*() {
  this.mgr = new this.Manager({
    foo: 'bar'
  });

  this.mgr.config.should.eql({ foo: 'bar' });
};
