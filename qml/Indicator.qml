import QtQuick 2.0


Image {
    id: root
    property bool on: false
    property real offOpacity: 0.05
    property bool clickable: false

    signal clicked()

  //  anchors.margins: 10
    width: 40
    height: 40
    opacity: offOpacity

    onOnChanged: {
        if (on)
            opacity = 1
        else
            opacity = offOpacity
    }

    MouseArea {
         anchors.fill: parent
         onClicked: {
             if (root.clickable)
                root.clicked()
         }
    }

}
