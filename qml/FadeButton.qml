import QtQuick 2.2
import QtQuick.Controls 1.4

Rectangle {
    id: button
    property real initialOpacity: 0.3
    property real fontPixelsize: 10
    property real scaleFactor: 1.5
    color: "#2791A8"
    border.color: "#0E3D47"
    border.width: 1

    width: buttonText.width + 10
    height: buttonText.height + 10

    radius: 5
    opacity: initialOpacity
    property string text: "caption"

    signal clicked()
    signal doubleClicked()


    Text {
        id: buttonText
        anchors.centerIn: parent
        text: button.text
        font.italic: true
        font.pixelSize: button.fontPixelsize
    }

    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        onClicked: button.clicked()
        onDoubleClicked: button.doubleClicked()
        onEntered: buttonFade.set(true)
        onExited: buttonFade.set(false)
    }

    ParallelAnimation {
        id: buttonFade
        function set(bright) {
            stop();
            button.z = bright ? 10 : 1
            opacityAnim.from = button.opacity
            opacityAnim.to = bright ? 1 : initialOpacity
            scaleAnim.from = button.scale
            scaleAnim.to = bright ? button.scaleFactor : 1.0
            start();
        }
        OpacityAnimator {
            id: opacityAnim
            target: button
            from: initialOpacity;
            to: 1.0
            duration: 300
        }
        ScaleAnimator {
            id: scaleAnim
            target:button
            duration: 300
        }
    }
}

