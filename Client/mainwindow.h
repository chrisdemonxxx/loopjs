#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QWebSocket>

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

    QString getComputerName();

public slots:
    void onConnected();
    void onMessageReceived(const QString& strMessage);
    void onDisconnected();
    void onError(QAbstractSocket::SocketError socketError);

private:
    QWebSocket m_webSocket;
};
#endif // MAINWINDOW_H
