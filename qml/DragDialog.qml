import QtQuick 2.2
import QtQuick.Controls 1.4
import QtQuick.Layouts 1.1

import "Settings.js" as Settings

Item {
    id: root

    property alias contentItem: dialog.contentItem

    property real opacityShown: 0.6
    property bool show: false

    x: (Settings.appWidth() / 2) - (dialog.width / 2)
    y: (Settings.appHeight() / 2) - (dialog.height / 2)


    onShowChanged: dialogFade.setFade(show)

    Rectangle {
        id: dialog
        width:contentItem.width + 10
        height:contentItem.height + 10
        visible: false
        radius: 10
        opacity: 0


        // for drag
        z: mouseArea.drag.active ||  mouseArea.pressed ? 100 : 1
        Drag.dragType: Drag.Internal
        Drag.active: mouseArea.drag.active

        MouseArea {
            id: mouseArea
            anchors.fill: parent
            drag.target: parent
            drag.maximumX: Settings.appWidth() - (root.x + (dialog.width / 2))
            drag.maximumY: Settings.appHeight() - (root.y +(dialog.height / 2))
            drag.minimumX: -(root.x + (dialog.width / 2))
            drag.minimumY: -(root.y + (dialog.height / 2))

        }

        // animations
        OpacityAnimator on opacity {
            id: dialogFade
            from:0; to:1; duration:150
            running:false
            function setFade(show) {
                stop(); from = dialog.opacity
                to = show ? root.opacityShown : 0
                start()
            }
            onRunningChanged: {
                dialog.visible = (!running && dialog.opacity == 0) ? false : true
            }
        }


        property Item contentItem: Rectangle{ id:defaultItem; width: 50; height: 30; }
        onContentItemChanged: {
            contentItem.parent = dialog
            contentItem.anchors.centerIn = dialog;
            dialog.width = contentItem.width + 10
            dialog.height = contentItem.height + 10
        }
    }
}
