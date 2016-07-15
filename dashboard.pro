TEMPLATE = app
TARGET = dashboard
INCLUDEPATH += .
QT += quick websockets serialbus
QTPLUGIN += qtvirtualkeyboardplugin


SOURCES += \
    main.cpp \
    httpserver.cpp \
    websocketserver.cpp \
    canpids.cpp \
    ipadress.cpp \
    caninterface.cpp


HEADERS += \
    httpserver.h \
    websocketserver.h \
    canpids.h \
    ipadress.h \
    caninterface.h


RESOURCES += \
    dashboard.qrc

OTHER_FILES += \
    qml/dashboard.qml \
    qml/DashboardGaugeStyle.qml \
    qml/IconGaugeStyle.qml \
    qml/TachometerStyle.qml \
    qml/TurnIndicator.qml \
    qml/ValueSource.qml \
    qml/BlinkLogic.qml \
    qml/Terminal.qml \
    qml/FadeButton.qml \
    qml/DragDialog.qml \
    qml/CanSettings.qml \
    qml/WebSocketSettings.qml \
    qml/HeadlightAdjuster.qml \
    qml/Style.qml \
    qml/GearSelector.qml \
    qml/qmldir


target.path = /home/pi/dashboard
INSTALLS += target


#copy all files in webroot to build dir
copyWebroot.commands = $(COPY_DIR) $$PWD/webroot $$OUT_PWD
first.depends = $(first) copyWebroot
export(first.depends)
export(copyWebroots.commands)
QMAKE_EXTRA_TARGETS += first copyWebroot

# copy pi install script
copyPiInstall.commands = $(COPY) $$PWD/install-on-pi.bash $$OUT_PWD
first.depends += $(first) copyPiInstall
export(first.depends)
export(copyPiInstall)
QMAKE_EXTRA_TARGETS += first copyPiInstall

# add make action ie make install_pi
install_pi.commands = bash $$PWD/install-on-pi.bash
export(install_pi)
QMAKE_EXTRA_TARGETS += install_pi

# link with http server
LIBS += -lQHttpEngine

INCLUDEPATH += $$PWD/../../qhttpengine-master/src/ $$PWD/../../build-qhttpengine-master-Desktop_Qt_5_7_0_GCC_64bit-Default/src/
DEPENDPATH += $$PWD/../../qhttpengine-master/src/

DISTFILES += \
    qml/qmldir \
    webroot/gearselector_template.htm \
    webroot/dashboard.js \
    webroot/frontlamp.js \
    webroot/gui_logic_functions.js \
    webroot/helpers.js \
    webroot/horn.js \
    webroot/mirror.js \
    webroot/picaxeinterface.js \
    webroot/protocol.js \
    webroot/rearlamp.js \
    webroot/terminal.js \
    webroot/widgetbase.js \
    webroot/connect.png \
    webroot/disconnect.png \
    webroot/dashboard_template.htm \
    webroot/frontlamp_template.htm \
    webroot/horn_template.htm \
    webroot/index.html \
    webroot/mirror_template.htm \
    webroot/rearlamp_template.htm \
    webroot/speedometer_template.htm \
    webroot/terminal.html \
    webroot/gearselector.js





