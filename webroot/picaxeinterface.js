/*
*	Denna fil hanterar interfacet mellan picaxe och en html5 sida.
*
*	author Fredrik Johansson
*/

var WS_PORT = 8080;
var WS_URL = location.hostname; //"localhost";
var picaxe = {};
(function(){

    window.addEventListener("load", function() {
        addOnLoad.documentIsLoaded = true;
        while (addOnLoad._queuedFuncs.length){
            addOnLoad._queuedFuncs.pop().call(window);
        }
    }, true);



    // kör function när sidan laddat eller direkt ifall den redan är laddad.
    function addOnLoad(func){
        if (addOnLoad.documentIsLoaded) {
            func.call(window);
        } else {
            addOnLoad._queuedFuncs.push(func);
        }
    }
    addOnLoad.documentIsLoaded = false;
    addOnLoad._queuedFuncs = [];

    var webSocket = {
        _socket: null,
        _queue: [],
        _queueId: 0,
        _sendIndexes: [],
        init: function(){
            if (this._socket && this._socket.readyState >= 1) {
                // if opened, close
                this._socket.close();
            }
            this._socket = new WebSocket("ws://" + WS_URL + ":" + WS_PORT);
            this._socket.onopen = function(evt) {
                addOnDOMLoad(function(){
                    var node = document.getElementById("serverConnected");
                    node.setAttribute("webConnected", true);
                    node.title = "WebSocket connected but no CAN interface"
                    //debug("connected:" + evt);

                    webSocket._sendNext();
                });
            };
            this._socket.onclose = function(evt) {
                var node = document.getElementById("serverConnected");
                node.removeAttribute("webConnected");
                node.title = "Websocket unconnected";
                //debug("disconnected:" + evt);
            };
            this._socket.onmessage = webSocket._recieved;
            this._socket.onerror = function(evt) {
                debug("error:" + evt);
            };
        },
        _sendNext: function(){
            // send any stored _sendCmds
            if (webSocket._sendIndexes.length) {
                webSocket._socket.send(webSocket._queue[webSocket._sendIndexes.shift()].cmd);
            }
        },
        // sends to webserver, calls calback with result when ite recieves
        send: function(send, callback, args, type){
            if (!type)
                type = "cmd"; // assume push command
            var jsonObj = {"id":++webSocket._queueId};
            jsonObj[type] = send;
            if (args)
                jsonObj['args'] = args
            var jsonStr = JSON.stringify(jsonObj);
            webSocket._queue[webSocket._queueId] = {cmd:jsonStr, callback: callback};
            webSocket._sendIndexes.push(webSocket._queueId);
            if (webSocket._socket.readyState == 1 && webSocket._sendIndexes.length == 1){
                // send the call imidiatly as it is already connected and we only have this cmmd stored in queue
                webSocket._sendNext();
            }
        },
        // calls the correct callback based on the callId returend from websocket server
        _recieved: function(evt){
            var resp = JSON.parse(evt.data);
            if (resp.id in webSocket._queue &&
                    webSocket._queue[resp.id].callback)
            {
                var callb = webSocket._queue[resp.id].callback;
                if (callb){
                    webSocket._queue.splice(resp.id, 1);
                    callb.call(window, resp.data);
                }
            } else {
                // its a async message from a board event
                picaxe._recievedEvent(resp);
            }
            webSocket._sendNext();
        }
    }
    webSocket.init();

    picaxe = {
        cleanResponse: true,
        EOFChar: picaxeSettings.EOFChar || "\n",
        _protocol: picaxeSettings.protocolFile || null,
        _widgetEvents: {},
        portSettings: {
            port: 0,
            baudrate: 9600,
            xonxoff: false,
            timeout: 0.025
        },

        init: function(){
            // ladda protokoll
            if (picaxe._protocol !== null) {
                var _this = this;
                loadTextFile(picaxe._protocol, function(protocol){
                    try {
                        eval("var protocolEvaled = " + protocol + ";");
                    } catch (e) {
                        alert("Protokollfilen har fel i sig, den gick ej att tolka\r\n\r\n" + e.description);
                    }
                    this._protocol = protocolEvaled;

                    picaxe._ready = true;

                    picaxe._onReadyCallbacks.forEach(function(obj){
                        obj.cb.callback.call(obj.sc || _this);
                    }, _this);
                    picaxe._onReadyCallbacks = [];

                }, _this);

                picaxe._ready = false;
            }

            addOnLoad(function(){
                picaxe.log.setLogRootNode(picaxeSettings.logRootNode);
            });

        },
        _onReadyCallbacks: [],

        // is called when picaxe obj is loaded and ready, not when DOM is ready
        addOnReady: function(callback, scope){
            if (!picaxe._ready) {
                picaxe._onReadyCallbacks.push({cb: callback, sc:scope});
            } else {
                callback.call(this);
            }
        },

        updateInput: function(pinNumber, callback, inputType) {
            var cmd = "i" + pinNumber + inputType;

            this.talkToPicaxe(cmd, function(response){
                if (response.length > 0) { // filtrera bort skräp dvs 7=10mV$> blir 10mV
                    if (response.substr(2,1) == "=") { // filtrera bort [pinnummer]=
                        response = response.substr(3);
                    }

                    if (response.substr(response.length - 6, 6) == "\r\n$>\r\n") { // filtrera bort prompten $>
                        response = response.substr(0, response.length - 4);
                    }

                    response = response.replace("\\r\\n", "");
                }

                callback(response);
            });
        },

        updateOutput: function(pinNumber, callback, outputType, valueStr) {
            if (valueStr === "") {
                valueStr = 0;
            }
            var cmd = "u" + pinNumber + outputType;

            // konvertera till ASCII nummer (ascii char 0 -> till bokstaven som motsvarar 0 = null)
            var value = String.fromCharCode(parseInt(valueStr));
            if (outputType == "d") {
                value = valueStr; // digital output is either 1 or 0, can't handle 0-255
            }

            return this.talkToPicaxe(cmd, callback, valueStr, value);
        },

        talkToPicaxe: function(cmd, callback, valueStr, value){
            this.log.newRow();
            this.log.sent(cmd);

            webSocket.send(cmd, function(response){// skriv kommando, hantera svaret asynkront
                if (!picaxe.cleanResponse || response.substr(response.length - 2) == "\r\n" || response.substr(response.length - 2) == "$>") {
                    // om svaret är ett frågetecken så vill picaxe ha ett värde
                    if (response.substr(response.length - 3, 1) == "?") {
                        // log
                        picaxe.log.received(response);
                        picaxe.log.sent(valueStr);
                        webSocket.send(valueStr, function(response){
                            picaxe.log.received(response);
                            callback(response);
                        });

                    } else {
                        if (picaxe.cleanResponse) {
                            response = response.replace(/[\r\n]/g, "");
                            response = response.substr(0, response.length -2);
                        }

                        // log the response
                        picaxe.log.received(response);

                        callback(response);
                    }
                }
            });
        },

        commandToPicaxe: function(cmd){
            addOnDOMLoad(function(){
                this.log.newRow();
                this.log.sent(cmd);

                webSocket.send(cmd);
            }, this);
        },
        _pidStore:{}, // a local copy of pids

        // sätter upp ett event system som lystnar efter meddelanden
        // ie: picaxe.connectTo("safeLight", this.setLight, this)
        connectTo: function(protocolId, evtStr, callback, scope){
            addOnDOMLoad(function(){
                var cls = this._protocol[protocolId];
                if (!cls) {
                    debug(protocolId + " finns inte som huvudklass i protokollet");
                    return;
                }
                var evt = cls[evtStr];
                if (!evt) {
                    debug(evtStr + " finns inte med bland " + protocolId + " i protokollet");
                    return;
                }

                if (!this._widgetEvents[evt]) {
                    this._widgetEvents[evt] = [];
                }
                this._widgetEvents[evt].push({'callback': callback, 'scope': scope});

                // we already have gotten pushed this pid data, notify widget
                if (evt in this._pidStore) {
                    callback.call(scope || window, this._pidStore[evt]);
                }
            }, this);
        },

        _eventListeners: [],
        _recievedSingleData: function(respObj) {
            picaxe.log.received(respObj.data);
            for(var i = 0; i < this._eventListeners.length; ++i){
                this._eventListeners[i](respObj.data || respObj);
            }

            // send to our widgets that are listening
            var data = respObj.data || respObj;
            var value;

            if (!isNaN(data.vlu)){
                value = Number(data.vlu);
            }

            // sync our local pid store
            this._pidStore[data.pid] = value;

            // skicka till våra eventsListeners
            if (this._widgetEvents && this._widgetEvents[data.pid]) {
                var listeners = this._widgetEvents[data.pid];
                for (var i = 0; i < listeners.length; i++){
                    var obj = listeners[i];
                    obj.callback.call((obj.scope || window), value);
                }
            }
        },

        _recievedEvent: function(respObj){
            // log the response
            if ('data' in respObj) {
                picaxe._recievedSingleData(respObj);
            } else if ('push' in respObj) {
                if (respObj.push.constructor === Array) {
                    respObj.push.forEach(function(dataObj){
                        picaxe._recievedSingleData(dataObj);
                    });
                }
            }

            if ('CAN_connected' in respObj) {
                addOnDOMLoad(function(){
                    var node = document.querySelector("#serverConnected");
                    if (node) {
                        var hasAttr = node.hasAttribute('CAN_connected')
                        if (respObj['CAN_connected'] && !hasAttr) {
                            node.setAttribute('CAN_connected', 'true');
                            node.title = "Websocket connected and CAN interface working"
                        } else if (hasAttr) {
                            node.removeAttribute('CAN_connected');
                            node.title = "Websocket connected but no CAN interface"
                        }
                    }
                });
            }
        },

        addRecieveListener: function(func){
            this._eventListeners.push(func);
        },
        // använd när du vill trycka genom protokollet
        sendCommand: function(protocolId, cmd, value){
            picaxe.addOnReady(function(){
                // we must have gotten the protocol loaded first
                var sendPid = this._getProtocolId(protocolId, cmd);
                if (!sendPid)
                    return;
                value = value === undefined ? "" : value;
                var sendObj = {"pid": sendPid, "vlu": value};

                this.log.newRow();
                this.log.sent(sendObj);
                webSocket.send(sendObj);
            }, this);
        },
        // använd när du vill hämta från genom protokollet
        requestPid: function(protocolId, cmd, value) {
            picaxe.addOnReady(function(){
                var sendPid = this._getProtocolId(protocolId, cmd);
                if (!sendPid)
                    return;
                this.log.newRow();
                this.log.sent("get:" + sendPid);

                webSocket.send(sendPid, null, null, "get");
            }, this);

        },
        _getProtocolId: function(protocolId, cmd) {

            var mainClass = this._protocol[protocolId];
            if (!mainClass) {
                debug(protocolId + " finns inte som huvudklass i protokollet");
                return;
            }
            var sendPid = mainClass[cmd];
            if (!sendPid){
                debug(cmd + " finns inte med protokollet för " + protocolId);
                return;
            }
            return sendPid;
        },

        /* loadProtocol: function(protocolFile){
      var protocol = loadTextFile(protocolFile);

      try {
        eval("var protocolEvaled = " + protocol + ";");
      } catch (e) {
        alert("Protokollfilen har fel i sig, den gick ej att tolka\r\n\r\n" + e.description);
      }
      this._protocol = protocolEvaled;
    },*/

        log: {
            _logNode: null,
            _active: false,
            _sentTd: null,
            _receivedTd: null,
            _logTr: null,
            newRow: function(){
                if (!this._active) return;
                var tr = document.createElement("tr");
                this._sentTd = document.createElement("td");
                this._recievedTd = document.createElement("td");
                tr.appendChild(this._sentTd);
                tr.appendChild(this._recievedTd);

                if (!this._logTr) {
                    this._logNode.appendChild(tr);
                } else {
                    this._logNode.insertBefore(tr, this._logTr);
                }

                this._logTr = tr;

                // lagra endast 150 rader bakåt
                if (this._logNode.childNodes.length > 150) {
                    this._logNode.removeChild(this._logNode.lastChild);
                }
            },
            sent: function(text) {
                if (!this._active) return;
                if (typeof text != 'string')
                    text = text.pid + text.vlu
                if (!this._sentTd) this.newRow();
                var date = new Date();
                this._sentTd.innerHTML = "tid:" + date.getHours() + ":" + date.getMinutes() + ":" +
                     date.getSeconds()+ ":" + date.getMilliseconds() + ", <b>" +
                     text.replace(/\n/g, "\\r\\n").replace(/\r/g, "\\r") + "</b><br/>\r\n" +
                     this._sentTd.innerHTML;
            },
            received: function(text) {
                if (!this._active) return;
                if (typeof text != 'string')
                    text = text.pid + text.vlu
                if (!this._receivedTd) this.newRow();
                var date = new Date();
                this._recievedTd.innerHTML = "tid:" + date.getHours() + ":" + date.getMinutes() + ":" +
                     date.getSeconds()+ ":" + date.getMilliseconds() + ", <b>" +
                     text.replace(/\n/g, "\\n").replace(/\r/g, "\\r") + "</b><br/>\n" +
                     this._recievedTd.innerHTML;
            },
            setActive: function(active) {
                var _this = this;
                addOnLoad(function(){
                    if (_this._logNode) {
                        _this._active = active;
                    }
                });

                if (active && !this._active) {
                    this._pendingActive = true;
                } else {
                    this._pendingActive = null;
                }
            },
            setLogRootNode: function(node) {
                var _this = this;
                function createTable(root) {
                    root.innerHTML = "<table width=\"100%\" border=\"1\">\n\r" +
                            " <thead>\n\r"+
                            "	<tr>\n\r"+
                            "     <td>Skickat</td>\n\r"+
                            "     <td>Mottaget</td>\n\r"+
                            "   </tr>\n\r" +
                            " </thead>\n\r"+
                            " <tbody id=\"picaxe.logTBody\">\n\r"+
                            " </tbody>\n\r"+
                            "</table>";
                }

                if (typeof node == 'string') {
                    // id på noden
                    addOnLoad(function(){
                        var n = document.getElementById(node);
                        createTable(n);
                        _this._logNode = document.getElementById("picaxe.logTBody");
                        if (_this._logNode && _this._pendingActive) {
                            _this.setActive(true);
                        }
                    });
                } else {
                    // noderef
                    createTable(node);
                    this._logNode = document.getElementById("picaxe.logTBody");
                }
            }
        }
    };

    picaxe.init();
})();
