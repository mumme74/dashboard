/*
*	Kontrollogik för Mirror widget
*
*	Fredrik Johansson 2011-07-17
*
*/
  
//   if(!document.namespaces.v){ 
//     document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
//     document.createStyleSheet().addRule("v\:shape", "behavior:url(#default#VML);display:inline-block;");
//   }
      
  // håller reda på vilken av speglarna som ska ta emot data
  var mirrorGovenor = {
    _registeredMirrors: [],
    _selectedMirror: "",
    keyPressed: function(evt){
      var mirror;
      for(var i = 0;i < mirrorGovenor._registeredMirrors.length; ++i){
        mirror = mirrorGovenor._registeredMirrors[i];
        if (mirror == mirrorGovenor._selectedMirror){
          mirror.keyPressed(evt);
          break;
        }
      }
    },
    register:function(newMirror){
      var mirror;
      for(var i = 0;i < this._registeredMirrors.length; ++i){
        mirror = this._registeredMirrors[i];
        if (mirror == newMirror){
          debug("already registered");
          return;
        }
      }
      
      this._registeredMirrors.push(newMirror);
    },
    setSelected: function(mirror){
      this._selectedMirror = mirror;
    }
  }
  addOnLoad(function(){
    document.body.addEventListener("keydown", mirrorGovenor.keyPressed);
  });
  
  
  
  // constructor för Mirror
  function Mirror(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
    this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
    this._protocolIdentity = protocolID;
    this._picaxe = picaxeController || picaxe;
    this._foldTimeout = {}; // object för closure lås
    this.nodes = {}; // hållare för dynamiska noder
    this._rightOriented = rightOriented || false;
    this._scale = scale || 1;
    this._onLoadQueue = [];
    this._ready = false;
  
    mirrorGovenor.register(this);

    loadTextFile("mirror_template.htm", function(svg){

        //
        addOnDOMLoad(function(){
            this._parentNode = document.getElementById(parentNodeID);


            // prefixa id i SVGen med vårt unika id
            svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
            this._parentNode.innerHTML = svg;


            var node = this._getNode("mirrorcommon");
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
                //style="top:0;left:0;width:350px;height:300px; transform-origin: 205px 0px ;transform: scale(-0.6, 0.6)"

                // find all textnodes and reverse mirror
                var txts = node.querySelectorAll('text');
                for(var i = 0; i < txts.length; ++i){
                    var width = window.getComputedStyle(txts[i]).width;
                    width = width.substr(0, width.length -2);
                    txts[i].setAttribute("transform", "scale(-1,1) translate(-" + width + ",0)");
                    txts[i].setAttribute("x", "-" + txts[i].getAttribute("x"));
                };

                node.style.transformOrigin = "205px 0px";
            }

            node.style.transform += "scale(" + scale.x + ", " + scale.y + ")"

            this.blinker = new Blinker(this, {beamIds:["blinklightbeam"],
                                              fills:[{id:"blinksymbolfield1", colorOff:"white", colorOn:"#FFC321"}],
                                               clickNodes:["blinker","blinksymbol"]});
            this.heater = new Light(this, {protocolKeys:["defroster"],
                                              beamIds:[],fills:[{id:"heatsymbol", colorOn:"#FF796B", colorOff:"#7CC4FF"}],
                                                clickNodes:["heatsymbol", "heatwaves"]});
            this.safeLight = new Light(this, {protocolKeys:["safeLight"],
                                               fills:[{id:"safelightsymbolfield1",colorOn:"#FFFFC1", colorOff:"white"},
                                                      {id:"safelightsymbolfield2",colorOn:"#FFFFC1", colorOff:"white"}],
                                               clickNodes:["safelightsymbol"]});
            this.mirrorFolder = new MirrorFolder(this);
            this.positionX = new MirrorPosition(this, {protocolKeys:["moveX", "Xpos", "cancel"], clickNodes:["left_arrow", "right_arrow"]});
            this.positionY = new MirrorPosition(this, {protocolKeys:["moveY", "Ypos", "cancel"], clickNodes:["up_arrow", "down_arrow"]});
            this.thermometer = new MirrorThermometer(this);

            // events från noder till denna class
            // attachOnClick("blinker", this.blinker.toggle);
            //attachOnClick("safelight", this.safeLight.toggle);
            // attachOnClick("blinksymbol", this.blinker.toggle);
           // attachOnClick("heatsymbol", this.heater.toggle);
            //attachOnClick("heatwaves", this.heater.toggle);
            //attachOnClick("safelightsymbol", this.safeLight.toggle);
            //attachOnClick("foldarrow", this.mirrorFolder.toggle);
            //attachOnClick("up_arrow", this.position.up);
            if (this._rightOriented){
                //attachOnClick("left_arrow", this.position.right);
                //attachOnClick("right_arrow", this.position.left);
            } else {
                //attachOnClick("left_arrow", this.position.left);
                //attachOnClick("right_arrow", this.position.right);
            }
            //attachOnClick("down_arrow", this.position.down);
            //attachOnClick("thermometer", this.thermometer.update);
            attachOnClick("thermometerupdate", this.thermometer.toggleAutoUpdate);
            attachOnClick("thermometerupdatetext", this.thermometer.toggleAutoUpdate);

            this._ready = true;
            this._onLoadQueue.forEach(function(cb){ cb();});
            this._onLoadQueue = [];

        }, this);

    }, this);


    
    var _this = this;
    function attachOnClick(nodeId, evtFunc){
      //debug(_this._id + nodeId + evtFunc);
      var node = _this._getNode.call(_this, nodeId);
      node.addEventListener("click", evtFunc);
    }
  }

  Mirror.prototype.addOnLoad = function(cb){
      if (this._ready) {
          cb();
      } else {
          this._onLoadQueue.push(cb);
      }
  }

  Mirror.prototype._getNode = function(nodeId){
    return document.getElementById(this._id + nodeId);
  }

  Mirror.prototype.update = function(){
    var _this = this;
    this.addOnLoad(function(){
      // updatera värdet på positionspilarna när vi laddar sidan
      _this.positionX.update();
      _this.positionY.update();
      _this.thermometer.update();

    });
  }
  
  Mirror.prototype.keyPressed = function(evt){
    switch(evt.keyCode){
    case 32: // mellanslag
            // avbryt rörelsen
      this.positionX.cancelMove();
      this.positionY.cancelMove();
      break;
    case 37: // pil vänster
      this.positionX.inc();
      break;
    case 38: // pil upp
      this.positionY.inc();
      break;
    case 39: // pil höger
      this.positionX.dec(true);
      break;
    case 40: // pil ned
      this.positionY.dec(true);
      break;
    default:
      return;
    }
    // hindra sidan från att scrolla
    evt.cancelBubble = true;
    evt.stopPropagation();
    evt.returnValue = false;
    evt.preventDefault();
  }
 
  
  /*
  
  // hjälpclasser
  MirrorPosition = function(ownerMirror){
    var x = 127; // hälften av 255
    var y = 127;
  
    var maxValue = 235;
    var minValue = 20;

    ["up", "down", "left", "right"].forEach(function(id){
        var node = ownerMirror._getNode(id + "_arrow");
        node.style.transform += " scale(1,1)";
    }, this);
  
    // closure variabler
    var me = this;
    var timerX = {};
    var timerY = {};
    function updateTimerX(){
      clearTimeout(timerX);
      timerX = setTimeout(function(){ me.updateX(); }, 200);
    }
    function updateTimerY(){
      clearTimeout(timerY);
      timerY = setTimeout(function(){ me.updateY(); }, 200);
    }
  
    this.updateX = function(){
      // event callback returnerar detta svaret
      ownerMirror._picaxe.requestPid(ownerMirror._protocolIdentity, "Xpos", "");
    }
    this.updateY = function(){
      // event callback returnerar detta svaret
      ownerMirror._picaxe.requestPid(ownerMirror._protocolIdentity, "Ypos", "");
    }
    this.update = function(){
      me.updateX();
      me.updateY();
    }
    this.up = function(){
      //var pos = me.getXPos()
      //me.setXPos(pos + 5);
      updateTimerX();
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "moveX", 0);
    }
  
    this.down = function(){
      //var pos = me.getXPos()
      //me.setXPos(pos - 5);
      updateTimerX();
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "moveX", 1);
    }
  
    this.left = function(){
      //var pos = me.getYPos()
      //me.setYPos(pos + 5);
      updateTimerY();
      var dir = 1
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "moveY", 1);
    }
  
    this.right = function(){
      //var pos = me.getYPos()
      //me.setYPos(pos - 5);
      updateTimerY();
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "moveY", 0);
    }
  
    this.cancelMove = function(){
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "cancel", 0);
    }
    this.getXPos = function(){ return x;}
    this.getYPos = function(){ return y;}
    this.setXPos = function(newX){
      newX = Number(newX)
      if (newX < minValue || newX > maxValue) { return;}
        // enligt volvo så är X up och ned??
        // kordinatsystemet är tydligen vridet 90 grader i göteborg
      x = newX;
      var upArrow = ownerMirror._getNode("up_arrow").style;
      var downArrow = ownerMirror._getNode("down_arrow").style;
   
      var upScale = x / 127; // faktor att multiplicera med
      var downScale = (255 - x) / 127;

      var regExp = /(.*)\s+scale\(.*\)(.*)/;
      upArrow.transform = upArrow.transform.replace(regExp, "$1 scale(" + upScale + ", " + upScale + ") $2");
      downArrow.transform = downArrow.transform.replace(regExp, "$1 scale(" + downScale + ", " + downScale + ") $2");
    }
  
    this.setYPos = function(newY){
      newY = Number(newY);
      if (newY < minValue || newY > maxValue) { return;}
      // enligt volvo så är X up och ned??
      // kordinatsystemet är tydligen vridet 90 grader i göteborg
      y = newY;
      
      var leftArrow = ownerMirror._getNode("left_arrow").style;
      var rightArrow = ownerMirror._getNode("right_arrow").style;
      
      var leftScale = (255 - y) / 127; // faktor att multiplicera med
      var rightScale = y/127;


      var regExp = /(.*)\s+scale\(.*\)(.*)/;
      leftArrow.transform = leftArrow.transform.replace(regExp, "$1 scale(" + leftScale + ", " + leftScale + ") $2");
      rightArrow.transform = rightArrow.transform.replace(regExp, "$1 scale(" + rightScale + ", " + rightScale + ") $2");
    }
  
  // events från picaxekabeln till denna class
    ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "moveX", updateTimerX, me)
    ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "moveY", updateTimerY, me);
    ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "Xpos", me.setXPos, me);
    ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "Ypos", me.setYPos, me);
  }  */


// hjälpclasser
MirrorPosition = function(ownerMirror, args){
  this._value = 127; // hälften av 255
  this.args = args;

  var me = this;
  var maxValue = 235;
  var minValue = 20;

  this.args.clickNodes.forEach(function(id){
      var node = ownerMirror._getNode(id);
      node.style.transform += " scale(1,1)";
  }, this);

  // closure variabler
  var me = this;
  var timer = {};
  function updateTimer(){
    clearTimeout(timer);
    timer = setTimeout(function(){ me.update(); }, 200);
  }

  this.clicked = function(evt) {
      if (!ownerMirror._rightOriented) {
        var inc = this.inc;
        var dec = this.dec;
      } else {
          var inc = this.dec;
          var dec = this.inc;
      }

      if (evt.currentTarget === this.args.clickNodes[0])
          inc();
      else
          dec();
  }

  this.update = function(){
    // event callback returnerar detta svaret
    ownerMirror._picaxe.requestPid(ownerMirror._protocolIdentity, me.args.protocolKeys[1], "");
  }

  this.inc = function(){
    //var pos = me.getXPos()
    //me.setXPos(pos + 5);
    updateTimer();
    ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, me.args.protocolKeys[0], 0);
  }

  this.dec = function(){
    //var pos = me.getXPos()
    //me.setXPos(pos - 5);
    updateTimer();
    ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, me.args.protocolKeys[0], 1);
  }

  this.cancelMove = function(){
    ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, me.args.protocolKeys[2], 0);
  }

  this.setValue = function(newVlu){
    newVlu = Number(newVlu)
    if (newVlu < minValue || newVlu > maxValue) { return;}
      // enligt volvo så är X up och ned??
      // kordinatsystemet är tydligen vridet 90 grader i göteborg
    this._value = newVlu;
    var upArrow = ownerMirror._getNode( this.args.clickNodes[0]).style;
    var downArrow = ownerMirror._getNode( this.args.clickNodes[1]).style;

    var upScale = this._value / 127; // faktor att multiplicera med
    var downScale = (255 - this._value) / 127;

    var regExp = /(.*)\s+scale\(.*\)(.*)/;
    upArrow.transform = upArrow.transform.replace(regExp, "$1 scale(" + upScale + ", " + upScale + ") $2");
    downArrow.transform = downArrow.transform.replace(regExp, "$1 scale(" + downScale + ", " + downScale + ") $2");
  }

// events från picaxekabeln till denna class
  //ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "moveX", updateTimerX, me)
 // ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "moveY", updateTimerY, me);
 // ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "Xpos", me.setXPos, me);
 // ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "Ypos", me.setYPos, me);
 this.args.clickFunc = this.clicked;
 ValueWgt.call(this, ownerMirror, args)
}

inheritsFrom(MirrorPosition, ValueWgt);
  
  MirrorFolder = function(ownerMirror){
    var state = true;
    var me = this;
    var foldTimeout = {}; // object för closure ref
    this.isFolded = function() { return !state; }
    this.toggle = function(){
      me.setState(!state);  
      ownerMirror._picaxe.sendCommand(ownerMirror._protocolIdentity, "fold", Number(state));
    }
    this.setState = function(newState){
      state = newState;
      var mirror = ownerMirror._getNode("foldingmirror");
      
      var angleIncrement = 2;
      if (!state){
        angleIncrement = -angleIncrement;
      }

      // stoppa gammal animering
      if (foldTimeout){
        clearInterval(foldTimeout);
      }
    
      foldTimeout = setInterval(function(){
        var transform = mirror.getAttribute("transform");
        if (transform)
          var rotation = transform.match(/rotate\((-?\d+)/); // mirror.style.rotation || 0;
        if (!rotation || !rotation[1])
          rotation = 0;
        else
          rotation = parseInt(rotation[1]);
        
        rotation += angleIncrement;
        
        if (rotation > 0) {
          clearInterval(foldTimeout);
          rotation = 0;
          mirror = null; // rensa minne
          return;
        } else if (rotation < -80) {
          clearInterval(foldTimeout);
          rotation = -80;
          mirror = null; // rensa minne
          return;
        }
        
        //mirror.style.rotation = rotation;
        mirror.setAttribute("transform", "rotate(" + rotation + ", 380,230)");
      }, 50);
    }
    this.getState = function(){ return state;}
  
    // events från picaxekabeln till denna class
    //ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "fold", me.setState, me);
    Toggler.call(this, ownerMirror, {protocolKeys:["fold"],clickNodes:["foldarrow"]});
  }
inheritsFrom(MirrorFolder, Toggler);


  MirrorThermometer = function(ownerMirror){
    // denna funktion är på inget sätt exakt, det finns ingen kompensering för NTC motståndets olinjäritet
    // vid 0  grader NTC=6318
    // 	 5  grader NTC=4918
    //     10 grader NTC=3857
    // 	 15 grader NTC=3047
    //	 20 grader NTC=2424
    // 	 25 grader NTC=1841
    //	 30 grader NTC=1384
    // vi har ett 2,2k referensmotstånd nedan Ohms lag
    
    // 5v i 255 steg (8bitar AD-omvandlare)
    // 	5/255=0,0196V per steg
    // ex: 2200 ohm + 3857 ohm = 5057ohm
    //    spänningsfallet över refmotståndet (plus till mätpunkt) blir
    //    I = 5V/5,057k = 0,989mA
    //	U = 0,989mA * 2,2k = 2,175V
    //    värde=2,175/0,0196=110,96 avrundat 111
    
    var value = 115; // default värde
    var refResistor = 2200; // 2.2kohm
    var storedTemp = 12;
  
  
    // closure ref
    var timer = {};
    var me = this;
    this._setScale = function(scale){
      // ändra skala på texten
      var scale = parseInt(scale * 100);
      ownerMirror._getNode("thermometer").style.fontSize = scale + "%";
    }
    this.update = function(){
      /*ownerMirror._picaxe.sendAndRecieve(ownerMirror._protocolIdentity, function(newValue){
        if (newValue && !isNaN(newValue)) {
          me.setValue(Number(newValue));
        }
      }, "getTemp");*/
  
      // event callback returnerar detta svaret nu istället
      ownerMirror._picaxe.requestPid(ownerMirror._protocolIdentity, "getTemp", "");
    }
  
    this.toggleAutoUpdate = function(){
      clearInterval(timer);
      var button = ownerMirror._getNode("thermometerupdate");
      if (compareCssColors(button.style.fill, "#999")) {
        timer = setInterval(me.update, 3000); // var 3dje sekund
        button.style.fill = "#CCC";
      } else {
        button.style.fill = "#999";
      }
    }
    this.getValue = function(){ return value; }
    this.setValue = function(newValue){
      value = Number(newValue);
      var volt = value * 0.0196;
      // refResistorn sitter plusmatad och vi mäter NTC spänningen, gör om till spänning över refResistor istället
      var A = (5 - volt) / refResistor; // använd ohms lag
      var ntc = volt / A;
      // nu kommer det krångliga att omvandla till temp
      // källa:http://en.wikipedia.org/wiki/Thermistor
      // http://www.tdk.co.jp/tefe02/eb221_ntc_sum.pdf
      // http://en.wikipedia.org/wiki/Natural_logarithm
      // http://www.daycounter.com/Calculators/Steinhart-Hart-Thermistor-Calculator.phtml
      // har räknat ut dess i förväg
      var rInf = 0.004156235;
      var beta = 3858.1;//4191.1;//4276.5; //3888.1;
      var kelvin = beta / (Math.log(ntc / rInf));
      var temp = kelvin - 273.15;
    
      temp = parseInt(temp); // gör om till heltal
      storedTemp = temp;

      var scale = ownerMirror._getNode("thermometerscale");

      //debug("temp=" +temp);
      if (temp >= 12 && temp <= 32){
        // visa bara dessa temperaturer
        // 12 <-> 32
        //  detta ger 20 steg fördelat på 100pixlar
        // 100 / 20 = 5
        var height = (32 - temp) * 5;
        scale.style.height = height + "px";
      } else if (temp > 32 && value) {
        scale.style.height = "0px";
      } else {
          scale.style.height = "100px";
      }

      scale.title = temp + "°";
      scale.previousElementSibling = scale.title;
  
    }
    this.getTemp = function(){return storedTemp};
 
  
    // events från picaxekabeln till denna class
    //ownerMirror._picaxe.connectTo(ownerMirror._protocolIdentity, "getTemp", me.setValue, me);
    ValueWgt.call(this, ownerMirror, { protocolKeys:["getTemp"], clickNodes:["thermometer"],
                      clickFunc:this.update });
  }

inheritsFrom(MirrorThermometer, ValueWgt);
  
