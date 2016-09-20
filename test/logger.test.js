"use strict";

const test = require('./_base')(module);


test.before = function*() {
  this.clients = new this.Manager();
};


test['nothing by default'] = function*() {
  let spy = this.mocker.spy(console, 'info');

  this.clients._logger.info('test');
  
  spy.should.not.have.been.called;
};


test['turn on and off'] = function*() {
  let spy = this.mocker.spy(console, 'info');
  
  this.clients.logger = {
    info: spy,
  };
  this.clients._logger.info('test logging');
  
  const callCount = spy.callCount;
  callCount.should.eql(1);
  
  this.clients.logger = null;

  this.clients._logger.info('test logging');
  
  spy.callCount.should.eql(callCount);
};



test['must be valid logger'] = function*() {
  let spy = this.mocker.spy();
  
  this.clients.logger = 'blah';
  
  this.clients._logger.info('test');

  spy.should.not.have.been.called;
};



