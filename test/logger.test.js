"use strict";

const test = require('./_base')(module);


test.before = function*() {
  this.mgr = new this.Manager();
};


test['nothing by default'] = function*() {
  let spy = this.mocker.spy(console, 'info');

  this.mgr._logger.info('test');
  
  spy.should.not.have.been.called;
};


test['turn on and off'] = function*() {
  let spy = this.mocker.spy(console, 'info');
  
  this.mgr.logger = {
    info: spy,
  };
  this.mgr._logger.info('test logging');
  
  const callCount = spy.callCount;
  callCount.should.eql(1);
  
  this.mgr.logger = null;

  this.mgr._logger.info('test logging');
  
  spy.callCount.should.eql(callCount);
};



test['must be valid logger'] = function*() {
  let spy = this.mocker.spy();
  
  this.mgr.logger = 'blah';
  
  this.mgr._logger.info('test');

  spy.should.not.have.been.called;
};



