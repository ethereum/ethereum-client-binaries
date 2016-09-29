"use strict";

const path = require('path');
const _values = require('lodash.values');
const test = require('./_base')(module);


test['no clients'] = function*() {
  let mgr = new this.Manager({
    "clients": {} 
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(0);
};


test['client not supported on architecture'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, 'invalid', {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },                  
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(0);
};



test['client not supported on platform'] = function*() {
  const platforms = this.buildPlatformConfig('invalid', process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(0);
};



test['unable to resolve binary'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "invalid",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(1);
  
  const client = _values(mgr.clients).pop();
  
  client.state.available.should.be.false;
  client.state.failReason.should.eql('notFound');
};



test['sanity check failed'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "invalid" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(1);
  
  const client = _values(mgr.clients).pop();
  
  client.state.available.should.be.false;
  client.state.failReason.should.eql('sanityCheckFail');
};


test['sanity check passed'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(1);
  
  const client = _values(mgr.clients).pop();
  
  client.state.available.should.be.true;
};



test['sanity check is mandatory'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga"    
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  Object.keys(mgr.clients).length.should.eql(1);
  
  const client = _values(mgr.clients).pop();
  
  client.state.available.should.be.false;
  client.state.failReason.should.eql('sanityCheckFail');
};



test['client config returned'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "maga",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  const config = {
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  };
  
  let mgr = new this.Manager(config);
  
  // mgr.logger = console;
  yield mgr.init();
  
  const client = _values(mgr.clients).pop();
  
  client.should.eql(Object.assign({}, config.clients.Maga, {
    id: 'Maga',
    state: {
      available: true,
    },
    activeCli: {
      url: 'http://badgerbadgerbadger.com',
      bin: 'maga',
      fullPath: path.join(__dirname, 'bin', 'maga'),
      "commands": {
        "sanity": {
          "args": ['test'],
          "output": [ "good:test" ]
        }
      },               
    }
  }));
};



test['search additional folders'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "url": "http://badgerbadgerbadger.com",
    "bin": "rada",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good", "test" ]
      }
    },               
  });
  
  const config = {
    clients: {
      "Rada": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "platforms": platforms,
      }
    }
  };
  
  let mgr = new this.Manager(config);
  
  // mgr.logger = console;
  yield mgr.init({
    folders: [
      path.join(__dirname, 'bin', 'folder2')
    ]
  });
  
  const client = _values(mgr.clients).pop();
  
  client.should.eql(Object.assign({}, config.clients.Rada, {
    id: 'Rada',
    state: {
      available: true,
    },
    activeCli: {
      url: 'http://badgerbadgerbadger.com',
      bin: 'rada',
      fullPath: path.join(__dirname, 'bin', 'folder2', 'rada'),
      commands: {
        "sanity": {
          "args": ['test'],
          "output": [ "good", "test" ]
        }        
      }
    }
  }));
};



