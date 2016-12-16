"use strict";

const _get = require('lodash.get'),
  fs = require('fs'),
  md5File = require('md5-file'),
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



test['hash sha256 mismatch'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'blah',
      sha256: 'blahblahblah'
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
    err.message.should.contain(`Hash mismatch (using sha256): expected blahblahblah; got e7781ccd95e2db9246dbe8c1deaf9238ab4428a713d08080689834fd68a25652`);
  }
};



test['hash md5 mismatch'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'blah',
      md5: 'blahblahblah'
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
    err.message.should.contain(`Hash mismatch (using md5): expected blahblahblah; got dff641865ffb9b44d53f1f9def74f2e6`);
  }
};



test['url regex mismatch'] = function*() {
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

  try {
    yield mgr.download('Maga2', {
      urlRegex: /blahblah/i
    });
    throw -1;
  } catch (err) {
    err.message.should.contain(`Download URL failed regex check`);
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

  let ret = yield mgr.download('Maga2', {
    urlRegex: /localhost/
  });

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



test['unpacked and set to required name'] = function*() {
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


test['unpacked updated version and copied over old version'] = function*(){
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

  // check that maga3 === maga2-special
  const hash1 = md5File.sync(path.join(downloadFolder, 'unpacked', 'maga3'));
  const hash2 = md5File.sync(path.join(downloadFolder, 'unpacked', 'maga2-special'));

  hash1.should.eql(hash2);
}




test['hash sha256 match'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'zip',
      sha256: 'e7781ccd95e2db9246dbe8c1deaf9238ab4428a713d08080689834fd68a25652'
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

  mgr.clients['Maga2'].should.eql(ret.client);
};




test['hash md5 match'] = function*() {
  const platforms = this.buildPlatformConfig(process.platform, process.arch, {
    download: {
      url: `${this.archiveTestHost}/maga2-good.zip`,
      type: 'zip',
      md5: 'dff641865ffb9b44d53f1f9def74f2e6'
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

  mgr.clients['Maga2'].should.eql(ret.client);
};
