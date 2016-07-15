/*
*	Kontrollogik för DashBoard widget
*
*	Fredrik Johansson 2011-07-17
*
*/

//   if(!document.namespaces.v){ 
//     document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
//     document.createStyleSheet().addRule("v\:shape", "behavior:url(#default#VML);display:inline-block;");
//   }
//       
//   


// constructor för DashBoard
function DashBoard(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
    this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
    this._protocolIdentity = protocolID;
    this._picaxe = picaxeController || picaxe;
    this.nodes = {}; // hållare för dynamiska noder
    this._rightOriented = rightOriented || false;
    this._scale = scale || 1;

    loadTextFile("dashboard_template.htm", function(svg){

        addOnDOMLoad(function(){
            this._parentNode = document.getElementById(parentNodeID);


            // prefixa id i SVGen med vårt unika id
            svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
            this._parentNode.innerHTML = svg;

            var node = this._getNode("dashboardcommon");
            var scale = {x: this._scale, y: this._scale};
            var translate = "";

            if (this._rightOriented){
                var cStyle = window.getComputedStyle(this._parentNode); //node.currentStyle.width;
                var width = cStyle.width;
                var height = cStyle.height;
                width = width.substr(0, width.length - 2); // trimma "pt"
                height = height.substr(0, height.length - 2);
                translate = " translate(" + width + ", 0) "
                scale.x = -scale.x
            }

            node.setAttribute("transform", translate + "scale(" + scale.x + "," + scale.y + ")");

            this.leftBlinker = new Blinker(this, {protocolKeys:["leftBlink","flasher"], beamIds:[], fills:[{id:"leftblinker", colorOff:"#E4FFB2", colorOn:"#00FF0C"}]});
            this.rightBlinker = new Blinker(this, {protocolKeys:["rightBlink","flasher"], beamIds:[], fills:[{id:"rightblinker", colorOff:"#E4FFB2", colorOn:"#00FF0C"}]});
            this.flasher     = new Blinker(this, {protocolKeys:["flasher"], beamIds:[], fills:[{id:"flasher", colorOff: "#ee9758", colorOn:"#f33d0c"}],
                                               clickNodes:["flasher", "flashersymbol"]});
            this.brakeLight = new Light(this, {protocolKeys:["brakeLight"],beamIds:[], fills:[{colorOn: "#FF0000", colorOff:"#FF7D60"}],
                                            clickNodes:["brakelight", "brakelightletter"]});
            this.parkLight = new Light(this, {protocolKeys:["parkLight"], beamIds:[],fills:[{colorOn:"#FFFF9B", colorOff: "#FFF"}],
                                           clickNodes:["parklight", "parklightsymbol"]});
            this.backingLight = new Light(this, {protocolKeys:["backingLight"], beamIds:[], fills:[{colorOn:"#FFFF9B",colorOff:"#FFFFFF"}],
                                              clickNodes:["backinglight", "backinglightletter"],
                                              setValueFunc: function(vlu) { Light.prototype.setState.call(this, vlu == 1); }});// reverse is a 1
            this.highBeamLight = new Light(this, {protocolKeys:["highBeam"], beamIds:[], fills:[{id:"highbeamlight", colorOn: "#00A3FF", colorOff: "#FFFFFF"}],
                                               clickNodes:["highbeamlight", "highbeamlightsymbol"]});
            this.lowBeamLight = new Light(this, {protocolKeys:["lowBeam"], beamIds:[], fills:[{id:"lowbeamlight",colorOn:"#DDFFCD", colorOff:"#FFFFFF"}],
                                              clickNodes:["lowbeamlight", "lowbeamlightsymbol"]});
            this.defroster = new Light(this, {protocolKeys:["defroster"],beamIds:[], fills:[{colorOn: "#FF796B", colorOff:"#7CC4FF"}],
                                           clickNodes:["defroster", "defrostersymbol"]});
            this.safeLight = new Light(this, {protocolKeys:["safeLight"], beamIds:[],fills:[{colorOn:"#FFFF9B", colorOff: "#FFFFFF"}],
                                           clickNodes:["safelight", "safelightletter"]});
            this.horn = new Light(this, {protocolKeys:["beeper"], beamIds:[], fills:[{id:"horn", colorOn:"#FF796B", colorOff:"#7CC4FF"}],
                                      clickNodes:["horn", "hornsymbol"]});
            this.speedMeter = new DashBoardMeter(this, {protocolKeys:['speed'], maxVlu:255, nodePrefix:"speed_",clickNodes:["speed","speed_needle"]});
            this.speedMeter = new DashBoardMeter(this, {protocolKeys:['rpm'], maxVlu:133, nodePrefix:"rpm_",clickNodes:["rpm", "rpm_needle"]}); // 8000rpm actually it's revs per sec to fit within 8bits
            this.slider     = new DashBoardSlider(this);


        }, this);
    }, this);

}
DashBoard.prototype._getNode = function(nodeId){
    return document.getElementById(this._id + nodeId);
}








DashBoardMeter = function(owner, args /*protocolKey, maxVlu, nodePrefix*/) {
    if (!arguments.length) return;

    Widget.call(this, owner, args);

    var me = this;
    me.value = 0;
    me.timer = null;

    me.mask = owner._getNode(me.args.nodePrefix + "mask");
    me.meter_needle =  owner._getNode(me.args.nodePrefix + "needle");

    me.cf = 250 * 2 * Math.PI
    me.degSlice = me.cf / 360;
    me.maxThrow = 270;
    me.maxDash = me.degSlice * me.maxThrow;
    me.needleTransforms = me.meter_needle.style.transform;


    // events från picaxekabeln till denna class
    this.subscribe();
    
}
inheritsFrom(DashBoardMeter, Widget);


DashBoardMeter.prototype.setValue =  function(value) {
    var me = this;
    if (value > me.args.maxVlu)
        value = em.args.maxVlu;
    me.value = value;
    var meterVlu = value * (me.maxThrow / me.args.maxVlu);
    me.mask.setAttribute("stroke-dasharray", (me.maxDash - (meterVlu * me.degSlice)) + "," + me.cf);
    me.meter_needle.style.transform = me.needleTransforms +" rotate(" + meterVlu + "deg)";

}

DashBoardMeter.prototype.setPercent = function(percent){
    var value = percent * (this.args.maxVlu / 100);
    this.setValue(value);
    this.startUpdateTimer();
}

DashBoardMeter.prototype.toggle = function(){
    if (this.owner.slider.attachedMeter == this)
        this.owner.slider.detachMeter(this);
    else {
        this.owner.slider.slider.value = this.value * (100 / this.args.maxVlu);
        this.owner.slider.attachMeter(this);
    }
}

// only sends this update 400ms after last change
// releases stress on the can network Picaxes
DashBoardMeter.prototype.startUpdateTimer = function(){
    if (this.timer)
        clearTimeout(this.timer);
    var me = this;
    this.timer = setTimeout(function(){
        picaxe.sendCommand(me.owner._protocolIdentity, me.args.protocolKeys[0], parseInt(me.value));
        me.timer = null;
    }, 400);
}






DashBoardSlider = function(owner){
    var me = this;
    me.owner = owner;
    me.timer = null;
    me.attachedMeter = null;

    me.slider = document.createElement("input");
    me.slider.setAttribute("type","range");
    me.slider.min = 0;
    me.slider.max = 100;
    with (me.slider.style) {
        width = "350px";
        position = "absolute";
        top = "160px";
        display = "none";
        zIndex = "10";
    }
    var dashSvg = document.getElementById(me.owner._id + "dashboardsvgnode");
    dashSvg.parentNode.insertBefore(me.slider, dashSvg);

    // listen to the drag
    me.slider.addEventListener("input", function(evt){
        setTimer();

        if (me.attachedMeter)
            me.attachedMeter.setPercent(me.slider.value);
    });


    me.attachMeter = function(meter) {
        if (this.timer)
            clearTimeout(this.timer);
        me.attachedMeter = meter;
        me.slider.style.display = "";
        setTimer();
    }

    me.detachMeter = function(meter) {
        if (this.timer)
            clearTimeout(this.timer);
        me.attachdMeter = null;
        me.slider.display = "none";
    }

    function setTimer() {
        if (me.timer)
            clearTimeout(me.timer);
        me.timer = setTimeout(function(){
            me.slider.style.display = "none";
            me.attachedMeter = null;
            me.timer = null;
        }, 4000);
    }
}

