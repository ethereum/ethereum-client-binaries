"use strict";

const _get = require('lodash.get'),
  fs = require('fs'),
  path = require('path');

const test = require('./_base')(module);


test.before = function*() {
  yield this.startServer();
};


test.after = function*() {
  yield this.stopServer();
};



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
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.eql(`Maga missing configuration for this platform.`);
  }
};



test['download info not available'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
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
      type: 'blah'
    },
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
      url: `${this.archiveTestHost}/invalid.zip`,
      type: 'zip'
    },
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
  
  try {
    yield mgr.download('Maga');
    throw -1;
  } catch (err) {
    err.message.should.contain(`Error downloading package for Maga`);
  }
};



test['unsupported archive type'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'blah'
    },
    "bin": "maga2",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga2": {
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
  
  try {
    yield mgr.download('Maga2');
    throw -1;
  } catch (err) {
    err.message.should.contain(`Unsupported archive type: blah`);
  }
};





test['custom unpack handler'] = {
  before: function*() {
    const platforms = this.buildPlatformConfig(process.platform, process.arch, {
      download: {
        url: `${this.archiveTestHost}/maga2-good.zip`,
        type: 'invalid'
      },
      "bin": "maga2",
      "commands": {
        "sanity": {
          "args": ['test'],
          "output": [ "good:test" ]
        }
      },               
    });
    
    let mgr = new this.Manager({
      clients: {
        "Maga2": {
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
    
    this.mgr = mgr;
  },
  
  success: function*() {
    let spy = this.mocker.spy(() => Promise.resolve());
    
    yield this.mgr.download('Maga2', {
      unpackHandler: spy
    });    
    
    spy.should.have.been.calledOnce;
    spy.getCall(0).args.length.should.eql(2);
  },
  
  fail: function*() {
    try {
      yield this.mgr.download('Maga2', {
        unpackHandler: () => Promise.reject(new Error('foo!'))
      });        
      throw -1;      
    } catch (err) {
      err.message.should.contain(`foo!`);
    }
  }
};





test['unpacks and verifies ok'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'zip'
    },
    "bin": "maga2",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga2": {
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
  
  let ret = yield mgr.download('Maga2');
  
  const downloadFolder = _get(ret, 'downloadFolder', '');
  _get(ret, 'downloadFile', '').should.eql(path.join(downloadFolder, `archive.zip`));
  _get(ret, 'unpackFolder', '').should.eql(path.join(downloadFolder, `unpacked`));

  _get(ret, 'client.state.available', '').should.be.true;
  _get(ret, 'client.activeCli.fullPath', '').should.eql(path.join(downloadFolder, `unpacked`, 'maga2'));
  
  mgr.clients['Maga2'].should.eql(ret.client);
};



test['unpacked but no binary found'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/no-maga2.tgz`,
      type: 'tar'
    },
    "bin": "maga2",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga2": {
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
  
  let ret = yield mgr.download('Maga2');
  
  _get(ret, 'client.state.available', '').should.be.false;
  _get(ret, 'client.state.failReason', '').should.eql('notFound');
  _get(ret, 'client.activeCli.fullPath', '').should.eql('');
};


test['unpacked but sanity check failed'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-bad.zip`,
      type: 'zip'
    },
    "bin": "maga2",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga2": {
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
  
  let ret = yield mgr.download('Maga2');
  
  _get(ret, 'client.state.available', '').should.be.false;
  _get(ret, 'client.state.failReason', '').should.eql('sanityCheckFail');
  _get(ret, 'client.activeCli.fullPath', '').should.eql('');
};



test['unpacked and rename'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good-rename.zip`,
      type: 'zip',
      bin: 'maga2-special'
    },
    "bin": "maga2",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },               
  });
  
  let mgr = new this.Manager({
    clients: {
      "Maga2": {
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
  
  let ret = yield mgr.download('Maga2');
  
  _get(ret, 'client.state.available', '').should.be.true;
};


test['unpacked updated version and symlinked over old version'] = function*(){
  var downloadOpts = {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'zip',
      bin: 'maga2'
    },
    "bin": "maga3",
    "commands": {
      "sanity": {
        "args": ['test'],
        "output": [ "good:test" ]
      }
    },
  };

  let buildMgrOpts = function(scope, downloadOpts){
    return {
      clients: {
        "Maga2": {
          "platforms": scope.buildPlatformConfig(process.platform, process.arch, downloadOpts),
        }
      }
    }
  };
  
  let mgr = new this.Manager(buildMgrOpts(this, downloadOpts));
  // mgr.logger = console;
  
  yield mgr.init();
  
  let ret = yield mgr.download('Maga2');

  const downloadFolder = _get(ret, 'downloadFolder', '');
  
  _get(ret, 'client.activeCli.fullPath', '').should.eql(path.join(downloadFolder, 'unpacked', 'maga3'));

  // Settings params for 2nd download
  downloadOpts.download = {
    url: `${this.archiveTestHost}/maga2-good-rename.zip`,
    type: 'zip',
    bin: 'maga2-special'
  };

  let mgr2 = new this.Manager(buildMgrOpts(this, downloadOpts));
  // mgr2.logger = console;

  yield mgr2.init();
  
  let ret2 = yield mgr2.download('Maga2', {downloadFolder: path.join(downloadFolder, '..')});

  _get(ret2, 'client.activeCli.fullPath', '').should.eql(path.join(downloadFolder, 'unpacked', 'maga3'));

  // Checking symlink real path
  const realPathBin = fs.realpathSync(_get(ret2, 'client.activeCli.fullPath', ''));
  const realPathUpdatedBin = fs.realpathSync(path.join(downloadFolder, 'unpacked', 'maga2-special'));

  realPathBin.should.eql(realPathUpdatedBin);
}