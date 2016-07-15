#ifndef HTTPSERVER_H
#define HTTPSERVER_H

#include <QObject>

#include <QHttpEngine/QFilesystemHandler>
#include <QHttpEngine/QHttpServer>

class HttpServer : public QObject
{
    Q_OBJECT
    Q_PROPERTY(bool running READ running WRITE setRunning NOTIFY runningChanged)
    Q_PROPERTY(QString errorString READ errorString NOTIFY errorStringChanged)
    Q_PROPERTY(qint16 port READ port WRITE setPort NOTIFY portChanged)

public:
    explicit HttpServer(quint16 port = 8000, QObject *parent = 0);
    ~HttpServer();

    void start();
    void stop();

    bool running() const;
    void setRunning(bool run);

    QString errorString() const;
    qint16 port() const;
    void setPort(quint16 port);

signals:
    void runningChanged();
    void errorStringChanged();
    void portChanged();

public slots:

private:
    QFilesystemHandler m_handler;
    QHttpServer m_server;
    QString m_errString;
    qint32 m_port;
};

#endif // HTTPSERVER_H
