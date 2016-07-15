
/**
  *  owner is the widget controller ie. mirror,
  *  protocolKeys supcribed to this class Array ["blinkerLeft", "flasher"]
  *                 first item is the command that gets send to server
  *  beamIds the DOM ids that should toggle visibility ["node1", "node1"]
  *  fill Ids the DOM ids that should toggle color and the colors  [id:"nodeid",color:["white", "orange"]]
  *  clickNodes = the nodeIds to to attach click events to toggle this widget
  *  new TooglerWidget(this, {protocolKeys:["blinkerLeft", "flasher"], beamIds:["node1", "node1"],
  *                                     [id:"nodeid",colorOff:"white", colorOn:"orange"], ["node1","node2"]});
  */
Widget = function(owner, args) {
    if (!arguments.length) return;
    this.owner = this.owner || owner;
    this.args = args ? args : {};
    this._state = false;
    this._timestamp = Date.now();
    if (!this.args.clickFunc)
        this.args.clickFunc = "toggle";
    if (!this.args.setValueFunc )
        this.args.setValueFunc = this.setValue;
}

Widget.prototype.subscribe = function(){
    if (!this._isSubscribed) {
        var _this = this;

        this._isSubscribed = true;
        // events från picaxekabeln till denna class
        this.args.protocolKeys.forEach(function(key){
            picaxe.connectTo(this.owner._protocolIdentity, key, this.args.setValueFunc, this);
        }, this);


        // attach onclick from DOM
        this.args.clickNodes.forEach(function(item){
            var node = this._getNode((item.id || item).toLowerCase());
            node.style.cursor = "hand";
            node.addEventListener("click", function(evt){
                if (_this.args.clickFunc instanceof Function)
                    _this.args.clickFunc.call(_this, evt);
                else
                    _this[_this.args.clickFunc].call(_this, evt);
            });
            // add tooltip
            node.addEventListener("mouseover", function(evt){
                var txt = "PID:";
                txt += picaxe._getProtocolId(_this.owner._protocolIdentity, _this.args.protocolKeys[0]);
                tooltip.displayAt(evt, txt);
            });
            node.addEventListener("mouseout", function(evt){
                tooltip.hide(evt);
            });
        }, this);
    }
}

Widget.prototype.getState = function(){ return this._state; }


Widget.prototype._getNode = function(nodeId){
    return document.getElementById(this.owner._id + nodeId);
}

Widget.prototype.toggle = function(){
    this.setState(!this._state);
    picaxe.sendCommand(this.owner._protocolIdentity, this.args.protocolKeys[0], Number(this._state)) ;
}

Widget.prototype.setState = function(newState){
    this._state = newState;
    this.render();
}
Widget.prototype.setValue = Widget.prototype.setState; // make alias


Widget.prototype.render = function() {
    this.args.fills.forEach(function(item){
        try {
            this.owner._getNode(item.id).style.fill = this._state ? item.colorOn : item.colorOff;
        } catch(e) {
            throw "cant find " + item.id + " in " + this.getName();
        }
    }, this);
}

Widget.prototype.getName = function() {
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((this).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};





Light = function(owner, args) {
    if (!arguments.length) return; // inheritance setup
    this.args = args ? args : {};

    if (!this.args.beamIds)
        this.args.beamIds = [ this.args.protocolKeys[0].toLowerCase() + "beam"];
    if (!this.args.fills)
        this.args.fills = [{id:this.args.protocolKeys[0].toLowerCase(), color:[ "#FFF", "#FFFFE0"]}];
    if (!this.args.fills[0].id)
        this.args.fills[0].id = this.args.protocolKeys[0].toLowerCase();
    if (!this.args.clickNodes)
        this.args.clickNodes = this.args.fills;

    if (!this.args.setValueFunc)
        this.args.setValueFunc = this.setState;
    Widget.call(this, owner, this.args);
    this.subscribe();

}
inheritsFrom(Light, Widget);

Light.prototype.setState = function(newState) {
    Widget.prototype.setState.call(this, newState);

    this.args.beamIds.forEach(function(id){
        try {
            this.owner._getNode(id).style.visibility = this._state ? "visible" : "hidden";
        } catch(e) {
            throw "cant find "+ id + " in " + this.getName();
        }
    }, this);
}



Blinker = function(owner, args){
    if (!arguments.length) return; // inheritance setup
    //    this._state = false;
    //    this.owner = owner;
    this.args = args ? args : {};

    if (!this.args.protocolKeys)
        this.args.protocolKeys = ["blinker", "flasher"];
    if (!this.args.beamIds)
        this.args.beamIds = ["blinklightbeam"];
    if (!this.args.fills)
        this.args.fills = [{id:"blinker", colorOff:"#FFF1B7", colorOn:"#FFC321"}];

    this.args.setValueFunc = this.setValue;
    Light.call(this, owner, this.args); // call baseclass

    this.subscribe();
}
inheritsFrom(Blinker, Light);
//Blinker.prototype = new Widget();
//Blinker.prototype.constructor = Blinker;

Blinker.prototype.toggle = function (evt){
    // allow 1s delay to turn it of even if state is unlit
    if ((this._timestamp + 1000) > Date.now())
        this._state = !this._state;
    this.setState(!this._state);
    this.owner._picaxe.sendCommand(this.owner._protocolIdentity, this.args.protocolKeys[0], this._state ? 4 : 2);
}

Blinker.prototype.setState = function(newState){
    this._timestamp = Date.now();
    if (newState == 2) {
        this._state = false;
        this._timestamp -= 1000;
    } else if(newState == 4)
        this._state = true;
    else
        this._state = newState;

    this.render.call(this);
}



Toggler = function(owner, args) {
    if (!arguments.length) return; // inheritance setup
    this.args = args ? args : {};

    if (!this.args.beamIds)
        this.args.beamIds = [];
    if (!this.args.fills)
        this.args.fills = [];
    if (!this.args.clickNodes)
        this.args.clickNodes = this.args.fills.length ? this.args.fills : this.args.beamIds;

    this.args.setValueFunc = this.setState;

    Widget.call(this, owner, this.args);
    this.subscribe();

}
inheritsFrom(Toggler, Widget);



TogglerBeam = function(owner, args) {
    if (!arguments.length) return; // inheritance setup
    this.args = args ? args : {};

    if (!this.args.beamIds)
        this.args.beamIds = [ this.args.protocolKeys[0].toLowerCase() + "beam"];
    if (!this.args.fills)
        this.args.fills = [];
    if (!this.args.clickNodes)
        this.args.clickNodes = this.args.fills.length ? this.args.fills : this.args.beamIds;

    this.args.setValueFunc = this.setState;

    Toggler.call(this, owner, this.args);
    this.subscribe();

}
inheritsFrom(TogglerBeam, Toggler);

TogglerBeam.prototype.setState = function(newState) {
    Widget.prototype.setState.call(this, newState);

    this.args.beamIds.forEach(function(id){
        try {
            this.owner._getNode(id).style.visibility = this._state ? "visible" : "hidden";
        } catch(e) {
            throw "cant find "+ id + " in " + this.getName();
        }
    }, this);
}


ValueWgt = function(owner, args) {
    if (!arguments.length) return; // inheritance setup
    this.args = args ? args : {};
    this._value = 0;

    if (!this.args.beamIds)
        this.args.beamIds = [];
    if (!this.args.fills)
        this.args.fills = [];

    this.args.setValueFunc = this.setValue;

    Widget.call(this, owner, this.args);
    this.subscribe();

}
inheritsFrom(ValueWgt, Widget);

ValueWgt.prototype.setValue = function(newValue) {
    this._value = newValue;
    this.render();
}

ValueWgt.prototype.getValue = function(newValue) {
    return this._value;
}






// a global not be created elsewhere
Tooltip = function() {
    var timers = {tim:null, int: null, i:0};
    var _this = this;

    var node = document.createElement("span");
    with (node.style) {
        //display = "none";
        opacity = 0;
        padding = "5px";
        backgroundColor = "beige";
        border = "1px solid blue";
        borderRadius = "5px";
        position = "fixed";
        left = 0;
        top = 0;
        zOrder = 1000;
    }

    function startFadeOut(){
        timers.tim = setTimeout(function(){
            timers.tim = null;
            timers.i = 1.0;
            _this.hide();
        },6000);
    }
    this.hide = function(){
        clearTimers();
        timers.int = setInterval(function(){
            timers.i -= 0.05;
            node.style.opacity = timers.i.toFixed(2);
            if (timers.i <= 0)
                clearTimers();
        }, 30);
    }

    function fadeIn(){
        timers.i = 0;
        timers.tim = setTimeout(function(){
            timers.int = setInterval(function(){
                timers.i += 0.05
                node.style.opacity = timers.i.toFixed(2);
                if (timers.i >= 1.0) {
                    clearTimers();
                    startFadeOut();
                }
            }, 30);
        }, 1000);
    }


    function clearTimers(){
        if (timers.tim) {
            clearTimeout(timers.tim);
            timers.tim = null;
        }
        if (timers.int) {
            clearInterval(timers.int);
            timers.int = null;
        }
    }


    node.text = "";
    addOnDOMLoad(function(){
        document.querySelector("body").appendChild(node);
    }, this);

    this.displayAt = function(evt, text) {
        clearTimers();
        node.textContent = text;
        with (node.style){
            opacity = 0;
            left = (evt.clientX + 15) + "px";
            top = (evt.clientY - 15) + "px";
        }
        fadeIn();
    }
}
tooltip = new Tooltip;


