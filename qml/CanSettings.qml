import QtQuick 2.2
import QtQuick.Controls 1.2
import QtQuick.Layouts 1.1
import Qt.labs.settings 1.0
import QtQuick.Controls.Styles 1.4
import "."

DragDialog {
    id: root
    opacityShown: 1.0
    function save() {
        settings.can_plugin = plugins.currentText
        settings.can_interface = interfaceName.text
        settings.can_loopback = loopback.checked
        settings.can_quietMode = quietMode.checked
        settings.can_fdFrames = fdFrames.checked
        settings.can_bitrate = bitrate.text

        canInterface.connected = false
        canInterface.connected = true
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
        width:250
        height: 250
        Text {
            id: header
            anchors.horizontalCenter: parent.horizontalCenter
            text: "CAN inställningar"
            font.pixelSize: Style.textSize
            height: 40
            font.bold: true
        }
        GridLayout {
            id: grid1
            columns: 2
            anchors.top: header.bottom
            width: parent.width

            Label {
                text:"Plugin"
                Layout.preferredWidth: 40
                font.pixelSize: Style.textSize
            }
            ComboBox { // combox charshes EGLFS
                id: plugins
                model: canInterface.availablePlugins()
                Layout.preferredWidth: 120
                style: ComboBoxStyle {
                    label: Label{
                        verticalAlignment: Text.AlignVCenter
                        horizontalAlignment: Text.AlignHCenter
                        font.pixelSize: Style.textSize
                        text: control.currentText
                    }
                }


                Component.onCompleted: {
                    //currentIndex = find(settings.can_plugin)
                }
            }
            Label{
                text: "Interface"
                font.pixelSize: Style.textSize
            }
            TextField {
                id: interfaceName
                text: settings.can_interface
                font.pixelSize: Style.textSize
                Layout.preferredWidth: 120
            }
            Label {
                text: "Loopback"
                font.pixelSize: Style.textSize
            }
            CheckBox {
                id: loopback
                checked: settings.can_loopback
            }
            Label {
                text: "Quietmode"
                font.pixelSize: Style.textSize
            }
            CheckBox {
                id:quietMode
                checked: settings.can_quietMode
            }
            Label {
                text: "Ext.frames"
                font.pixelSize: Style.textSize
            }
            CheckBox {
                id: fdFrames
                checked: settings.can_fdFrames
            }


            Label {
                text: "Bitrate"
                font.pixelSize: Style.textSize
            }
            TextField {
                id: bitrate
                font.pixelSize: Style.textSize
                validator: IntValidator { bottom: 1024; top: 1000000}
                text: settings.can_bitrate
                Layout.preferredWidth: 120
            }

        }

        Button {
            id: closeButton
            text: "Stäng"
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            Layout.preferredWidth: 75
            style:  ButtonStyle{
                label: Label{
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
                    font.pixelSize: Style.textSize
                    text: control.text
                }
            }
            onClicked: {
                root.show = false
            }
        }


        Button {
            id: restartButton
            text: "Starta om"
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            Layout.preferredWidth: 75
            style:  ButtonStyle{
                label: Label{
                    verticalAlignment: Text.AlignVCenter
                    horizontalAlignment: Text.AlignHCenter
                    font.pixelSize: Style.textSize
                    text: control.text
                }
            }
            onClicked: {
                save()
                root.show = false
            }
        }

    }
}
