"use strict";

const path = require('path');

const test = require('./_base')(module);


test['no clients'] = function*() {
  let mgr = new this.Manager({
    "clients": {} 
  });
  
  try {
    // mgr.logger = console;
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql('Maga missing configuration for this platform.');
  }
};


test['client not supported on architecture'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, 'invalid', {
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
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Maga missing configuration for this platform.`);
  }
};



test['client not supported on platform'] = function*() {
  const platforms = this.buildPlatformConfig('invalid', process.arch, {
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
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Maga missing configuration for this platform.`);
  }
};



test['download info not available'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    "bin": "maga"    
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Download info not available for Maga`);
  }
};



test['download url not available'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      unpack: 'blah'
    },
    "bin": "maga"    
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Download info not available for Maga`);
  }
};


test['download unpack command not available'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: 'http://adsfasd.com'
    },
    "bin": "maga"    
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Download info not available for Maga`);
  }
};



test['download fails'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: 'http://adsfasdasdofjasdlfjasdlf.com/aksdfas/asdfasfd.zip',
      unpack: 'asdfasdfadsf'
    },
    "bin": "maga"    
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga": {
        "homepage": "http://badgerbadgerbadger.com",
        "version": "1.0.0",
        "foo": "bar",
        "versionNotes": "http://badgerbadgerbadger.com",
        "cli": {
          "commands": {
            "sanityCheck": {
              "args": ['test'],
              "output": [ "good:test" ]
            }
          },                  
          "platforms": platforms,
        }
      }
    }
  });
  
  // mgr.logger = console;
  yield mgr.init();
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.contain(`Error downloading package for Maga`);
  }
};




