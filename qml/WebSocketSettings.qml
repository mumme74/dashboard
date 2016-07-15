import QtQuick 2.2
import QtQuick.Controls 1.2
import QtQuick.Layouts 1.1
import Qt.labs.settings 1.0

import mummesoft 0.1

DragDialog {
    id: root
    opacityShown: 1.0
    function setProxy() {
        webSockServer.connectToRemoteProxySlave(urlFld.text);
    }

    Settings {
        id: settings
        // from C++ CanInterface
        //static const char can_pluginKey[] = "can_plugin";
        //static const char can_defaultPlugin[] = "socketcan";
        property string can_plugin: "socketcan"

        //static const char can_interfaceKey[] = "can_interface";
        //static const char can_defaultInterface[] = "can0";
        property string can_interface: "can0"

        // not used in this app
        //static const char can_rawFilterKey[] = "can_rawFilter";
        //static const char can_errorFilterKey[] = "can_errorFilter";

        //static const char can_loopbackKey[] = "can_loopback";
        property bool can_loopback: false

        //static const char can_quietModeKey[] = "can_quietMode";
        property bool can_quietMode: false

        //static const char can_bitrateKey[] = "can_bitrate";
        property int can_bitrate: 50000

        //static const char can_fdFramesKey[] = "can_fdFrames";
        property bool can_fdFrames: false
    }

    contentItem: Item{
        Layout.minimumWidth: 250
        Layout.minimumHeight: 250
        width:250
        height: 250
        Text {
            id: header
            anchors.horizontalCenter: parent.horizontalCenter
            text: "WebProxy inställningar"
            height: 40
            font.bold: true
        }
        ColumnLayout {
            id: grid1
            anchors.top: header.bottom

            Label {
                text: "proxyurl inclusive port<br/>" +
                      "<i>ie: ws://234.123.22.134:8080</i>"
            }
            TextField {
                id: urlFld
                text: "ws://192.168.0.120:8080"
                Layout.fillWidth: true//grid1.width
            }

            ListView {
                id: connected
                Component.onCompleted: {
                    model = { "url": "ws://helvete.se:8080" }
                }
            }
        }



        Button {
            id: closeButton
            text: "&Stäng"
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            onClicked: {
                root.show = false
            }
        }


        Button {
            id: restartButton
            text: "Sta&rta"
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            onClicked: {
                setProxy()
                root.show = false
            }
        }

    }
}
