/****************************************************************************
**
** Copyright (C) 2016 The Qt Company Ltd.
** Contact: https://www.qt.io/licensing/
**
** This file is part of the examples of the Qt Toolkit.
**
** $QT_BEGIN_LICENSE:BSD$
** Commercial License Usage
** Licensees holding valid commercial Qt licenses may use this file in
** accordance with the commercial license agreement provided with the
** Software or, alternatively, in accordance with the terms contained in
** a written agreement between you and The Qt Company. For licensing terms
** and conditions see https://www.qt.io/terms-conditions. For further
** information use the contact form at https://www.qt.io/contact-us.
**
** BSD License Usage
** Alternatively, you may use this file under the terms of the BSD license
** as follows:
**
** "Redistribution and use in source and binary forms, with or without
** modification, are permitted provided that the following conditions are
** met:
**   * Redistributions of source code must retain the above copyright
**     notice, this list of conditions and the following disclaimer.
**   * Redistributions in binary form must reproduce the above copyright
**     notice, this list of conditions and the following disclaimer in
**     the documentation and/or other materials provided with the
**     distribution.
**   * Neither the name of The Qt Company Ltd nor the names of its
**     contributors may be used to endorse or promote products derived
**     from this software without specific prior written permission.
**
**
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
** "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
** LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
** A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
** OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
** SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
** LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
** DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
** THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
** (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
**
** $QT_END_LICENSE$
**
****************************************************************************/

import QtQuick 2.2
import QtQuick.Window 2.1
import QtQuick.Controls 1.4
import QtQuick.Controls.Styles 1.4
import QtQuick.Extras 1.4
import QtQuick.VirtualKeyboard 2.1
import QtQuick.VirtualKeyboard.Settings 2.0

import "Settings.js" as Settings

Window {
    id: root
    visible: true
    width: Settings.appWidth();
    height: Settings.appHeight();
    color: "#161616"
    title: "Instrumentbräda"

    ValueSource {
        id: valueSource
    }

    // Dashboards are typically in a landscape orientation, so we need to ensure
    // our height is never greater than our width.
    Item {
        id: container
        width: root.width
        height: Math.min(root.width, root.height)
        y: parent.y + 30



        Row {
            id: gaugeRow
            spacing: container.width * 0.02
            anchors.horizontalCenter: parent.horizontalCenter
            //            anchors.top: parent.top + 30 //(root.width - width) / 2



            CircularGauge {
                id: speedometer
                value: valueSource.kph
                anchors.verticalCenter: parent.verticalCenter
                maximumValue: 280
                // We set the width to the height, because the height will always be
                // the more limited factor. Also, all circular controls letterbox
                // their contents to ensure that they remain circular. However, we
                // don't want to extra space on the left and right of our gauges,
                // because they're laid out horizontally, and that would create
                // large horizontal gaps between gauges on wide screens.
                width: height
                height: container.height * 0.6

                style: DashboardGaugeStyle {}
            }
            Item {
                width: height * 0.45
                height: container.height * 0.65 - gaugeRow.spacing
                anchors.verticalCenter: parent.verticalCenter

                CircularGauge {
                    id: fuelGauge
                    value: valueSource.fuel
                    maximumValue: 1
                    y: parent.height / 2 - height / 2 - container.height * 0.02
                    width: parent.width
                    height: parent.height * 0.7

                    style: IconGaugeStyle {
                        id: fuelGaugeStyle

                        icon: "qrc:/images/fuel-icon.png"
                        minWarningColor: Qt.rgba(0.5, 0, 0, 1)

                        tickmarkLabel: Text {
                            color: "white"
                            visible: styleData.value === 0 || styleData.value === 1
                            font.pixelSize: fuelGaugeStyle.toPixels(0.225)
                            text: styleData.value === 0 ? "E" : (styleData.value === 1 ? "F" : "")
                        }
                    }
                }

                Item {
                    //                                        anchors.verticalCenter: parent.top
                    width: parent.width

                    TurnIndicator {
                        id: leftIndicator
                        //                    anchors.verticalCenter: parent.top
                        anchors.horizontalCenter: parent.left
                        width: height
                        height: container.height * 0.1 - gaugeRow.spacing

                        direction: Qt.LeftArrow

                        on: valueSource.blinkLogic.leftLightsLit
                        onClicked: {
                            if (valueSource.blinkLogic.state == valueSource.blinkLogic.eOff)
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eLeft
                            else
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eOff
                        }
                    }


                    Indicator {
                        width: 60
                        height: 60
                        id: hazardWarning
                        anchors.horizontalCenter: parent.horizontalCenter
                        source: "qrc:/images/hazardWarning.svg"
                        clickable: true
                        on: valueSource.blinkLogic.state == valueSource.blinkLogic.eHazard
                        offOpacity: 0.15

                        onClicked: {
                            if (valueSource.blinkLogic.state == valueSource.blinkLogic.eOff)
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eHazard
                            else
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eOff
                        }
                    }

                    TurnIndicator {
                        id: rightIndicator
                        //                    anchors.verticalCenter: parent.top
                        anchors.horizontalCenter: parent.right
                        width: height
                        height: container.height * 0.1 - gaugeRow.spacing

                        direction: Qt.RightArrow
                        on: valueSource.blinkLogic.rightLightsLit
                        onClicked: {
                            if (valueSource.blinkLogic.state == valueSource.blinkLogic.eOff)
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eRight
                            else
                                valueSource.blinkLogic.state = valueSource.blinkLogic.eOff
                        }
                    }
                }

                CircularGauge {
                    value: valueSource.temperature
                    maximumValue: 1
                    width: parent.width
                    height: parent.height * 0.7
                    y: parent.height / 2 - container.height * 0.02

                    style: IconGaugeStyle {
                        id: tempGaugeStyle

                        icon: "qrc:/images/temperature-icon.png"
                        maxWarningColor: Qt.rgba(0.5, 0, 0, 1)

                        tickmarkLabel: Text {
                            color: "white"
                            visible: styleData.value === 0 || styleData.value === 1
                            font.pixelSize: tempGaugeStyle.toPixels(0.225)
                            text: styleData.value === 0 ? "C" : (styleData.value === 1 ? "H" : "")
                        }
                    }
                }



            }

            CircularGauge {
                id: tachometer
                width: height
                height: container.height * 0.6 - gaugeRow.spacing
                value: valueSource.rpm
                maximumValue: 8
                anchors.verticalCenter: parent.verticalCenter

                style: TachometerStyle {}
            }



        }

        Row {
            id: indicatorRow
            //columns: 3
            spacing: 10
            //width: parent.width
            anchors.horizontalCenter: gaugeRow.horizontalCenter
            anchors.verticalCenter: gaugeRow.bottom
            //anchors.horizontalCenter: container.horizontalCenter

            Indicator {
                id: highBeam
                source: "qrc:/images/highBeamIndicator.svg"
                clickable: true
                offOpacity: 0.15
                on: valueSource.highBeam

                onClicked: valueSource.highBeam = !valueSource.highBeam
            }

            Indicator {
                id: loBeam
                source: "qrc:/images/loBeamIndicator.svg"
                clickable: true
                on: valueSource.loBeam

                onClicked: valueSource.loBeam = !valueSource.loBeam
            }

            Indicator {
                id: positionLights
                source: "qrc:/images/positionLight.svg"
                clickable: true
                offOpacity: 0.15
                on: valueSource.positionLights

                onClicked: valueSource.positionLights = !valueSource.positionLights
            }


            Indicator {
                id: rearFogLight
                source: "qrc:/images/rearFogLight.svg"
                clickable: true
                on: valueSource.rearFogLights

                onClicked: valueSource.rearFogLights = !valueSource.rearFogLights
            }

            Indicator {
                id: defroster
                source: "qrc:/images/defrosterIndicator.svg"
                clickable: true
                on: valueSource.defroster

                onClicked: valueSource.defroster = !valueSource.defroster
            }

        }
        GearSelector {
            id: gearSelector
            anchors.horizontalCenter:  parent.horizontalCenter
            anchors.top: indicatorRow.bottom
            anchors.topMargin: 20
            gear: valueSource.gear
            opacity: 0.8
            onGearChanged: valueSource.gear = gear
        }

        HeadlightAdjuster {
            id:headLightAdjuster
            anchors.left: parent.left
            anchors.top: gaugeRow.bottom
            anchors.leftMargin: 10
            opacity: 0.8
        }
    }


    // show a terminal button
    FadeButton {
        id: terminalButton
        text: "terminal"
        onClicked: terminal.show = !terminal.show
        transformOrigin: Item.TopLeft
    }
    Terminal {
        id: terminal
    }

    // indicate that our servers are working
    FadeButton {
        id: httpIndicator
        x: 0
        y: parent.height - height
        color: httpServer.running ? "green" : "red"
        text: httpServer.errorString ? "http:" + httpServer.errorString : "http://" + network.ip + ":" + httpServer.port
        transformOrigin: Item.BottomLeft

        Component.onCompleted: {
            console.log("Http serverRunning:" + httpServer.running.toString())
        }
    }

    FadeButton {
        id: webSockIndicator
        x: httpIndicator.x + httpIndicator.width + 3
        y: parent.height - height
        color: webSockServer.running ? "green" : "red"
        text: setText()
        function setText() {
            var txt
            if (webSockServer.errorString)
                txt = "ws:" + webSockServer.errorString;
            else {
                txt = "clients:" + webSockServer.connections;
                if (webSockServer.proxyConnections) {
                    txt += " proxies:" + webSockServer.proxyConnections;
                }
            }
            if (webSockServer.proxySlave)
                txt += " är slav"
            return txt;
        }

        Connections {
            target: webSockServer
            onConnectionsChanged: webSockIndicator.text = webSockIndicator.setText();
            onProxyConnectionsChanged:  webSockIndicator.text = webSockIndicator.setText();
            onProxySlaveChanged: webSockIndicator.text = webSockIndicator.setText();

        }

        transformOrigin: Item.BottomLeft
        onDoubleClicked: webSockSettings.show = !webSockSettings.show

        Component.onCompleted: {
            console.log("WebSock serverRunning:" + webSockServer.running.toString())
        }
    }

    FadeButton {
        id: canInterfaceIndicator
        x: webSockIndicator.x + webSockIndicator.width + 3
        y: parent.height -height
        color: canInterface.connected ? "green" : "red"
        text: canInterface.errorString ? "CAN:" + canInterface.errorString : "CAN connected"
        transformOrigin: Item.BottomLeft

        onDoubleClicked: canSettings.show = !canSettings.show

        Component.onCompleted: {
            console.log("CAN connected: " + canInterface.connected.toString())
        }
    }

    CanSettings {
        id: canSettings
    }

    WebSocketSettings {
        id: webSockSettings
    }

    FadeButton {
        id: closeApp
        anchors.right: parent.right
        anchors.top: parent.top
        transformOrigin: Item.TopRight
        text: "Stäng app"
        onClicked: Qt.quit()
    }


    // virtual keyboard
    InputPanel {
        z: 100
        id: inputPanel
        y: Qt.inputMethod.visible ? parent.height - inputPanel.height : parent.height
        anchors.left: parent.left
        anchors.right: parent.right

        Component.onCompleted: {
            //VirtualKeyboardSettings.styleName = "retro"
            VirtualKeyboardSettings.locale = "sv_SE"
            VirtualKeyboardSettings.locale = "opacity:0.5; height:100px;"
        }

    }
}
