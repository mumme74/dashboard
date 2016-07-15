
/**
  this file is for index.html terminal dialog box
*/

var Terminal = function(){
    var _this = this;
    // init this class
    addOnDOMLoad(function(){
        var form = document.querySelector(".modalDialog form");
        form.addEventListener("submit", _this.send);
        picaxe.addRecieveListener(_this.recv);


        var at = {x:0, y:0};

        var modal = document.querySelector("#openModal");
        var dialog = modal.querySelector("#openModal > div");
        var keyNode = document.querySelector(".modalDialog input[type=text]");
        var vluNode = document.querySelector(".modalDialog input[type=number]");

        dialog.addEventListener("dragstart", function(evt){
            if (evt.CurrentTarget == keyNode || evt.currentTarget == vluNode)
                evt.preventDefault();
            at.x = dialog.offsetLeft - evt.screenX;
            at.y = dialog.offsetTop - evt.screenY;
        });

        dialog.addEventListener("drag", function(evt){
            var x = evt.screenX + at.x;
            var y = evt.screenY + at.y;
            if (x >= 0 && y >= 0) {
                dialog.style.margin = y + "px " + x + "px";
            }
        }, false);

        modal.addEventListener("drop", function(evt){
            evt.preventDefault();
        }, false);

        modal.addEventListener("dragover", function(evt){
            evt.preventDefault();
        }, false);
    });
};

Terminal.prototype.send = function(evt) {
    evt.preventDefault(); // dont reload page
    
    var keyNode = document.querySelector(".modalDialog input[type=text]");
    var valueNode = document.querySelector(".modalDialog input[type=number]");
    if (!keyNode || !valueNode)
        return false;
        
    picaxe.commandToPicaxe({pid: keyNode.value, vlu: parseInt(valueNode.value)});
    return true;
};

Terminal.prototype.recv = function(msg) {
    if (!msg || !msg.pid || isNaN(msg.vlu) || location.hash.indexOf("openModal") < 0)
        return;
        
    var txtNode = document.querySelector(".modalDialog textarea");
    if (!txtNode)
        return;
        
    var msgs = txtNode.value.split("\r\n");
    if (msgs.length > 200) {
        msgs = msg.slice(0, 199);
    }
        
    txtNode.value = "pid:" + msg.pid + " value:" + msg.vlu + "\r\n" +
                    msgs.join("\r\n");
    
};



// init this
var terminal = new Terminal();

