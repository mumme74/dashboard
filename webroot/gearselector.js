// constructor
function GearSelectorMain(picaxeController, parentNodeID, protocolID, rightOriented, scale, uniqueDomID){
  this._id = uniqueDomID ? uniqueDomID : ("_" + parseInt(Math.random() * 10000));
  this._protocolIdentity = protocolID;
  this._picaxe = picaxeController || picaxe;
  this.nodes = {}; // hållare för dynamiska noder
  this._rightOriented = rightOriented || false;
  this._scale = scale || 1;


  //
  loadTextFile("gearselector_template.htm", function(svg){

      addOnDOMLoad(function(){

          this._parentNode = document.getElementById(parentNodeID);

          // prefixa id i SVGen med vårt unika id
          svg = svg.replace(/\"\$(.*)\"/g,"\""+  this._id + "$1\"");
          this._parentNode.innerHTML = svg;

          var node = this._getNode("gearselectorroot");
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

          node.style.transform = translate + " scale(" + scale.x + "," + scale.y + ")";

          this.gearCls = new GearSelector(this);


      }, this);
  }, this);
}
GearSelectorMain.prototype._getNode = function(nodeId){
  return document.getElementById(this._id + nodeId);
}



GearSelector  = function(owner){
    this.args = {protocolKeys: ["gear"]};

    this._currentGearNode = null;

    this.onGearChange = function(evt) {
        if (this._currentGearNode == evt.currentTarget)
            return;
        var driveNode = owner._getNode("gearselectordrive");
        var reverseNode = owner._getNode("gearselectorreverse")
        var gear = 0; // neutral

        if (evt.currentTarget == driveNode ||
            evt.currentTarget.previousElementSibling == driveNode)
        {
            gear = 2;
        } else if (evt.currentTarget == reverseNode ||
                   evt.currentTarget.previousElementSibling == reverseNode)
        {
            gear = 1;
        }

        this.setValue(gear);

        picaxe.sendCommand(this.owner._protocolIdentity, this.args.protocolKeys[0], Number(this._value)) ;
    }

    this.setValue = function(gear){
        if (this._value === gear)
            return;

        this._value = gear;

        this.render();
    }

    this.render = function(){
        var gear = this._value;

        if (this._currentGearNode)
            this._currentGearNode.style.fill = "#767F82";

        switch (gear) {
        case 2:
            this._currentGearNode = owner._getNode("gearselectordrive");
            break;
        case 1:
            this._currentGearNode = owner._getNode("gearselectorreverse");
            break;
        case 0: // intended fallthrough
        default:
            this._currentGearNode = owner._getNode("gearselectorneutral");
        }

        this._currentGearNode.style.fill = "none";

        // the gearknob is offset 130px with each gear from 0
        owner._getNode("gearselectorknob").style.transform = "translate(0px, " + (gear * 130) + "px)";
    }

    this.args.clickNodes = ["gearselectorneutral",     "gearselectordrive",     "gearselectorreverse",
                            "gearselectorneutraltext", "gearselectordrivetext", "gearselectorreversetext"];
    this.args.clickFunc = this.onGearChange;

    ValueWgt.call(this, owner, this.args);
}
inheritsFrom(GearSelector, ValueWgt);
