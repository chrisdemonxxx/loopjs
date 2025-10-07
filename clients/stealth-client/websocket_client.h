#pragma once
#include <string>
#include <functional>
#include <memory>
#include <thread>
#include <atomic>
#include <mutex>
#include <condition_variable>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

namespace StealthClient {

// Message callback types
using MessageCallback = std::function<void(const std::string&)>;
using ConnectionCallback = std::function<void(bool)>;
using ErrorCallback = std::function<void(const std::string&)>;

// Simple WebSocket client implementation using Windows sockets
class WebSocketClient {
public:
    WebSocketClient();
    ~WebSocketClient();

    // Connection management
    bool Connect(const std::string& url);
    void Disconnect();
    bool IsConnected() const;

    // Message handling
    bool SendMessage(const std::string& message);
    void SetMessageCallback(MessageCallback callback);
    void SetConnectionCallback(ConnectionCallback callback);
    void SetErrorCallback(ErrorCallback callback);

    // Configuration
    void SetReconnectInterval(int seconds);
    void EnableAutoReconnect(bool enable);

private:
    // Internal methods
    void RunEventLoop();
    void HandleConnect();
    void HandleDisconnect();
    void HandleMessage(const std::string& message);
    void HandleError(const std::string& error);
    void StartReconnectTimer();
    bool PerformWebSocketHandshake();
    
    // WebSocket protocol helpers
    std::string CreateWebSocketFrame(const std::string& message);
    std::string ParseWebSocketFrame(const std::string& frame);
    std::string Base64Encode(const std::string& input);
    std::string GenerateWebSocketKey();

    // Member variables
    SOCKET m_socket;
    std::string m_url;
    std::string m_host;
    std::string m_path;
    int m_port;
    bool m_use_ssl;

    // Threading
    std::unique_ptr<std::thread> m_event_thread;
    std::atomic<bool> m_running;
    std::atomic<bool> m_connected;
    std::atomic<bool> m_auto_reconnect;
    int m_reconnect_interval;

    // Callbacks
    MessageCallback m_message_callback;
    ConnectionCallback m_connection_callback;
    ErrorCallback m_error_callback;

    // Message queue for sending
    std::string m_pending_message;
    std::mutex m_message_mutex;
    std::condition_variable m_message_cv;

    // Reconnection
    std::unique_ptr<std::thread> m_reconnect_thread;
    std::atomic<bool> m_reconnect_running;
};

} // namespace StealthClient
