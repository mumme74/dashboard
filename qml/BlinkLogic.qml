import QtQuick 2.0
import QtMultimedia 5.5

// This contains the blink logic
Item {
    id: root
    readonly property int eOff: 0
    readonly property int eLeft: 1
    readonly property int eRight: 2
    readonly property int eHazard: 4
    property int state: eOff

    property bool leftLightsLit: false
    property bool rightLightsLit: false

    property bool flashing: false;


    function blink(){
        flashing = !flashing
        switch (state) {
        case root.eLeft:
            root.leftLightsLit = flashing;
            canPids.updateFromQml("<", flashing ? 1 : 0)
            break;
        case root.eRight:
            root.rightLightsLit = flashing;
            canPids.updateFromQml(">", flashing ? 1 : 0)
            break;
        case root.eHazard:
            root.rightLightsLit = flashing;
            root.leftLightsLit = flashing;
            canPids.updateFromQml("F", flashing ? 1 : 0)
            break;
        default:
            flashTimer.stop()
            root.leftLightsLit = false
            root.rightLightsLit = false
            canPids.updateFromQml("<", 0)
            canPids.updateFromQml(">", 0)
            canPids.updateFromQml("F", 0)
            flashing = false;
            return;
        }
        if (flashing)
            playSoundOn.play()
        else
            playSoundOff.play()
    }

    /**
     * @breif These functions lets a outside (ie Can or websocket) turn on-off blinker
     */
    function checkLeft(value) {
        if (state == eLeft && (value == 2 || webSockServer.proxySlave)) {
            state = eOff
        } else if (state == eOff && (value == 4 || webSockServer.proxySlave))
            state = eLeft
    }
    function checkRight(value) {
        if (state == eRight && value == 2) {
            state = eOff
        } else if (state == eOff && value == 4)
            state = eRight
    }
    function checkHazard(value) {
        if (state == eHazard && value == 2) {
            state = eOff
        } else if (state == eOff && value == 4)
            state = eHazard
    }

    Timer {
        id: flashTimer
        interval: 500
        repeat: true
        onTriggered: blink()
    }

    onStateChanged: {
        if (state != root.eOff && !webSockServer.proxySlave) {
            flashTimer.start()
        }
        blink();
    }


    SoundEffect {
        id: playSoundOn
        source: "qrc:/turnSignal-On.wav"
        loops: 1// SoundEffect.Infinite
    }
    SoundEffect {
        id: playSoundOff
        source: "qrc:/turnSignal-Off.wav"
        loops: 1// SoundEffect.Infinite
    }
}
