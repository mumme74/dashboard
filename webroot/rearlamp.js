/*
*	Kontrollogik för RearLamp widget
*
*	Fredrik Johansson 2011-07-17
*
*/
  
//   if(!document.namespaces.v){ 
//     document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
//     document.createStyleSheet().addRule("v\:shape", "behavior:url(#default#VML);display:inline-block;");
//   }
      
  
  
  
  // constructor för RearLamp
  function RearLamp(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
    this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
    this._protocolIdentity = protocolID;
    this._picaxe = picaxeController || picaxe;
    this.nodes = {}; // hållare för dynamiska noder
    this._rightOriented = rightOriented || false;
    this._scale = scale || 1;

  
    loadTextFile("rearlamp_template.htm", function(svg){
        //
        addOnDOMLoad(function(){
            this._parentNode = document.getElementById(parentNodeID);


            // prefixa id i VMLen med vårt unika id
            svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
            this._parentNode.innerHTML = svg;

            var node = this._getNode("rearlampcommon");
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


            this.blinker = new Blinker(this);
            this.brakeLight = new Light(this, {protocolKeys:["brakeLight"], fills:[{colorOn:"#FF0000", colorOff:"#FF7D60"}]});
            this.parkLight = new Light(this, {protocolKeys:["parkLight"], fills:[{colorOn:"#FF5D1F", colorOff:"#FF7D60"}]});
            this.backingLight = new Light(this, {protocolKeys:["backingLight"], fills:[{colorOn:"#FFFF9B", colorOff:"#FFFFFF"}],
                                              setValueFunc: function(vlu) { Light.prototype.setState.call(this, vlu == 1); }});// reverse is a 1


            // events från noder till denna class
            //attachOnClick("blinker", this.blinker.toggle);
            //attachOnClick("brakelight", this.brakeLight.toggle);
            //attachOnClick("parklight", this.parkLight.toggle);
            //attachOnClick("backinglight", this.backingLight.toggle);

        }, this);
    }, this);
  
    var _this = this;
    function attachOnClick(nodeId, evtFunc){
      //debug(_this._id + nodeId + evtFunc);
      var node = _this._getNode.call(_this, nodeId);
      node.addEventListener("click", evtFunc);
    }
   
  }
  RearLamp.prototype._getNode = function(nodeId){
    return document.getElementById(this._id + nodeId);
  }
  
 
 
  /*
  
  RearLampBlinker = function(ownerRearLamp){
    var protocolKey = "blinker";
    var state = false;
    var me = this;
    var timestamp = Date.now();
    this.toggle = function (){
      // allow 1s delay to turn it of even if state is unlit
      if (!state && (timestamp + 1000) > Date.now())
          state = true;
      me.setState(!state);
      ownerRearLamp._picaxe.sendCommand(ownerRearLamp._protocolIdentity, protocolKey, state ? 4 : 2);
    }
    this.setState = function(newState){
      if (newState == 2) {
        state = false;
        timestamp -= 1000;
      } else if(newState == 4)
        state = true;
      else
        state = newState;
      ownerRearLamp._getNode("blinklightbeam").style.visibility = state ? "visible" : "hidden";
      ownerRearLamp._getNode("blinker").style.fill = state ? "#FFC321" : "#FFF1B7";
    }
    this.getState = function(){ return state; }
    
    // events från picaxekabeln till denna class
    ownerRearLamp._picaxe.connectTo(ownerRearLamp._protocolIdentity, protocolKey, me.setState, me); 
    ownerRearLamp._picaxe.connectTo(ownerRearLamp._protocolIdentity, "flasher", me.setState, me); 
  }
*/
  
  RearLampBrakeLight = function(ownerRearLamp) {
    var state = false;
    var me = this;
  
    var protocolKey = "brakeLight";
    this.toggle = function(){
    me.setState(!state);
    ownerRearLamp._picaxe.sendCommand(ownerRearLamp._protocolIdentity, protocolKey, Number(state)) ;
  }
  this.setState = function(newState){
    state = newState;
    ownerRearLamp._getNode("brakelightbeam").style.visibility = state ? "visible" : "hidden";
    ownerRearLamp._getNode("brakelight").style.fill = state ? "#FF0000" : "#FF7D60";
  }
  this.getState = function(){ return state; }  
    // events från picaxekabeln till denna class
    ownerRearLamp._picaxe.connectTo(ownerRearLamp._protocolIdentity, protocolKey, me.setState, me);
  }
  
  RearLampParkLight = function(ownerRearLamp) {
    var state = false;
    var me = this;
    var protocolKey = "parkLight";
  
    this.toggle = function(){
      me.setState(!state);
      ownerRearLamp._picaxe.sendCommand(ownerRearLamp._protocolIdentity, protocolKey, Number(state)) ;
    }
    this.setState = function(newState){
      state = newState;
      ownerRearLamp._getNode("parklightbeam").style.visibility = state ? "visible" : "hidden";
      ownerRearLamp._getNode("parklight").style.fill = state ? "#FF5D1F" : "#FF7D60";
    }
    this.getState = function(){ return state; }
  
    // events från picaxekabeln till denna class
    ownerRearLamp._picaxe.connectTo(ownerRearLamp._protocolIdentity, protocolKey, me.setState, me);
  }
  
  RearLampBackingLight = function(ownerRearLamp) {
    var state = false;
    var me = this;
    var protocolKey = "backingLight";
    
    this.toggle = function(){
      me.setState(!state);
      ownerRearLamp._picaxe.sendCommand(ownerRearLamp._protocolIdentity, protocolKey, Number(state)) ;
    }
    this.setState = function(newState){
      state = newState;
      ownerRearLamp._getNode("backinglightbeam").style.visibility = state ? "visible" : "hidden";
      ownerRearLamp._getNode("backinglight").style.fill = state ? "#FFFF9B" : "#FFFFFF";
    }
    this.getState = function(){ return state; }
  
    // events från picaxekabeln till denna class
    ownerRearLamp._picaxe.connectTo(ownerRearLamp._protocolIdentity, protocolKey, me.setState, me);
  }
  
