function Background() {
  this.windows_ = [];
}

Background.prototype.ifShowFrame_ = function() {
  var version = parseInt(navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
  var os = 'other';
  if (navigator.appVersion.indexOf('Linux') != -1) {
    os = 'linux';
  } else if (navigator.appVersion.indexOf('CrOS') != -1) {
    os = 'cros';
  } else if (navigator.appVersion.indexOf('Mac OS X') != -1) {
    os = 'mac';
  }

  return os === 'linux' && version < 27 ||
         os === 'mac' && version < 25;
};

Background.prototype.launch = function(launchData) {
  /*
  var entries = [];
  chrome.storage.local.get('retainedEntryIds', function(data) {
    var retainedEntryIds = data['retainedEntryIds'] || [];
    for (var i = 0; i < retainedEntryIds.length; i++) {
      chrome.fileSystem.restoreEntry(retainedEntryIds[i], function(entry) {
        this.entriesToOpen_.push(entry);
      }.bind(this));
    }
  }.bind(this));

  if (launchData && launchData['items']) {
    for (var i = 0; i < launchData['items'].length; i++) {
      entries.push(launchData['items'][i]['entry']);
    }
  }
  */
  if (this.windows_.length == 0)
    this.newWindow();

  /*
  for (var i = 0; i < entries.length; i++) {
    chrome.fileSystem.getWritableEntry(
        entries[i],
        function(entry) {
          if (this.windows_.length > 0) {
            this.windows_[0].openEntries([entry]);
          } else {
            this.entriesToOpen_.push(entry);
          }
        }.bind(this));
  }
  */
};


Background.prototype.newWindow = function() {
  var appWindowId = 'appWindow' + this.windows_.length;
  var options = {
    id: appWindowId,
    frame: (this.ifShowFrame_() ? 'chrome' : 'none'),
    minWidth: 400,
    minHeight: 400,
    width: 700,
    height: 700
  };

  chrome.app.window.create('index.html', options, function(win) {
    console.log('Window opened:', win);
    win.onClosed.addListener(this.onWindowClosed.bind(this, win));
  }.bind(this));
};

/*

chrome.app.runtime.onLaunched.addListener(function() {
  new BeagleWindow();
});

var BeagleWindow = function() {
  var connectedSerialId = 0;
  chrome.app.window.create(
    'term.html',
    {
      outerBounds: {
        width: 1024,
        height: 768
      }
    },
    function(win) {
      win.contentWindow.AddConnectedSerialId = function(id) {
        connectedSerialId = id;
      };
      win.onClosed.addListener(function() {
        chrome.serial.disconnect(connectedSerialId, function () {
        });
      });
    }
  );
}

*/


var background = new Background();
chrome.app.runtime.onLaunched.addListener(background.launch.bind(background));


/* Exports */
window['background'] = background;
Background.prototype['newWindow'] = Background.prototype.newWindow;