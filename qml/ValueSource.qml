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
import QtMultimedia 5.5

import mummesoft 0.1

Item {
    id: valueSource
    property real kph: 0
    onKphChanged: { canPids.updateFromQml("s", kph) }
    property real rpm: 0
    onRpmChanged: {
        canPids.updateFromQml("r",(rpm * 1000) / 60) // make it rps
    }
    property real fuel: 0.85
    property int gear: 0
    onGearChanged: { canPids.updateFromQml("R", gear); }

    property real temperature: 0.6
    property bool start: true

    property bool loBeam: false
    onLoBeamChanged: { canPids.updateFromQml("L", loBeam ? 1 : 0) }
    property bool highBeam: false
    onHighBeamChanged: { canPids.updateFromQml("H", highBeam ? 1 : 0) }
    property bool positionLights: false
    onPositionLightsChanged: { canPids.updateFromQml("@", positionLights ? 1 : 0) }
    //property bool reverseLights: false
    //onReverseLightsChanged: { canPids.updateFromQml("R", reverseLights ? 1 : 0) }
    property bool rearFogLights: false
    onRearFogLightsChanged: { canPids.updateFromQml("", rearFogLights ? 1 : 0) }
    property bool defroster: false
    onDefrosterChanged: { canPids.updateFromQml("S", defroster ? 1 : 0) }
    property bool brakeLights: false
    onBrakeLightsChanged: { canPids.updateFromQml("=", brakeLights ? 1 : 0) }
    property int lightHeigt: 70
    onLightHeigtChanged: {
        canPids.updateFromQml("M", lightHeigt );
    }
    property bool horn: false
    onHornChanged: {
        if (horn) {
            hornSound.play()
            if (!webSockServer.proxySlave)
                hornTimer.start()
        } else {
            hornSound.stop()
            hornTimer.stop()
        }
        canPids.updateFromQml("I", horn ? 1 : 0)
    }

    Connections {
        target: canPids
        onBroadcastToQml: {
            var vlu = value.charCodeAt(0)
            switch (key) {
            case "L": loBeam = vlu; break;
            case "H": highBeam = vlu; break;
            case "@": positionLights = vlu; break;
            case "R": gear = vlu; break;
            case "":  rearFogLight = vlu; break;
            case "S": defroster = vlu; break;
            case "=": brakeLights = vlu; break;
            case "<": blinkLogic.checkLeft(vlu); break;
            case ">": blinkLogic.checkRight(vlu); break;
            case "F": blinkLogic.checkHazard(vlu); break;
            case "I": horn = vlu; break;
            case "s": kph = vlu; break;
            case "r": rpm = (vlu * 60) / 1000; break; // make from rps to rpm decimal
            case "M": lightHeigt = vlu; break;
            }
        }

    }

    property BlinkLogic blinkLogic: BlinkLogic {}

    SoundEffect {
        id: hornSound
        source: "qrc:/horn.wav"
        loops: SoundEffect.Infinite
    }

    Timer {
        id: hornTimer
        interval: 1500
        repeat: false
        onTriggered: {
            horn = false
        }
    }
}
