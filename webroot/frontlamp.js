/*
*	Kontrollogik för FrontLamp widget
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
  
  
  // constructor för FrontLamp
  function FrontLamp(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
    this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
    this._protocolIdentity = protocolID;
    this._picaxe = picaxeController || picaxe;
    this.nodes = {}; // hållare för dynamiska noder
    this._rightOriented = rightOriented || false;
    this._scale = scale || 1;

  
    loadTextFile("frontlamp_template.htm", function(svg) {
        addOnDOMLoad(function(){
          this._parentNode = document.getElementById(parentNodeID);
          // ladda HTML
          //var svg = loadTextFile("frontlamp_template.htm");

          // prefixa id i VMLen med vårt unika id
          svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
          this._parentNode.innerHTML = svg;

          var node = this._getNode("frontlampcommon");
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

          this.blinker = new Blinker(this);
          this.parkLight = new Light(this, {protocolKeys:["parkLight"], fills:[{colorOff:"#FFF", colorOn:"#FFFFE0"}]});
          this.highLight = new Light(this, {protocolKeys:["highBeam"], beamIds:["highlightbeam"], fills:[{id:"highlight",colorOff:"#FFFFFF", colorOn:"#E1FFE8"}]});
          this.lowLight = new Light(this, {protocolKeys:["lowBeam"], beamIds:["lowlightbeam"],  fills:[{id:"lowlight",colorOff:"#FFFFFF", colorOn:"#F1FFF8"}]});
          this.slider = new FrontLampHightAdjuster(this);

          node.setAttribute("transform", translate + "scale(" + scale.x + "," + scale.y + ")");

        }, this);
    }, this);

  }

  
  FrontLamp.prototype._getNode = function(nodeId){
    return document.getElementById(this._id + nodeId);
  }


  
  FrontLampHightAdjuster = function(ownerFrontLamp) {
    var value = 50;
    var me = this;
    var protocolKey = "angle";
    var slider = {};
    var e = {y:0, isMoving: false};
    var maxY = 70;
    var minY = 3;
  
    // stoppa select på med musen
    document.addEventListener("selectstart", function(evt){ 
      evt.preventDefault();
      evt.stopPropagation();
    });
  
    function sliderDragged(){
      value = slider.getAttribute("transform").match(/translate\(\d+,(\d+)\)/);
      if (value) {
        value = Number(value[1]);
        ownerFrontLamp._picaxe.sendCommand(ownerFrontLamp._protocolIdentity, protocolKey, value) ;
      }
    }
    
    function sliderMove(toY){
      if (toY  < minY){
        toY = minY;
      } else if(toY > maxY) {
        toY = maxY;
      }
      slider.setAttribute("transform", "translate(0," + toY + ")")
    }
    
    addOnDOMLoad(function(){
      slider = ownerFrontLamp._getNode("angleslider");	  
      // initiera till mittläge
      sliderMove((20 + value) * ownerFrontLamp._scale);
	  
      slider.addEventListener("mousedown", function(evt){
        if (evt.button == 0){
          var parentTop = slider.parentNode.style.top;
          e.y = evt.offsetY;
          e.isMoving = true;
        }
      });
      
      //find the previus sibling (real element)
      var previous = slider.previousSibling;
      while(previous.nodeType != 1 && previous != null){
        previous = previous.previousSibling;
      }
      
      previous.addEventListener("mousemove", function(evt){ 
        evt.returnValue = true;
          if (e.isMoving && evt.button == 0) {
            var y = (evt.offsetY - e.y); //* ownerFrontLamp._scale;
            sliderMove(y);//+ value -10);
          }
      });

      previous.addEventListener("mouseout", function(evt){
        if (evt.toElement != slider && e.isMoving) {
          e.isMoving = false;
          e.y = 0;
          sliderDragged();
        }
      });
      slider.addEventListener("mouseup", function(evt){
        if (evt.button == 0 && e.isMoving) {
          e.isMoving = false;
          sliderDragged();
        }
        e.y = 0;
      });  

      previous.addEventListener("click", function(evt){
          evt.returnValue = false;
          if (evt.button == 0 && evt.target == previous) {
              sliderMove(evt.offsetY);
              sliderDragged();
          }
      });

    }, this);
  
    this.setValue = function(newValue){
      value = Number(newValue);
      if (value > maxY) {
        value = maxY; 
      } else if(value < minY) {
        value = minY;
      }
      
      sliderMove(value);
    }
    this.getValue = function(){ return value; }
  
    // events från picaxekabeln till denna class
    //picaxe.connectTo(ownerFrontLamp._protocolIdentity, protocolKey, me.setValue, me);
    ValueWgt.call(this, ownerFrontLamp, {protocolKeys:[protocolKey],
                      clickNodes:["angleslider", "angleadjuster"], clickFunc:function(){}});
  }

inheritsFrom(FrontLampHightAdjuster, ValueWgt);
