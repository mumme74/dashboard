/*
*	Kontrollogik för Horn widget
*
*	Fredrik Johansson 2011-07-17
*
*/
/*  
  if(!document.namespaces.v){ 
    document.namespaces.add("v", "urn:schemas-microsoft-com:vml", "#default#VML");
    document.createStyleSheet().addRule("v\:shape", "behavior:url(#default#VML);display:inline-block;");
  }*/
      
  
  
  
  // constructor för Horn
  function Horn(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
    this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
    this._protocolIdentity = protocolID;
    this._picaxe = picaxeController || picaxe;
    this.nodes = {}; // hållare för dynamiska noder
    this._rightOriented = rightOriented || false;
    this._scale = scale || 1;

  
    //
    loadTextFile("horn_template.htm", function(svg){

        addOnDOMLoad(function(){

            this._parentNode = document.getElementById(parentNodeID);

            // prefixa id i VMLen med vårt unika id
            svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
            this._parentNode.innerHTML = svg;

            var node = this._getNode("horncommon");
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

            this.hornsound = new TogglerBeam(this, {protocolKeys:["beeper"],beamIds:["hornsoundwave"], clickNodes:["hornsoundwave", "horn"]});


        }, this);
    }, this);
   
    var _this = this;
    function attachOnClick(nodeId, evtFunc){
      //debug(_this._id + nodeId + evtFunc);
      var node = _this._getNode.call(_this, nodeId);
      node.addEventListener("click", evtFunc);
    }
  }
  Horn.prototype._getNode = function(nodeId){
    return document.getElementById(this._id + nodeId);
  }
