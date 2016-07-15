#include "websocketserver.h"


#include <QtWebSockets/QWebSocketServer>
#include <QtWebSockets/QWebSocket>
#include <QtCore/QDebug>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonValue>
#include <QJsonDocument>
#include <QQmlEngine>

WebSocketServer::WebSocketServer(CanPids *canPid, quint16 port, QObject *parent) :
    QObject(parent),
    m_webSocketServer(Q_NULLPTR),
    m_canPids(canPid),
    m_clients(),
    m_port(port),
    m_proxyMaster(nullptr),
    m_pendingConnectionSlave(nullptr)
{
    m_webSocketServer = new QWebSocketServer(QStringLiteral("WebSocketServer"),
                                            QWebSocketServer::NonSecureMode,
                                            this);

    connect(m_canPids, &CanPids::broadcastToWeb, this, &WebSocketServer::broadcast);
    connect(m_canPids, &CanPids::canConnectionChanged, this, &WebSocketServer::canConnectionChanged);


    qmlRegisterUncreatableType<WebSocketServer>("mummesoft", 0, 1, "WebSocketServer", QStringLiteral("Cant create WebSockServer from QML"));

    m_webSocketServer->setMaxPendingConnections(50);
}

WebSocketServer::~WebSocketServer()
{
    m_webSocketServer->close();
    qDeleteAll(m_clients.begin(), m_clients.end());
}


quint16 WebSocketServer::port() const
{
    return m_port;
}

void WebSocketServer::setPort(quint16 port)
{
    if (m_webSocketServer->isListening()) {
        m_errorString = "Cant set port when server is running";
        emit errorStringChanged();
    }

    m_port = port;
    emit portChanged();

}

void WebSocketServer::start()
{
    if (m_webSocketServer->listen(QHostAddress::Any, m_port))
    {
        connect(m_webSocketServer, &QWebSocketServer::newConnection,
                this, &WebSocketServer::onNewConnection);

        emit runningChanged();
    } else {
        m_errorString = m_webSocketServer->errorString();
        emit errorStringChanged();
    }
}

void WebSocketServer::stop()
{
    if (m_errorString.length() > 0) {
        m_errorString = "";
        emit errorStringChanged();
    }

    m_webSocketServer->close();
    qDeleteAll(m_clients.begin(), m_clients.end());
    qDeleteAll(m_remoteProxies.begin(), m_remoteProxies.end());
    m_clients.clear();

    emit runningChanged();
}

bool WebSocketServer::running() const
{
    return m_webSocketServer->isListening();
}

void WebSocketServer::setRunning(bool run)
{
    if (!m_webSocketServer->isListening() && run) {
        start();
    } else if (m_webSocketServer->isListening() && !run) {
        stop();
    }
}

QString WebSocketServer::errorString() const
{
    return m_errorString;
}

bool WebSocketServer::proxySlave() const
{
    return m_proxyMaster != nullptr;
}

int WebSocketServer::proxyConnections() const
{
    return m_remoteProxies.count();
}

int WebSocketServer::connections() const
{
    return m_clients.count();
}

bool WebSocketServer::connectToRemoteProxySlave(const QString &url)
{
    QString urlWs = url.trimmed();
    if (urlWs.indexOf(QRegExp("wss?://")) != 0)
        urlWs.prepend("ws://");

    // check if we already have this connection
    ProxyStoreType::const_iterator it = m_remoteProxies.constFind(urlWs);
    if (it != m_remoteProxies.constEnd())
        return true;  // already connected


    QWebSocket *proxy = new QWebSocket;
    connect(proxy, &QWebSocket::textMessageReceived, this, &WebSocketServer::processMessageFromProxy);
    connect(proxy, &QWebSocket::disconnected, this, &WebSocketServer::proxyDisconnected);
    connect(proxy, &QWebSocket::connected, this, &WebSocketServer::proxyConnected);

    m_remoteProxies.insert(urlWs, proxy);

    proxy->open(QUrl(urlWs));

    m_pendingConnectionSlave = proxy;

    emit proxyConnectionsChanged();

    QTextStream out(stdout);
    out << qPrintable(QString("connecting to \"%1\" to make it a slave to this app, now %2  connected proxies")
                      .arg(QUrl(urlWs).toString())
                      .arg(m_remoteProxies.count()).toLocal8Bit()) << endl;

    return true;
}

QVariantList WebSocketServer::remoteProxies() const
{
    QVariantList retObj;

    for(ProxyStoreType::key_iterator it = m_remoteProxies.keyBegin();
        it != m_remoteProxies.keyEnd(); ++it)
    {
        retObj.push_back((*it));
    }

    return retObj;
}

bool WebSocketServer::disconnectFromRemoteProxySlave(const QString &url)
{
    // check if we have this connection
    ProxyStoreType::iterator it = m_remoteProxies.find(url);
    if (it != m_remoteProxies.end()) {
        (*it)->close(); // cleanup in disconnect slot
        return true;
    }

    return false;
}

void WebSocketServer::onNewConnection()
{
    QWebSocket *clientSocket = m_webSocketServer->nextPendingConnection();

    connect(clientSocket, &QWebSocket::textMessageReceived, this, &WebSocketServer::processMessageFromClient);
    connect(clientSocket, &QWebSocket::disconnected, this, &WebSocketServer::clientDisconnected);

    m_clients << clientSocket;

    QTextStream out(stdout);
    out << qPrintable(QString("New client connected, now %1 connected clients").arg(m_clients.count()).toLocal8Bit()) << endl;


    clientSocket->sendTextMessage(QString("{\"CAN_connected\":%1}").arg(m_canPids->isCanConnected()));

    // push all our data by faking a pull command
    processMessage(QStringLiteral("{\"pull\":1}"), "client", clientSocket);

    emit connectionsChanged();
}

void WebSocketServer::processMessageFromClient(const QString &msg)
{
    processMessage(msg, QStringLiteral("client"));
}


void WebSocketServer::processMessageFromProxy(const QString &msg)
{
    processMessage(msg, QStringLiteral("proxy"));
}

void WebSocketServer::processMessage(const QString &msg, const QString &type, QWebSocket *senderSocket /* = nullptr */)
{
    QJsonDocument reqDoc(QJsonDocument::fromJson(msg.toLocal8Bit()));
    if (reqDoc.isNull()){
        qDebug() << qPrintable(type.toLocal8Bit()) << "requestObj couldn't' be validated:"
                 << qPrintable(msg.toLocal8Bit()) << endl;
        return;
    }


    // log error
    if (m_canPids == Q_NULLPTR) {
        qCritical() << "WebSockServer have no connection to CanPids" << endl;
        return;
    }

    if (senderSocket == nullptr)
        senderSocket = qobject_cast<QWebSocket *>(sender());

    QJsonObject requestObj = reqDoc.object();
    RequestTypes msgType = requestType(reqDoc);
    QJsonObject data;
    QJsonObject responseObj;

    switch(msgType) {
    case ClientGetsOneData: // data // we act as a webrowser client for all intenets and purpuses here
    case ClientSetOneData: {// cmd  , intended fallthrough

        QJsonObject cmd = requestObj[ msgType == RequestTypes::ClientGetsOneData ? "data" : "cmd" ].toObject();
        // update pid table
        m_canPids->updateFromWeb(cmd["pid"].toString(), static_cast<quint8>(cmd["vlu"].toInt()));

        data.insert("pid",cmd["pid"].toString());
        data.insert("vlu", cmd["vlu"].toInt());
        responseObj.insert("data", data);


        //  notify other webclients
        sendToClients(responseObj, senderSocket);
        sendToProxies(responseObj, senderSocket);

        if (requestObj.contains("id"))
            responseObj.insert("id", requestObj["id"]);

        if (senderSocket != m_proxyMaster)
            senderSocket->sendTextMessage(QJsonDocument(responseObj).toJson());
        break;
    }
    case ClientRequestOneData: {// get

        QJsonValue get = requestObj["get"];
        const CanPid *pid = m_canPids->getPid(get.toString());
        data.insert("pid", QJsonValue(pid->key()));
        data.insert("vlu", QJsonValue(pid->value()));
        responseObj.insert("data", data);
        senderSocket->sendTextMessage(QJsonDocument(responseObj).toJson());
        break;
    }
    case ServerPushesAllData: {// push
        // we should update all our data
        QJsonArray pushArr = requestObj["push"].toArray();
        foreach(QJsonValue dataObj, pushArr) {
            if (dataObj.isObject()){
                QJsonObject data = dataObj.toObject();
                QJsonObject::const_iterator pid = data.constFind("pid");
                QJsonObject::const_iterator vlu = data.constFind("vlu");

                if (pid != data.constEnd() && vlu != data.constEnd()) {
                    m_canPids->updateFromWeb(pid->toString(), vlu->toInt());
                }
            }
        }

        // notify
        data.insert("type","push");
        data.insert("payload", "ok");
        responseObj.insert("msg", data);
        if (requestObj.contains("id"))
            responseObj.insert("id", requestObj["id"]);

        senderSocket->sendTextMessage(QJsonDocument(responseObj).toJson());
        break;
    }
    case ServerPullReqForAllData: {// pull

        QJsonArray arr;
        foreach(const CanPid *pid, m_canPids->getAllPids()){
            QJsonObject data;
            data.insert("pid", QJsonValue(pid->key()));
            data.insert("vlu", QJsonValue(pid->value()));
            arr.append(data);
        }
        responseObj.insert("push", arr);
        senderSocket->sendTextMessage(QJsonDocument(responseObj).toJson());

        break;
    }
    case MsgFrame:
        break; // do nothing
    case ErrorFrame:
        qDebug() << qPrintable(type.toLocal8Bit()) << " error frame:"
                 << qPrintable(QJsonDocument(requestObj).toJson()) <<endl;
        break;
    case ServerIsProxySlave:
        m_proxyMaster = senderSocket;
        emit proxySlaveChanged();
        qDebug() << "setting this server as a proxyslave" << endl;
        break;
    case InValid:
        qDebug() << qPrintable(type.toLocal8Bit()) << " invalid data:"
                 << qPrintable(QJsonDocument(requestObj).toJson()) <<endl;
        break;
    case UnKnown: // fallthrough
    default:
        qDebug() << qPrintable(type.toLocal8Bit()) << " unkown data:"
                 << qPrintable(QJsonDocument(requestObj).toJson()) <<endl;
    }
}



void WebSocketServer::clientDisconnected()
{
    QWebSocket *client = qobject_cast<QWebSocket *>(sender());
    if (client)
    {
        m_clients.removeAll(client);
        client->deleteLater();

        emit connectionsChanged();

        QTextStream out(stdout);
        out << qPrintable(QString("A client disconnected, now %1 connected clients").arg(m_clients.count()).toLocal8Bit()) << endl;
    }
}


void WebSocketServer::proxyDisconnected()
{
    QWebSocket *proxy = qobject_cast<QWebSocket *>(sender());
    if (proxy) {
        ProxyStoreType::iterator it = m_remoteProxies.begin();
        while (it != m_remoteProxies.end()) {
            if ((*it) == proxy) {
                qDebug() <<  "ws proxy client closed:" << qPrintable((*it)->closeReason().toLocal8Bit())
                         <<" closeCode:" << (int)proxy->closeCode()
                         << " " << proxy->errorString()
                         << " " << qPrintable(proxy->origin().toLocal8Bit()) << endl;

                m_remoteProxies.remove(it.key());
                proxy->deleteLater();

                if (proxy == m_proxyMaster) {
                    m_proxyMaster = nullptr;
                    emit proxySlaveChanged();
                }

                QTextStream out(stdout);
                out << qPrintable(QString("A proxy disconnected, now %1 connected proxies").arg(m_remoteProxies.count()).toLocal8Bit()) << endl;

                emit proxyConnectionsChanged();
                return;
            }
            ++it;
        }
    }
}


void WebSocketServer::proxyConnected()
{
    QWebSocket *proxy = qobject_cast<QWebSocket *>(sender());
    if (proxy) {

        if (proxy == m_pendingConnectionSlave) {
            proxy->sendTextMessage("{\"setAsSlave\":1}");
        }

        // successfull connection, syncronize data
        // push to client by faking a pull command
        processMessage(QStringLiteral("{\"pull\":1}"), "proxy");


        // then request all of remotes pid data back to sync ourselfs
        proxy->sendTextMessage("{\"pull\":1}");

        QTextStream out(stdout);
        out << qPrintable(QString("A proxy is now connected, now %1 connected proxies").arg(m_remoteProxies.count()).toLocal8Bit()) << endl;
    }
}

void WebSocketServer::broadcast(const QString &key, quint8 value)
{
    QJsonObject pidVlu;
    pidVlu.insert("pid", QJsonValue(key));
    pidVlu.insert("vlu", QJsonValue(value));

    // web clients ie browsers
    QJsonObject clientJson;
    clientJson.insert("data", pidVlu);
    sendToClients(clientJson);

    // to our proxies
    QJsonObject proxyJson;
    proxyJson.insert("cmd", pidVlu);
    sendToProxies(proxyJson);
}

void WebSocketServer::canConnectionChanged(bool connected)
{
    sendToClients(QString("{\"CAN_connected\":%1}").arg(connected), m_proxyMaster);
}

void WebSocketServer::sendToClients(const QJsonObject &responseObj, const QWebSocket * const excludeClient)
{
    QJsonDocument responseDoc(responseObj);
    QString message(responseDoc.toJson());
    sendToClients(message, excludeClient);
}

void WebSocketServer::sendToClients(const QString &jsonStr, const QWebSocket* const excludeClient)
{
    Q_FOREACH (QWebSocket *client, m_clients)
    {
        if (client != excludeClient)
            client->sendTextMessage(jsonStr);
    }
}

void WebSocketServer::sendToProxies(const QJsonObject &responseObj, const QWebSocket * const excludeProxy)
{
    QJsonDocument responseDoc(responseObj);
    QString message(responseDoc.toJson());
    sendToProxies(message, excludeProxy);
}

void WebSocketServer::sendToProxies(const QString &jsonStr, const QWebSocket* const excludeProxy)
{
    Q_FOREACH (QWebSocket *proxy, m_remoteProxies)
    {
        if (proxy != excludeProxy)
            proxy->sendTextMessage(jsonStr);
    }
}

WebSocketServer::RequestTypes WebSocketServer::requestType(const QJsonDocument &jsonDoc)
{
     QJsonObject requestObj = jsonDoc.object();

    if (requestObj.contains("cmd")) {
       // client pushes single data to server
       // {"cmd": {"pid":"A", "vlu": 0}}
       QJsonValue cmd = requestObj["cmd"];
       if (cmd.isObject() &&
           cmd.toObject().contains("pid") &&
           cmd.toObject().contains("vlu"))
       {
           return RequestTypes::ClientSetOneData;

       }
       return RequestTypes::InValid;

    } else if (requestObj.contains("data")) {
        // server pushes single data to client (might be a a response to a update event)
        // {"data": {"pid": "A", "vlu": 0}}
        QJsonValue data = requestObj["data"];
        if (data.isObject() &&
            data.toObject().contains("pid") &&
            data.toObject().contains("vlu"))
        {
            return RequestTypes::ClientGetsOneData;
        }
        return RequestTypes::InValid;

    } else if (requestObj.contains("get")) {
        // client requests one pid data
        // {"get": "A"}
        QJsonValue get = requestObj["get"];
        if (get.isString() && get.toString().length() > 0 &&
            get.toString().length() < 3)
        {
            return RequestTypes::ClientRequestOneData;
        }

        return RequestTypes::InValid;

    } else if (requestObj.contains("push")) {
        // server pushes all its pid data
        // {"push": [{"pid":"A", "vlu":0}, {"pid":"B", "vlu":2}]}
        QJsonValue push = requestObj["push"];
        if (push.isArray()) {
            return RequestTypes::ServerPushesAllData;
        }
        return RequestTypes::InValid;
    } else if (requestObj.contains("pull")) {
        // server requests another server to push all its data to this proxy client
        // {"pull":int} where int is above 0
        QJsonValue pull = requestObj["pull"];
        if (pull.isDouble() && pull.toInt() > 0) {
            return RequestTypes::ServerPullReqForAllData;
        }
        return RequestTypes::InValid;

    } else if (requestObj.contains("err")) {
        // a error response
        // {"err":"error msg"}
        return RequestTypes::ErrorFrame;
    } else if (requestObj.contains("msg")) {
        // a msg request
        // {"msg":{"type":"custom type, "payload": "message or data"}}
        QJsonValue msg = requestObj["msg"];
        if (msg.isObject() &&
            msg.toObject().contains("type") &&
            msg.toObject().contains("payload"))
        {
            return RequestTypes::MsgFrame;
        }
        return RequestTypes::InValid;
    } else if (requestObj.contains("setAsSlave")) {
        // set this server app to act as a slave
        // {"setAsSlave":1}
        QJsonValue slave = requestObj["setAsSlave"];
        if (slave.toInt() == 1) {
            return RequestTypes::ServerIsProxySlave;
        }
        return RequestTypes::InValid;
    }

    return RequestTypes::UnKnown;

}



