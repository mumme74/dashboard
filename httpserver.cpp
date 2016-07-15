#include "httpserver.h"

#include <QDir>
#include <QHostAddress>
#include <QCoreApplication>

HttpServer::HttpServer(quint16 port, QObject *parent) :
    QObject(parent),
    m_port(port)
{

}

HttpServer::~HttpServer()
{

}

void HttpServer::start()
{

    // Obtain the values
    QHostAddress address = QHostAddress("localhost");
    QString webroot = QCoreApplication::applicationDirPath() + "/webroot/";

    // Create the filesystem handler and server
    m_handler.setDocumentRoot(webroot);
    m_server.setHandler(&m_handler);

    // Attempt to listen on the specified port
    if(!m_server.listen(address, m_port)) {
        m_errString = "Unable to listen on the specified port.";
        qCritical("%s", qPrintable(m_errString));
        emit errorStringChanged();
    } else if (m_errString.length() > 0) {
        m_errString = "";
        emit errorStringChanged();
    }

    emit runningChanged();
}

void HttpServer::stop()
{
    if (m_errString.length() > 0) {
        m_errString = "";
        emit errorStringChanged();
    }

    m_server.close();
    emit runningChanged();
}

bool HttpServer::running() const
{
    return m_server.isListening();
}

void HttpServer::setRunning(bool run)
{
    if (!m_server.isListening() && run)
        start();
    else if(m_server.isListening() && !run)
        stop();
}

QString HttpServer::errorString() const
{
    return m_errString;
}

qint16 HttpServer::port() const
{
    return m_port;
}

void HttpServer::setPort(quint16 port)
{
    if (m_server.isListening()) {
        m_errString = "Cont set port while server is running";
        qCritical("%s", qPrintable(m_errString));
        emit errorStringChanged();
    } else {
        m_port = port;
        emit portChanged();
    }
}
