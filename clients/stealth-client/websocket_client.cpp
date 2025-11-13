#include "websocket_client.h"
#include <iostream>
#include <sstream>
#include <regex>
#include <chrono>
#include <thread>
#include <random>
#include <algorithm>

namespace StealthClient {

WebSocketClient::WebSocketClient()
    : m_socket(INVALID_SOCKET)
    , m_port(80)
    , m_use_ssl(false)
    , m_running(false)
    , m_connected(false)
    , m_auto_reconnect(true)
    , m_reconnect_interval(5)
    , m_reconnect_running(false)
    , m_encryption_enabled(false)
{
#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif
    
    // Initialize encryption
    InitializeEncryption();
}

WebSocketClient::~WebSocketClient()
{
    Disconnect();
    CleanupEncryption();
#ifdef _WIN32
    WSACleanup();
#endif
}

bool WebSocketClient::Connect(const std::string& url)
{
    std::cout << "[Stealth][WebSocket] Connecting to: " << url << std::endl;
    
    // Parse URL
    std::regex urlRegex(R"(ws://([^:/]+)(?::(\d+))?(/.*)?)");
    std::smatch matches;
    
    if (!std::regex_match(url, matches, urlRegex)) {
        std::cerr << "[Stealth][WebSocket] Invalid URL format: " << url << std::endl;
        return false;
    }
    
    m_host = matches[1].str();
    m_port = matches[2].str().empty() ? 80 : std::stoi(matches[2].str());
    m_path = matches[3].str().empty() ? "/" : matches[3].str();
    m_url = url;
    
    std::cout << "[Stealth][WebSocket] Parsed URL - Host: " << m_host << ", Port: " << m_port << ", Path: " << m_path << std::endl;
    
    // Create socket
    m_socket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (m_socket == INVALID_SOCKET) {
        std::cerr << "[Stealth][WebSocket] Failed to create socket" << std::endl;
        return false;
    }
    
    // Connect to server
    sockaddr_in serverAddr = {};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_port = htons(m_port);
    
    if (inet_pton(AF_INET, m_host.c_str(), &serverAddr.sin_addr) <= 0) {
        // Try to resolve hostname
        hostent* host = gethostbyname(m_host.c_str());
        if (!host) {
            std::cerr << "[Stealth][WebSocket] Failed to resolve hostname: " << m_host << std::endl;
            closesocket(m_socket);
            return false;
        }
        memcpy(&serverAddr.sin_addr, host->h_addr_list[0], host->h_length);
    }
    
    if (connect(m_socket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "[Stealth][WebSocket] Failed to connect to server" << std::endl;
        closesocket(m_socket);
        return false;
    }
    
    std::cout << "[Stealth][WebSocket] TCP connection established" << std::endl;
    
    // Perform WebSocket handshake
    if (!PerformWebSocketHandshake()) {
        std::cerr << "[Stealth][WebSocket] WebSocket handshake failed" << std::endl;
        closesocket(m_socket);
        return false;
    }
    
    std::cout << "[Stealth][WebSocket] WebSocket handshake successful" << std::endl;
    
    m_connected = true;
    m_running = true;
    
    // Start event loop
    m_event_thread = std::make_unique<std::thread>(&WebSocketClient::RunEventLoop, this);
    
    // Call connection callback
    if (m_connection_callback) {
        m_connection_callback(true);
    }
    
    return true;
}

void WebSocketClient::Disconnect()
{
    if (!m_connected) {
        return;
    }
    
    std::cout << "[Stealth][WebSocket] Disconnecting..." << std::endl;
    
    m_running = false;
    m_connected = false;
    
    if (m_event_thread && m_event_thread->joinable()) {
        m_event_thread->join();
    }
    
    if (m_socket != INVALID_SOCKET) {
        closesocket(m_socket);
        m_socket = INVALID_SOCKET;
    }
    
    // Call connection callback
    if (m_connection_callback) {
        m_connection_callback(false);
    }
    
    std::cout << "[Stealth][WebSocket] Disconnected" << std::endl;
}

bool WebSocketClient::IsConnected() const
{
    return m_connected;
}

bool WebSocketClient::SendMessage(const std::string& message)
{
    if (!m_connected) {
        std::cerr << "[Stealth][WebSocket] Cannot send message: not connected" << std::endl;
        return false;
    }
    
    std::string frame = CreateWebSocketFrame(message);
    int bytesSent = send(m_socket, frame.c_str(), static_cast<int>(frame.length()), 0);
    
    if (bytesSent == SOCKET_ERROR) {
        std::cerr << "[Stealth][WebSocket] Failed to send message" << std::endl;
        return false;
    }
    
    std::cout << "[Stealth][WebSocket] Sent message (" << bytesSent << " bytes)" << std::endl;
    return true;
}

void WebSocketClient::SetMessageCallback(MessageCallback callback)
{
    m_message_callback = callback;
}

void WebSocketClient::SetConnectionCallback(ConnectionCallback callback)
{
    m_connection_callback = callback;
}

void WebSocketClient::SetErrorCallback(ErrorCallback callback)
{
    m_error_callback = callback;
}

void WebSocketClient::SetReconnectInterval(int seconds)
{
    m_reconnect_interval = seconds;
}

void WebSocketClient::EnableAutoReconnect(bool enable)
{
    m_auto_reconnect = enable;
}

void WebSocketClient::RunEventLoop()
{
    std::cout << "[Stealth][WebSocket] Event loop started" << std::endl;
    
    char buffer[4096];
    
    while (m_running && m_connected) {
        fd_set readSet;
        FD_ZERO(&readSet);
        FD_SET(m_socket, &readSet);
        
        timeval timeout = {1, 0}; // 1 second timeout
        
        int result = select(0, &readSet, nullptr, nullptr, &timeout);
        
        if (result == SOCKET_ERROR) {
            std::cerr << "[Stealth][WebSocket] Select error" << std::endl;
            break;
        }
        
        if (result > 0 && FD_ISSET(m_socket, &readSet)) {
            int bytesReceived = recv(m_socket, buffer, sizeof(buffer) - 1, 0);
            
            if (bytesReceived > 0) {
                buffer[bytesReceived] = '\0';
                std::string frame(buffer, bytesReceived);
                std::string message = ParseWebSocketFrame(frame);
                
                if (!message.empty()) {
                    std::cout << "[Stealth][WebSocket] Received message (" << message.length() << " bytes)" << std::endl;
                    if (m_message_callback) {
                        m_message_callback(message);
                    }
                }
            } else if (bytesReceived == 0) {
                std::cout << "[Stealth][WebSocket] Connection closed by server" << std::endl;
                break;
            } else {
                std::cerr << "[Stealth][WebSocket] Receive error" << std::endl;
                break;
            }
        }
    }
    
    std::cout << "[Stealth][WebSocket] Event loop ended" << std::endl;
}

bool WebSocketClient::PerformWebSocketHandshake()
{
    std::string key = GenerateWebSocketKey();
    
    std::ostringstream request;
    request << "GET " << m_path << " HTTP/1.1\r\n";
    request << "Host: " << m_host << ":" << m_port << "\r\n";
    request << "Upgrade: websocket\r\n";
    request << "Connection: Upgrade\r\n";
    request << "Sec-WebSocket-Key: " << key << "\r\n";
    request << "Sec-WebSocket-Version: 13\r\n";
    request << "\r\n";
    
    std::string requestStr = request.str();
    std::cout << "[Stealth][WebSocket] Sending handshake request" << std::endl;
    
    if (send(m_socket, requestStr.c_str(), static_cast<int>(requestStr.length()), 0) == SOCKET_ERROR) {
        return false;
    }
    
    // Read response
    char buffer[1024];
    int bytesReceived = recv(m_socket, buffer, sizeof(buffer) - 1, 0);
    
    if (bytesReceived <= 0) {
        return false;
    }
    
    buffer[bytesReceived] = '\0';
    std::string response(buffer);
    
    std::cout << "[Stealth][WebSocket] Received handshake response" << std::endl;
    
    // Check if handshake was successful
    return response.find("101 Switching Protocols") != std::string::npos;
}

std::string WebSocketClient::CreateWebSocketFrame(const std::string& message)
{
    std::string frame;
    
    // FIN bit set, opcode 1 (text frame)
    frame.push_back(0x81);
    
    // Payload length
    size_t payloadLength = message.length();
    if (payloadLength < 126) {
        frame.push_back(static_cast<char>(payloadLength));
    } else if (payloadLength < 65536) {
        frame.push_back(126);
        frame.push_back(static_cast<char>((payloadLength >> 8) & 0xFF));
        frame.push_back(static_cast<char>(payloadLength & 0xFF));
    } else {
        frame.push_back(127);
        for (int i = 7; i >= 0; i--) {
            frame.push_back(static_cast<char>((payloadLength >> (i * 8)) & 0xFF));
        }
    }
    
    // Payload data
    frame += message;
    
    return frame;
}

std::string WebSocketClient::ParseWebSocketFrame(const std::string& frame)
{
    if (frame.length() < 2) {
        return "";
    }
    
    unsigned char firstByte = static_cast<unsigned char>(frame[0]);
    unsigned char secondByte = static_cast<unsigned char>(frame[1]);
    
    // Check if this is a text frame
    if ((firstByte & 0x0F) != 1) {
        return "";
    }
    
    // Get payload length
    size_t payloadLength = secondByte & 0x7F;
    size_t headerLength = 2;
    
    if (payloadLength == 126) {
        if (frame.length() < 4) return "";
        payloadLength = (static_cast<unsigned char>(frame[2]) << 8) | static_cast<unsigned char>(frame[3]);
        headerLength = 4;
    } else if (payloadLength == 127) {
        if (frame.length() < 10) return "";
        payloadLength = 0;
        for (int i = 0; i < 8; i++) {
            payloadLength = (payloadLength << 8) | static_cast<unsigned char>(frame[2 + i]);
        }
        headerLength = 10;
    }
    
    if (frame.length() < headerLength + payloadLength) {
        return "";
    }
    
    return frame.substr(headerLength, payloadLength);
}

std::string WebSocketClient::Base64Encode(const std::string& input)
{
    const std::string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string result;
    
    int val = 0, valb = -6;
    for (unsigned char c : input) {
        val = (val << 8) + c;
        valb += 8;
        while (valb >= 0) {
            result.push_back(chars[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) result.push_back(chars[((val << 8) >> (valb + 8)) & 0x3F]);
    while (result.size() % 4) result.push_back('=');
    
    return result;
}

std::string WebSocketClient::GenerateWebSocketKey()
{
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 255);
    
    std::string key(16, 0);
    for (char& c : key) {
        c = static_cast<char>(dis(gen));
    }
    
    return Base64Encode(key);
}

// Encryption methods
bool WebSocketClient::SendEncryptedMessage(const std::string& message)
{
    if (!m_encryption_enabled) {
        std::cerr << "[Stealth][WebSocket] Encryption not enabled" << std::endl;
        return false;
    }
    
    std::string encryptedMessage = EncryptMessage(message);
    return SendMessage(encryptedMessage);
}

bool WebSocketClient::PerformKeyExchange()
{
    std::cout << "[Stealth][WebSocket] Performing key exchange..." << std::endl;
    
    // Generate session keys
    m_encryption_key = Encryption::DeriveEncryptionKey("websocket");
    m_mac_key = Encryption::DeriveMACKey("websocket");
    m_iv = Encryption::DeriveIV("websocket");
    
    // Send public key to server
    std::string publicKey = Encryption::g_KeyExchangeProtocol.GetPublicKey();
    if (publicKey.empty()) {
        std::cerr << "[Stealth][WebSocket] Failed to get public key" << std::endl;
        return false;
    }
    
    // Send key exchange message
    std::string keyExchangeMsg = "KEY_EXCHANGE:" + publicKey;
    if (!SendMessage(keyExchangeMsg)) {
        std::cerr << "[Stealth][WebSocket] Failed to send key exchange message" << std::endl;
        return false;
    }
    
    std::cout << "[Stealth][WebSocket] Key exchange completed successfully" << std::endl;
    return true;
}

bool WebSocketClient::IsEncryptionEnabled() const
{
    return m_encryption_enabled;
}

void WebSocketClient::EnableEncryption(bool enable)
{
    m_encryption_enabled = enable;
    std::cout << "[Stealth][WebSocket] Encryption " << (enable ? "enabled" : "disabled") << std::endl;
}

std::string WebSocketClient::EncryptMessage(const std::string& message)
{
    std::lock_guard<std::mutex> lock(m_encryption_mutex);
    
    if (!m_encryption_enabled || m_encryption_key.empty()) {
        return message; // Return unencrypted if encryption not available
    }
    
    // Use XOR cipher for encryption
    std::vector<uint8_t> messageVec(message.begin(), message.end());
    std::vector<uint8_t> encryptedVec = Encryption::XOREncrypt(messageVec);
    
    // Convert to hex string for transmission
    std::string encryptedHex;
    for (uint8_t byte : encryptedVec) {
        char hex[3];
        sprintf_s(hex, "%02x", byte);
        encryptedHex += hex;
    }
    
    return encryptedHex;
}

std::string WebSocketClient::DecryptMessage(const std::string& encryptedMessage)
{
    std::lock_guard<std::mutex> lock(m_encryption_mutex);
    
    if (!m_encryption_enabled || m_encryption_key.empty()) {
        return encryptedMessage; // Return as-is if encryption not available
    }
    
    // Convert hex string back to bytes
    std::vector<uint8_t> encryptedVec;
    for (size_t i = 0; i < encryptedMessage.length(); i += 2) {
        if (i + 1 < encryptedMessage.length()) {
            std::string byteStr = encryptedMessage.substr(i, 2);
            uint8_t byte = static_cast<uint8_t>(std::stoul(byteStr, nullptr, 16));
            encryptedVec.push_back(byte);
        }
    }
    
    // Decrypt using XOR cipher
    std::vector<uint8_t> decryptedVec = Encryption::XORDecrypt(encryptedVec);
    
    return std::string(decryptedVec.begin(), decryptedVec.end());
}

bool WebSocketClient::InitializeEncryption()
{
    std::cout << "[Stealth][WebSocket] Initializing encryption..." << std::endl;
    
    // Initialize encryption services
    Encryption::g_StringEncryptionService.Initialize();
    Encryption::g_GlobalKeyManager.Initialize();
    
    // Generate initial keys
    m_encryption_key = Encryption::DeriveEncryptionKey("websocket_init");
    m_mac_key = Encryption::DeriveMACKey("websocket_init");
    m_iv = Encryption::DeriveIV("websocket_init");
    
    std::cout << "[Stealth][WebSocket] Encryption initialized successfully" << std::endl;
    return true;
}

void WebSocketClient::CleanupEncryption()
{
    std::lock_guard<std::mutex> lock(m_encryption_mutex);
    
    // Secure clear encryption keys
    Encryption::XORSecureClear(m_encryption_key);
    Encryption::XORSecureClear(m_mac_key);
    Encryption::XORSecureClear(m_iv);
    
    // Cleanup encryption services
    Encryption::g_StringEncryptionService.Shutdown();
    Encryption::g_GlobalKeyManager.Shutdown();
    
    std::cout << "[Stealth][WebSocket] Encryption cleaned up" << std::endl;
}

} // namespace StealthClient