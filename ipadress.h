#ifndef IPADRESS_H
#define IPADRESS_H

#include <QObject>

/**
 * @brief Gets the current IP from this machine
 */
class IpAdress : public QObject
{
    Q_OBJECT
    Q_PROPERTY(QString ip READ ip NOTIFY ipChanged)
public:
    explicit IpAdress(QObject *parent = 0);
    ~IpAdress();

    QString ip();

signals:
    void ipChanged();
public slots:
private:
};

#endif // IPADRESS_H
