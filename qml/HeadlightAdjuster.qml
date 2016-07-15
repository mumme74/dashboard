import QtQuick 2.2
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Extras 1.4

Item {
    id: root
    width: 40
    height: 80
    Canvas {
        id: triangle
        // canvas size
        width: 20; height: parent.height
        anchors.top: parent.top
        anchors.left: parent.left
        // handler to override for drawing
        onPaint: {
            var ctx = getContext("2d")
            ctx.lineWidth = 2
            ctx.strokeStyle = "#DAE1E3"
            ctx.fillStyle = "#EBF0F2"
            ctx.beginPath()
            ctx.moveTo(0,0)
            ctx.lineTo(20,0)
            ctx.lineTo(20,80)
            ctx.lineTo(0,0)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }
    }

    Slider {
        id: headLightAngle
        width: 30
        anchors.left: triangle.right
        anchors.top: parent.top
        value: valueSource.lightHeigt
        minimumValue: 3
        maximumValue: 70
        updateValueWhileDragging: false
        orientation: Qt.Vertical
        transform: Rotation { origin.x: 20; origin.y: 40; angle: 180}
        style: SliderStyle {
            groove: Rectangle {
                implicitWidth: 80
                implicitHeight: 6
                color: "#28363B"
                radius: 8
            }
            handle: Rectangle {
                anchors.centerIn: parent
                color: control.pressed ? "#5E757D" : "37454A"
                border.color: "gray"
                border.width: 2
                implicitWidth: 16
                implicitHeight: 34
                radius: 12
            }
        }
        onValueChanged: valueSource.lightHeigt = value
    }
}
