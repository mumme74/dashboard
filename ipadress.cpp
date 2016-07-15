#include "ipadress.h"
#include <QNetworkAddressEntry>
#include <QNetworkInterface>
#include <QHostAddress>

IpAdress::IpAdress(QObject *parent) :
    QObject(parent)
{
}

IpAdress::~IpAdress()
{
}

QString IpAdress::ip()
{
        QList<QNetworkInterface> ifaces = QNetworkInterface::allInterfaces();
        if (ifaces.count() == 0) {
            qCritical() << "No network interfaces on this machine"<< endl;
            return "";
        }

        Q_FOREACH(QNetworkInterface iface, ifaces) {
            QList<QNetworkAddressEntry> addrEntries = iface.addressEntries();
            Q_FOREACH(QNetworkAddressEntry addrEntry, addrEntries) {
                QHostAddress addr = addrEntry.ip();
                if (addr.isLoopback() || addr.isNull() || addr.LocalHost)
                    continue;

                // filter out unwanted adresses
                bool ok = false;
                quint32 adr = addr.toIPv4Address(&ok);
                if ( ok && addr ==  QHostAddress(QHostAddress::LocalHost) &&
                    ((adr & 0x7f000000) == 0x7f000000 || // 127.x.x.x
                     (adr & 0xA9FE0000) == 0xA9FE0000)   // 169.254.x.x
                ){
                    continue;
                }

                if (addr.protocol() != QAbstractSocket::IPv4Protocol)
                    continue;

                return addr.toString();
            }

        }

    return "";
}
