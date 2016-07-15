#ifndef WEBSOCKETSERVER_H
#define WEBSOCKETSERVER_H

#include <QObject>
#include <QList>
#include <QByteArray>
#include "canpids.h"


QT_FORWARD_DECLARE_CLASS(QWebSocketServer)
QT_FORWARD_DECLARE_CLASS(QWebSocket)
QT_FORWARD_DECLARE_CLASS(QJsonObject)


class WebSocketServer : public QObject
{
    Q_OBJECT

    Q_PROPERTY(quint16 port READ port WRITE setPort NOTIFY portChanged)
    Q_PROPERTY(bool running READ running WRITE setRunning NOTIFY runningChanged)
    Q_PROPERTY(QString errorString READ errorString NOTIFY errorStringChanged)
    Q_PROPERTY(int connections READ connections NOTIFY connectionsChanged)
    Q_PROPERTY(int proxyConnections READ proxyConnections NOTIFY proxyConnectionsChanged)
    Q_PROPERTY(bool proxySlave READ proxySlave NOTIFY proxySlaveChanged)


public:
    explicit WebSocketServer(CanPids *canPid, quint16 port = 8080, QObject *parent = 0);
    ~WebSocketServer();

    enum RequestTypes {
        UnKnown,  // unknown cmd
        InValid,  // cmd known byt doesnt meet criteria
        ErrorFrame, // a frame containing error
        ClientSetOneData,  // update single pid in server
        ClientRequestOneData,  // client requests single pid data
        ClientGetsOneData, // server push single pid data
        ServerPushesAllData,  // server pushes all pids
        ServerPullReqForAllData,  // server requests a pulls all pid data from another proxy server
        ServerIsProxySlave,       // server is a slave to a another proxy, ised to disable timerfunctions
                                  //         ie blink function, horn etc.

        MsgFrame                  // generic type to send messages back and forth
    };

    quint16 port() const;
    void setPort(quint16 port);

    void start();
    void stop();

    bool running() const;
    void setRunning(bool run);
    QString errorString() const;

    bool proxySlave() const;

    // No of clients connected
    int connections() const;
    int proxyConnections() const;

    Q_INVOKABLE bool connectToRemoteProxySlave(const QString &url);
    Q_INVOKABLE QVariantList remoteProxies() const;
    Q_INVOKABLE bool disconnectFromRemoteProxySlave(const QString &url);


signals:
    void portChanged();
    void runningChanged();
    void errorStringChanged();
    void connectionsChanged();
    void proxyConnectionsChanged();
    void proxySlaveChanged();

public slots:

private slots:
    void onNewConnection();
    void processMessageFromClient(const QString &msg);
    void processMessageFromProxy(const QString &msg);
    void clientDisconnected();
    void proxyDisconnected();
    void proxyConnected();
    void broadcast(const QString &key, quint8 value);
    void canConnectionChanged(bool connected);

private:
    void sendToClients(const QJsonObject &responseObj, const QWebSocket* const excludeClient = nullptr);
    void sendToClients(const QString &jsonStr, const QWebSocket * const excludeClient = nullptr);

    void sendToProxies(const QJsonObject &responseObj, const QWebSocket* const excludeProxy = nullptr);
    void sendToProxies(const QString &jsonStr, const QWebSocket * const excludeProxy = nullptr);

    void processMessage(const QString &msg, const QString &type, QWebSocket *senderSocket = nullptr);

    RequestTypes requestType(const QJsonDocument &jsonDoc);

    typedef QHash<const QString, QWebSocket *> ProxyStoreType;

    QWebSocketServer    *m_webSocketServer;
    CanPids             *m_canPids;
    QList<QWebSocket *>  m_clients;
    ProxyStoreType       m_remoteProxies;
    quint32              m_port;
    QString              m_errorString;
    QWebSocket          *m_proxyMaster;  // the client that controls this app,
                                         // sets this app to act as a slave
    QWebSocket          *m_pendingConnectionSlave;
};

#endif // WEBSOCKETSERVER_H
