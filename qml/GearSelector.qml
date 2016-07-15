import QtQuick 2.2
import "."

Rectangle {
    id: root
    property int gear: 0 // 0=neutral, 1= reverse, 2<= drive
    onGearChanged: {
        if (gear == 0)
            state = "NEUTRAL"
        else if (gear == 1)
            state = "REVERSE"
        else
            state = "DRIVE"
    }

    width: buttonRow.implicitWidth + 15
    height: buttonRow.implicitHeight + 15

    state: "NEUTRAL"
    radius: 15
    border.color: "#7D878A"
    border.width: 2
    color: "transparent" //#333536"

    states: [
        State {
            name: "NEUTRAL"
            PropertyChanges { target: neutral; color: "white" }
            PropertyChanges { target: neutralTxt; color: "black" }
        },
        State {
            name: "DRIVE"
            PropertyChanges { target: drive; color: "white"}
            PropertyChanges { target: driveTxt; color: "black" }
        },
        State {
            name: "REVERSE"
            PropertyChanges { target: reverse; color: "white"}
            PropertyChanges { target: reverseTxt; color: "black" }
        }
    ]

    Row {
        id: buttonRow
        spacing: 10
        anchors.centerIn: parent
        anchors.bottom: parent.bottom
        anchors.margins: 10
        Rectangle {
            id: drive
            color:"transparent"
            border.color: "#7D878A"
            border.width: 2
            radius: 8
            width: driveTxt.implicitWidth + 20
            height: width
            Text {
                id: driveTxt
                text: "D"
                anchors.centerIn: parent
                color: "white"
                font.pixelSize: Style.pixelSize * 8
            }
            MouseArea {
                anchors.fill: parent
                onClicked: root.gear = 2//"DRIVE"
            }
        }
        Rectangle {
            id: neutral
            color:"transparent"
            border.color: "#7D878A"
            border.width: 2
            radius: 8
            width: neutralTxt.implicitWidth + 20
            height: width
            Text {
                id: neutralTxt
                text: "N"
                color: "white"
                anchors.centerIn: parent
                font.pixelSize: Style.pixelSize * 8
            }
            MouseArea {
                anchors.fill: parent
                onClicked: root.gear = 0 //"NEUTRAL"
            }
        }
        Rectangle {
            id: reverse
            color:"transparent"
            border.color: "#7D878A"
            border.width: 2
            width: reverseTxt.implicitWidth + 20
            height: width
            radius: 8
            Text {
                id: reverseTxt
                text: "R"
                color: "white"
                anchors.centerIn: parent
                font.pixelSize: Style.pixelSize * 8
            }
            MouseArea {
                anchors.fill: parent
                onClicked: root.gear = 1//"REVERSE"
            }
        }
    }
}
