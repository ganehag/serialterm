var ab2str = function(buf) {
  var bufView = new Uint8Array(buf);
  var unis = [];
  for (var i=0; i<bufView.length; i++) {
    unis.push(bufView[i]);
  }
  return String.fromCharCode.apply(null, unis);
};

var str2ab = function(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var Application = function(argv) {
    this.argv = argv;
    this.io = null;
    this.keyboard_ = null;
    this.connectionId = null;
    this.portInfo_ = null;

    this.PORT_KEY = 'port';
    this.BITRATE_KEY = 'bitrate';
    this.DATABITS_KEY = 'dataBits';
    this.PARITY_KEY = 'parityBit';
    this.STOPBITS_KEY = 'stopBits';
}

Application.prototype.sendString_ = function(fromKeyboard, string) {
    if(this.isConnected()) {
        chrome.serial.send(this.connectionId, str2ab(string), function () { });    
    }
};

Application.prototype.isConnected = function() {
    return this.connectionId !== null;
};

Application.prototype.exit = function(code) {
};

Application.prototype.disconnect = function(callback) {
    var self = this;
    chrome.serial.disconnect(this.connectionId, function(result) {
        document.getElementById('app-connect').innerHTML = '<span class="glyphicon glyphicon-flash text-info"></span> Disconnected';
        self.connectionId = null;
        callback();
    });
};

Application.prototype.reconnect = function() {
    var self = this;
    Application.prototype.disconnect.call(self, function() {
        Application.prototype.connect.call(self);    
    });
};

Application.prototype.getSelectedOptions = function() {
    var e1 = document.getElementById('port-picker'),
        e2 = document.getElementById('baudrate-picker'),
        e3 = document.getElementById('databits-picker'),
        e4 = document.getElementById('parity-picker'),
        e5 = document.getElementById('stopbits-picker'),
        port = e1.options[e1.selectedIndex].value,
        baudrate = parseInt(e2.options[e2.selectedIndex].value),
        dataBits = e3.options[e3.selectedIndex].value,
        parityBit = e4.options[e4.selectedIndex].value,
        stopBits = e5.options[e5.selectedIndex].value,
        opts = {};
        opts[this.PORT_KEY] = port;
        opts[this.BITRATE_KEY] = baudrate;
        opts[this.DATABITS_KEY] = dataBits;
        opts[this.PARITY_KEY] = parityBit;
        opts[this.STOPBITS_KEY] = stopBits;
    return opts;
};

Application.prototype.connect = function() {
    var self = this
        opts = Application.prototype.getSelectedOptions.call(this),
        port = opts.port;

    delete opts.port;

    if(this.connectionId === null) {
        chrome.serial.connect(port, opts, function(info) {
            document.getElementById('app-connect').innerHTML = '<span class="glyphicon glyphicon-flash text-warning"></span> Connected';
            self.connectionId = info.connectionId;
        });
    }
}

Application.prototype.getSerialDevices = function() {
    document.getElementById('port-picker').innerHTML = "";

    chrome.serial.getDevices(function(ports) {
        var eligiblePorts = ports;

        if (eligiblePorts.length > 0) {
            eligiblePorts.forEach(function(portObj) {
                var portPicker = document.getElementById('port-picker');
                portPicker.innerHTML = portPicker.innerHTML + '<option value="' + portObj.path +'">' + portObj.displayName + ' (' + portObj.path + ')</option>';
            });
        }
    });
};

Application.prototype.loadOptions = function() {
    var self = this;

    chrome.storage.sync.get(self.BITRATE_KEY, function(result) {
        if (result.hasOwnProperty(self.BITRATE_KEY) !== undefined) {
            document.querySelector('#baudrate-picker').value = result[self.BITRATE_KEY];
        } else {
            document.querySelector('#baudrate-picker').value = "115200";
        }
    });

    chrome.storage.sync.get(self.DATABITS_KEY, function(result) {
        if (result.hasOwnProperty(self.DATABITS_KEY) !== undefined) {
            document.querySelector('#databits-picker').value = result[self.DATABITS_KEY];
        } else {
            document.querySelector('#databits-picker').value = "eight";
        }
    });

    chrome.storage.sync.get(self.PARITY_KEY, function(result) {
        if (result.hasOwnProperty(self.PARITY_KEY) !== undefined) {
            document.querySelector('#parity-picker').value = result[self.PARITY_KEY];
        } else {
            document.querySelector('#parity-picker').value = "no";
        }
    });

    chrome.storage.sync.get(self.STOPBITS_KEY, function(result) {
        if (result.hasOwnProperty(self.STOPBITS_KEY) !== undefined) {
            document.querySelector('#stopbits-picker').value = result[self.STOPBITS_KEY];
        } else {
            
            document.querySelector('#stopbits-picker').value = "one";
        }
    });
};

Application.prototype.saveOptions = function() {
    var opts = Application.prototype.getSelectedOptions.call(this);
    chrome.storage.sync.set(opts);
}

Application.prototype.run = function() {
    var self = this;

    this.io = this.argv.io.push();

    this.io.onVTKeystroke = this.sendString_.bind(this, true /* fromKeyboard */);
    this.io.sendString = this.sendString_.bind(this, false /* fromKeyboard */);

    chrome.serial.onReceive.addListener(function(info) {
        if (info && info.data) {
            self.io.print(ab2str(info.data));
        }
    });

    chrome.serial.onReceiveError.addListener(function (e) {
        /*
            Check and handle more error codes here!
        */

        switch(e.error) {
            case 'break':
                Application.prototype.reconnect.call(self);
            break;
        }
    });

    Application.prototype.getSerialDevices.call(self);
    Application.prototype.loadOptions.call(self);

    document.getElementById('app-menu').onclick = function() {
        if(document.getElementById("app-sidemenu").className) {
            if(self.connectionId !== null) {
                var opts = Application.prototype.getSelectedOptions.call(self);
                delete opts.port;
                chrome.serial.update(self.connectionId, opts, function() {
                    // 
                });
            }

            document.getElementById("app-sidemenu").className = "";
        } else {
            document.getElementById("app-sidemenu").className = "active";
            Application.prototype.getSerialDevices.call(self);
        }
    };

    document.getElementById('app-connect').onclick = function() {
        Application.prototype.saveOptions.call(self);

        if(Application.prototype.isConnected.call(self)) {
            Application.prototype.disconnect.call(self);
        } else {
            Application.prototype.connect.call(self);
        }
    };
};

window.onload = function() {
    hterm.defaultStorage = new lib.Storage.Chrome(chrome.storage.sync);

    var term = new hterm.Terminal("opt_serial_term");
    var div = document.getElementById('terminal')
    term.decorate(div);
    div.focus();

    term.onTerminalReady = function() {
        term.runCommandClass(Application, document.location.hash.substr(1));
        return true;
    };

    document.getElementById('window-close').onclick = function() {
        window.close();
    };

    document.getElementById('window-minimize').onclick = function() {
        window.chrome.app.window.current().minimize();
    };

    document.getElementById('window-maximize').onclick = function() {
        var maximized = window.chrome.app.window.current().isMaximized();

        if (maximized) {
            window.chrome.app.window.current().restore();
        } else {
            window.chrome.app.window.current().maximize();
        }
    };
};
