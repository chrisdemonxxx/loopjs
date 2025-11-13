#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <chrono>

namespace StealthClient {
namespace Evasion {

class SandboxDetection {
private:
    // VM Detection
    bool CheckVMwareArtifacts();
    bool CheckVirtualBoxArtifacts();
    bool CheckQEMUArtifacts();
    bool CheckHyperVArtifacts();
    bool CheckVMwareRegistry();
    bool CheckVirtualBoxRegistry();
    bool CheckVMwareFiles();
    bool CheckVirtualBoxFiles();
    bool CheckVMwareProcesses();
    bool CheckVirtualBoxProcesses();
    
    // Hardware Detection
    bool CheckCPUCores();
    bool CheckRAMSize();
    bool CheckDiskSize();
    bool CheckHardwareInfo();
    bool CheckCPUBrand();
    bool CheckMotherboardInfo();
    
    // Timing Detection
    bool CheckTimingAttack();
    bool CheckSleepAcceleration();
    bool CheckPerformanceCounters();
    
    // Process Detection
    bool CheckSandboxProcesses();
    bool CheckAnalysisTools();
    bool CheckDebuggerProcesses();
    bool CheckMonitoringTools();
    
    // File System Detection
    bool CheckSandboxFiles();
    bool CheckUserProfiles();
    bool CheckRecentFiles();
    bool CheckDesktopFiles();
    
    // Registry Detection
    bool CheckSandboxRegistry();
    bool CheckInstalledSoftware();
    bool CheckSystemInfo();
    
    // Network Detection
    bool CheckNetworkAdapters();
    bool CheckDNSConfiguration();
    bool CheckProxySettings();
    
    // Memory Detection
    bool CheckMemoryLayout();
    bool CheckLoadedModules();
    bool CheckSystemDLLs();
    
    // Helper functions
    std::string GetRegistryValue(HKEY hKey, const std::string& subKey, const std::string& valueName);
    bool FileExists(const std::string& path);
    bool ProcessExists(const std::string& processName);
    DWORD GetProcessCount(const std::string& processName);
    std::vector<std::string> GetLoadedModules();
    std::vector<std::string> GetNetworkAdapters();
    
public:
    SandboxDetection();
    ~SandboxDetection();
    
    // Main detection functions
    bool IsVirtualMachine();
    bool IsSandbox();
    bool IsAnalysisEnvironment();
    bool ShouldExecute();
    
    // Individual detection methods
    bool DetectVMware();
    bool DetectVirtualBox();
    bool DetectQEMU();
    bool DetectHyperV();
    bool DetectVMwareWorkstation();
    bool DetectVMwarePlayer();
    bool DetectVirtualPC();
    bool DetectParallels();
    bool DetectXen();
    bool DetectKVM();
    
    // Sandbox-specific detection
    bool DetectCuckooSandbox();
    bool DetectJoeSandbox();
    bool DetectThreatGrid();
    bool DetectFireEye();
    bool DetectCrowdStrike();
    bool DetectSentinelOne();
    bool DetectCylance();
    bool DetectWindowsDefender();
    bool DetectKaspersky();
    bool DetectNorton();
    bool DetectMcAfee();
    bool DetectBitdefender();
    bool DetectESET();
    bool DetectAvast();
    bool DetectAVG();
    
    // Advanced detection
    bool DetectDebugger();
    bool DetectEmulator();
    bool DetectHoneypot();
    bool DetectResearchEnvironment();
    
    // Evasion techniques
    bool EvadeTimingDetection();
    bool EvadeProcessDetection();
    bool EvadeFileDetection();
    bool EvadeRegistryDetection();
    bool EvadeNetworkDetection();
    bool EvadeMemoryDetection();
    
    // Get detection results
    std::vector<std::string> GetDetectionResults();
    std::string GetDetectionSummary();
    int GetDetectionScore();
    
    // Configuration
    void SetDetectionThreshold(int threshold);
    void EnableAdvancedDetection(bool enable);
    void SetEvasionMode(bool enable);
    
private:
    int m_detectionThreshold;
    bool m_advancedDetection;
    bool m_evasionMode;
    std::vector<std::string> m_detectionResults;
    
    // Timing variables
    std::chrono::high_resolution_clock::time_point m_startTime;
    std::chrono::high_resolution_clock::time_point m_endTime;
};

// Global instance
extern SandboxDetection g_SandboxDetection;

// Convenience functions
bool IsVirtualMachine();
bool IsSandbox();
bool IsAnalysisEnvironment();
bool ShouldExecute();
std::string GetDetectionSummary();

} // namespace Evasion
} // namespace StealthClient
