import QtQuick 2.2
import QtQuick.Controls 1.4
import QtQuick.Controls 1.0
import QtQuick.Layouts 1.1
import QtQuick.Controls.Styles 1.4
import "."

import "Settings.js" as Settings



// the actual terminal
DragDialog {
    id: terminal


    function send(pid, value){
        if (pid) {
            canPids.updateFromQml(pid, value);
        }
    }


    Connections {
        target: canPids
        onBroadcastToQml: {
            if (terminal.show) {
                var vlu = value.charCodeAt(0)
                var msgs = recieved.text.split("\r\n");
                if (msgs.length > 200) {
                    msgs = msg.slice(0, 199);
                }

                recieved.text = "pid:" + key + " value:" + vlu + "\r\n" +
                        msgs.join("\r\n");
            }
        }
    }


    contentItem: Rectangle {
        id: content
        anchors.centerIn: parent
        width: colLayout.implicitWidth || 230
        height: colLayout.implicitHeight || 230
        color: "transparent"

        ColumnLayout {
            id:colLayout
            spacing: 10
            anchors.centerIn: content
            Label {
                text: "Sänd kommandon"
                font.pixelSize: Style.textSize
                wrapMode: Text.WordWrap
                anchors.horizontalCenter: parent.horizontalCenter
                font.bold: true
            }
            GridLayout {
                Layout.alignment: Qt.AlignLeft
                columnSpacing: 5
                rowSpacing: 5
                columns: 3
                anchors.left: parent.left

                Label {
                    text: "pid"
                    font.pixelSize: Style.textSize
                    Layout.alignment: Qt.AlignBaseline | Qt.AlignLeft
                }
                TextField {
                    id: pid
                    text: "Z"
                    font.pixelSize: Style.textSize
                    Layout.preferredWidth: 50
                    validator: RegExpValidator{ regExp: /[\x3C-\x5F\x61-\x7E\xC0-\xFF]\d?/ }
                    Layout.alignment: Qt.AlignBaseline | Qt.AlignLeft
                    onAccepted: terminal.send(pid.text, value.value)
                    onFocusChanged: { if (focus) selectAll(); else select(0,0);}
                }
                Button {
                    text: "Sänd"
                    style:  ButtonStyle{
                        label: Label{
                            verticalAlignment: Text.AlignVCenter
                            horizontalAlignment: Text.AlignHCenter
                            font.pixelSize: Style.textSize
                            text: control.text
                        }
                    }
                    Layout.preferredWidth: 75
                    onClicked: terminal.send(pid.text, value.value)
                    Keys.onReturnPressed: clicked()
                }
                Label {
                    text: "value"
                    font.pixelSize: Style.textSize
                    Layout.alignment: Qt.AlignBaseline | Qt.AlignLeft
                }
                SpinBox {
                    id: value
                    value: 0
                    font.pixelSize: Style.textSize
                    Layout.preferredWidth: 50
                    horizontalAlignment: Qt.AlignLeft
                    minimumValue: 0
                    maximumValue: 255
                    Layout.alignment: Qt.AlignBaseline | Qt.AlignLeft
                    onEditingFinished: terminal.send(pid.text, value.value)
                }
                Label { }
                Label {
                    text: "mottaget:"
                    font.italic: true
                    font.pixelSize: Style.textSize
                }
                Label{}
                Button {
                    text: "Avbryt"
                    id: close

                    Layout.preferredWidth: 75
                    style:  ButtonStyle{
                        label: Label{
                            verticalAlignment: Text.AlignVCenter
                            horizontalAlignment: Text.AlignHCenter
                            font.pixelSize: Style.textSize
                            text: control.text
                        }
                    }
                    onClicked:  terminal.show = false
                    Keys.onReturnPressed:clicked()
                    Layout.alignment: Qt.AlignBaseline | Qt.AlignRight
                }

            }
            TextArea {
                id: recieved
                readOnly: true
                font.pixelSize: Style.textSize
                Layout.alignment: Qt.AlignBaseline | Qt.AlignLeft
                Layout.preferredWidth: colLayout.width
                Layout.preferredHeight: 75
            }
        }
    }

}
