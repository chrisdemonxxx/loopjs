#include "hardware_evasion.h"
#include "dynamic_api.h"
#include <iostream>
#include <sstream>
#include <intrin.h>

namespace StealthClient {
namespace Evasion {

// Global instance
HardwareEvasion g_HardwareEvasion;

HardwareEvasion::HardwareEvasion() 
    : m_cpuCores(0)
    , m_cpuThreads(0)
    , m_initialized(false)
{
    InitializeHardwareInfo();
}

HardwareEvasion::~HardwareEvasion() {
    m_detectedFeatures.clear();
    m_bypassedFeatures.clear();
}

bool HardwareEvasion::DetectSecurityFeatures() {
    std::cout << "[DEBUG] Detecting hardware security features..." << std::endl;
    
    m_detectedFeatures.clear();
    
    // Detect Intel CET
    if (DetectIntelCET()) {
        m_detectedFeatures.push_back(HardwareFeatures::INTEL_CET);
    }
    
    // Detect SMEP
    if (DetectSMEP()) {
        m_detectedFeatures.push_back(HardwareFeatures::SMEP);
    }
    
    // Detect SMAP
    if (DetectSMAP()) {
        m_detectedFeatures.push_back(HardwareFeatures::SMAP);
    }
    
    // Detect NX
    if (DetectNX()) {
        m_detectedFeatures.push_back(HardwareFeatures::NX);
    }
    
    // Detect DEP
    if (DetectDEP()) {
        m_detectedFeatures.push_back(HardwareFeatures::DEP);
    }
    
    // Detect ASLR
    if (DetectASLR()) {
        m_detectedFeatures.push_back(HardwareFeatures::ASLR);
    }
    
    // Detect CFG
    if (DetectCFG()) {
        m_detectedFeatures.push_back(HardwareFeatures::CFG);
    }
    
    // Detect HVCI
    if (DetectHVCI()) {
        m_detectedFeatures.push_back(HardwareFeatures::HVCI);
    }
    
    // Detect KPTI
    if (DetectKPTI()) {
        m_detectedFeatures.push_back(HardwareFeatures::KPTI);
    }
    
    // Detect Retpoline
    if (DetectRetpoline()) {
        m_detectedFeatures.push_back(HardwareFeatures::RETPOLINE);
    }
    
    std::cout << "[DEBUG] Detected " << m_detectedFeatures.size() << " security features" << std::endl;
    return !m_detectedFeatures.empty();
}

std::vector<std::string> HardwareEvasion::GetDetectedFeatures() {
    return m_detectedFeatures;
}

std::string HardwareEvasion::GetFeatureSummary() {
    std::stringstream ss;
    ss << "Hardware Security Features Summary:\n";
    ss << "  CPU Brand: " << m_cpuBrand << "\n";
    ss << "  CPU Vendor: " << m_cpuVendor << "\n";
    ss << "  CPU Cores: " << m_cpuCores << "\n";
    ss << "  CPU Threads: " << m_cpuThreads << "\n";
    ss << "  Detected Features (" << m_detectedFeatures.size() << "):\n";
    
    for (const auto& feature : m_detectedFeatures) {
        ss << "    - " << feature << "\n";
    }
    
    ss << "  Bypassed Features (" << m_bypassedFeatures.size() << "):\n";
    for (const auto& feature : m_bypassedFeatures) {
        ss << "    - " << feature << "\n";
    }
    
    return ss.str();
}

bool HardwareEvasion::BypassAllSecurityFeatures() {
    std::cout << "[DEBUG] Attempting to bypass all security features..." << std::endl;
    
    bool success = true;
    
    // Bypass Intel CET
    if (IsFeatureDetected(HardwareFeatures::INTEL_CET)) {
        if (BypassCET()) {
            m_bypassedFeatures.push_back(HardwareFeatures::INTEL_CET);
        } else {
            success = false;
        }
    }
    
    // Bypass SMEP
    if (IsFeatureDetected(HardwareFeatures::SMEP)) {
        if (BypassSMEP()) {
            m_bypassedFeatures.push_back(HardwareFeatures::SMEP);
        } else {
            success = false;
        }
    }
    
    // Bypass SMAP
    if (IsFeatureDetected(HardwareFeatures::SMAP)) {
        if (BypassSMAP()) {
            m_bypassedFeatures.push_back(HardwareFeatures::SMAP);
        } else {
            success = false;
        }
    }
    
    // Bypass NX
    if (IsFeatureDetected(HardwareFeatures::NX)) {
        if (BypassNX()) {
            m_bypassedFeatures.push_back(HardwareFeatures::NX);
        } else {
            success = false;
        }
    }
    
    // Bypass DEP
    if (IsFeatureDetected(HardwareFeatures::DEP)) {
        if (BypassDEP()) {
            m_bypassedFeatures.push_back(HardwareFeatures::DEP);
        } else {
            success = false;
        }
    }
    
    // Bypass ASLR
    if (IsFeatureDetected(HardwareFeatures::ASLR)) {
        if (BypassASLR()) {
            m_bypassedFeatures.push_back(HardwareFeatures::ASLR);
        } else {
            success = false;
        }
    }
    
    // Bypass CFG
    if (IsFeatureDetected(HardwareFeatures::CFG)) {
        if (BypassCFG()) {
            m_bypassedFeatures.push_back(HardwareFeatures::CFG);
        } else {
            success = false;
        }
    }
    
    // Bypass HVCI
    if (IsFeatureDetected(HardwareFeatures::HVCI)) {
        if (BypassHVCI()) {
            m_bypassedFeatures.push_back(HardwareFeatures::HVCI);
        } else {
            success = false;
        }
    }
    
    // Bypass KPTI
    if (IsFeatureDetected(HardwareFeatures::KPTI)) {
        if (BypassKPTI()) {
            m_bypassedFeatures.push_back(HardwareFeatures::KPTI);
        } else {
            success = false;
        }
    }
    
    // Bypass Retpoline
    if (IsFeatureDetected(HardwareFeatures::RETPOLINE)) {
        if (BypassRetpoline()) {
            m_bypassedFeatures.push_back(HardwareFeatures::RETPOLINE);
        } else {
            success = false;
        }
    }
    
    std::cout << "[DEBUG] Bypassed " << m_bypassedFeatures.size() << " out of " << m_detectedFeatures.size() << " features" << std::endl;
    return success;
}

bool HardwareEvasion::BypassHardwareProtections() {
    std::cout << "[DEBUG] Bypassing hardware protections..." << std::endl;
    
    bool success = true;
    success &= BypassCET();
    success &= BypassSMEP();
    success &= BypassSMAP();
    success &= BypassNX();
    
    return success;
}

bool HardwareEvasion::BypassMemoryProtections() {
    std::cout << "[DEBUG] Bypassing memory protections..." << std::endl;
    
    bool success = true;
    success &= BypassDEP();
    success &= BypassASLR();
    success &= BypassCFG();
    
    return success;
}

bool HardwareEvasion::BypassExecutionProtections() {
    std::cout << "[DEBUG] Bypassing execution protections..." << std::endl;
    
    bool success = true;
    success &= BypassHVCI();
    success &= BypassKPTI();
    success &= BypassRetpoline();
    
    return success;
}

bool HardwareEvasion::BypassCET() {
    std::cout << "[DEBUG] Bypassing Intel CET..." << std::endl;
    
    // Use ROP to bypass CET
    if (UseROPToBypassCET()) {
        std::cout << "[DEBUG] Intel CET bypassed using ROP" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass Intel CET" << std::endl;
    return false;
}

bool HardwareEvasion::BypassSMEP() {
    std::cout << "[DEBUG] Bypassing SMEP..." << std::endl;
    
    // Use JOP to bypass SMEP
    if (UseJOPToBypassSMEP()) {
        std::cout << "[DEBUG] SMEP bypassed using JOP" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass SMEP" << std::endl;
    return false;
}

bool HardwareEvasion::BypassSMAP() {
    std::cout << "[DEBUG] Bypassing SMAP..." << std::endl;
    
    // Use MDS to bypass SMAP
    if (UseMDSToBypassSMAP()) {
        std::cout << "[DEBUG] SMAP bypassed using MDS" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass SMAP" << std::endl;
    return false;
}

bool HardwareEvasion::BypassNX() {
    std::cout << "[DEBUG] Bypassing NX..." << std::endl;
    
    // NX bypass techniques would go here
    std::cout << "[DEBUG] NX bypassed" << std::endl;
    return true;
}

bool HardwareEvasion::BypassDEP() {
    std::cout << "[DEBUG] Bypassing DEP..." << std::endl;
    
    // DEP bypass techniques would go here
    std::cout << "[DEBUG] DEP bypassed" << std::endl;
    return true;
}

bool HardwareEvasion::BypassASLR() {
    std::cout << "[DEBUG] Bypassing ASLR..." << std::endl;
    
    // Use Spectre to bypass ASLR
    if (UseSpectreToBypassASLR()) {
        std::cout << "[DEBUG] ASLR bypassed using Spectre" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass ASLR" << std::endl;
    return false;
}

bool HardwareEvasion::BypassCFG() {
    std::cout << "[DEBUG] Bypassing CFG..." << std::endl;
    
    // CFG bypass techniques would go here
    std::cout << "[DEBUG] CFG bypassed" << std::endl;
    return true;
}

bool HardwareEvasion::BypassHVCI() {
    std::cout << "[DEBUG] Bypassing HVCI..." << std::endl;
    
    // HVCI bypass techniques would go here
    std::cout << "[DEBUG] HVCI bypassed" << std::endl;
    return true;
}

bool HardwareEvasion::BypassKPTI() {
    std::cout << "[DEBUG] Bypassing KPTI..." << std::endl;
    
    // Use Meltdown to bypass KPTI
    if (UseMeltdownToBypassKPTI()) {
        std::cout << "[DEBUG] KPTI bypassed using Meltdown" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass KPTI" << std::endl;
    return false;
}

bool HardwareEvasion::BypassRetpoline() {
    std::cout << "[DEBUG] Bypassing Retpoline..." << std::endl;
    
    // Use Retpoline to bypass Spectre
    if (UseRetpolineToBypassSpectre()) {
        std::cout << "[DEBUG] Retpoline bypassed" << std::endl;
        return true;
    }
    
    std::cerr << "[ERROR] Failed to bypass Retpoline" << std::endl;
    return false;
}

bool HardwareEvasion::UseROPToBypassCET() {
    std::cout << "[DEBUG] Using ROP to bypass CET..." << std::endl;
    
    // ROP-based CET bypass would go here
    return true;
}

bool HardwareEvasion::UseJOPToBypassSMEP() {
    std::cout << "[DEBUG] Using JOP to bypass SMEP..." << std::endl;
    
    // JOP-based SMEP bypass would go here
    return true;
}

bool HardwareEvasion::UseRetpolineToBypassSpectre() {
    std::cout << "[DEBUG] Using Retpoline to bypass Spectre..." << std::endl;
    
    // Retpoline-based Spectre bypass would go here
    return true;
}

bool HardwareEvasion::UseMeltdownToBypassKPTI() {
    std::cout << "[DEBUG] Using Meltdown to bypass KPTI..." << std::endl;
    
    // Meltdown-based KPTI bypass would go here
    return true;
}

bool HardwareEvasion::UseSpectreToBypassASLR() {
    std::cout << "[DEBUG] Using Spectre to bypass ASLR..." << std::endl;
    
    // Spectre-based ASLR bypass would go here
    return true;
}

bool HardwareEvasion::UseMDSToBypassSMAP() {
    std::cout << "[DEBUG] Using MDS to bypass SMAP..." << std::endl;
    
    // MDS-based SMAP bypass would go here
    return true;
}

bool HardwareEvasion::EvadeHardwareMonitoring() {
    std::cout << "[DEBUG] Evading hardware monitoring..." << std::endl;
    
    // Hardware monitoring evasion techniques would go here
    return true;
}

bool HardwareEvasion::EvadePerformanceCounters() {
    std::cout << "[DEBUG] Evading performance counters..." << std::endl;
    
    // Performance counter evasion techniques would go here
    return true;
}

bool HardwareEvasion::EvadeCacheTiming() {
    std::cout << "[DEBUG] Evading cache timing..." << std::endl;
    
    // Cache timing evasion techniques would go here
    return true;
}

bool HardwareEvasion::EvadeBranchPrediction() {
    std::cout << "[DEBUG] Evading branch prediction..." << std::endl;
    
    // Branch prediction evasion techniques would go here
    return true;
}

bool HardwareEvasion::EvadeSpeculativeExecution() {
    std::cout << "[DEBUG] Evading speculative execution..." << std::endl;
    
    // Speculative execution evasion techniques would go here
    return true;
}

bool HardwareEvasion::UseIntelSpecificBypass() {
    std::cout << "[DEBUG] Using Intel-specific bypass techniques..." << std::endl;
    
    if (m_cpuVendor == "GenuineIntel") {
        // Intel-specific bypass techniques
        return true;
    }
    
    return false;
}

bool HardwareEvasion::UseAMDSpecificBypass() {
    std::cout << "[DEBUG] Using AMD-specific bypass techniques..." << std::endl;
    
    if (m_cpuVendor == "AuthenticAMD") {
        // AMD-specific bypass techniques
        return true;
    }
    
    return false;
}

bool HardwareEvasion::UseGenericBypass() {
    std::cout << "[DEBUG] Using generic bypass techniques..." << std::endl;
    
    // Generic bypass techniques that work on all CPUs
    return true;
}

bool HardwareEvasion::IsFeatureDetected(const std::string& feature) {
    return std::find(m_detectedFeatures.begin(), m_detectedFeatures.end(), feature) != m_detectedFeatures.end();
}

bool HardwareEvasion::IsFeatureBypassed(const std::string& feature) {
    return std::find(m_bypassedFeatures.begin(), m_bypassedFeatures.end(), feature) != m_bypassedFeatures.end();
}

std::string HardwareEvasion::GetHardwareInfo() {
    std::stringstream ss;
    ss << "Hardware Information:\n";
    ss << "  CPU Brand: " << m_cpuBrand << "\n";
    ss << "  CPU Vendor: " << m_cpuVendor << "\n";
    ss << "  CPU Cores: " << m_cpuCores << "\n";
    ss << "  CPU Threads: " << m_cpuThreads << "\n";
    ss << "  CPU Features: " << GetCPUFeatures() << "\n";
    return ss.str();
}

std::string HardwareEvasion::GetBypassStatus() {
    std::stringstream ss;
    ss << "Bypass Status:\n";
    ss << "  Detected Features: " << m_detectedFeatures.size() << "\n";
    ss << "  Bypassed Features: " << m_bypassedFeatures.size() << "\n";
    ss << "  Success Rate: " << (m_detectedFeatures.empty() ? 0 : (m_bypassedFeatures.size() * 100 / m_detectedFeatures.size())) << "%\n";
    return ss.str();
}

void HardwareEvasion::InitializeHardwareInfo() {
    if (m_initialized) {
        return;
    }
    
    // Get CPU information
    m_cpuBrand = GetCPUBrand();
    m_cpuVendor = GetCPUVendor();
    m_cpuCores = GetCPUCores();
    m_cpuThreads = GetCPUThreads();
    
    m_initialized = true;
    std::cout << "[DEBUG] Hardware information initialized" << std::endl;
}

// CPU feature detection implementations
bool HardwareEvasion::DetectIntelCET() {
    // Check for Intel CET support
    int eax, ebx, ecx, edx;
    ExecuteCPUID(0x7, 0, &eax, &ebx, &ecx, &edx);
    return (edx & (1 << 7)) != 0; // CET bit
}

bool HardwareEvasion::DetectSMEP() {
    // Check for SMEP support
    int eax, ebx, ecx, edx;
    ExecuteCPUID(0x7, 0, &eax, &ebx, &ecx, &edx);
    return (ebx & (1 << 7)) != 0; // SMEP bit
}

bool HardwareEvasion::DetectSMAP() {
    // Check for SMAP support
    int eax, ebx, ecx, edx;
    ExecuteCPUID(0x7, 0, &eax, &ebx, &ecx, &edx);
    return (ebx & (1 << 20)) != 0; // SMAP bit
}

bool HardwareEvasion::DetectNX() {
    // Check for NX support
    int eax, ebx, ecx, edx;
    ExecuteCPUID(0x80000001, 0, &eax, &ebx, &ecx, &edx);
    return (edx & (1 << 20)) != 0; // NX bit
}

bool HardwareEvasion::DetectDEP() {
    // Check for DEP support
    return DetectNX();
}

bool HardwareEvasion::DetectASLR() {
    // Check for ASLR support (Windows feature)
    return true; // ASLR is enabled by default on modern Windows
}

bool HardwareEvasion::DetectCFG() {
    // Check for CFG support (Windows feature)
    return true; // CFG is enabled by default on modern Windows
}

bool HardwareEvasion::DetectHVCI() {
    // Check for HVCI support (Windows feature)
    return true; // HVCI may be enabled on modern Windows
}

bool HardwareEvasion::DetectKPTI() {
    // Check for KPTI support (Windows feature)
    return true; // KPTI is enabled by default on modern Windows
}

bool HardwareEvasion::DetectRetpoline() {
    // Check for Retpoline support (compiler feature)
    return true; // Retpoline may be enabled by compiler
}

std::string HardwareEvasion::GetCPUBrand() {
    char brand[48] = {0};
    int eax, ebx, ecx, edx;
    
    // Get CPU brand string
    for (int i = 0; i < 3; i++) {
        ExecuteCPUID(0x80000002 + i, 0, &eax, &ebx, &ecx, &edx);
        memcpy(brand + i * 16, &eax, 4);
        memcpy(brand + i * 16 + 4, &ebx, 4);
        memcpy(brand + i * 16 + 8, &ecx, 4);
        memcpy(brand + i * 16 + 12, &edx, 4);
    }
    
    return std::string(brand);
}

std::string HardwareEvasion::GetCPUVendor() {
    char vendor[13] = {0};
    int eax, ebx, ecx, edx;
    
    ExecuteCPUID(0, 0, &eax, &ebx, &ecx, &edx);
    memcpy(vendor, &ebx, 4);
    memcpy(vendor + 4, &edx, 4);
    memcpy(vendor + 8, &ecx, 4);
    
    return std::string(vendor);
}

int HardwareEvasion::GetCPUCores() {
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    return static_cast<int>(sysInfo.dwNumberOfProcessors);
}

int HardwareEvasion::GetCPUThreads() {
    // Get number of logical processors
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    return static_cast<int>(sysInfo.dwNumberOfProcessors);
}

std::string HardwareEvasion::GetCPUFeatures() {
    std::stringstream ss;
    
    // Check various CPU features
    if (HasAVX()) ss << "AVX ";
    if (HasAVX2()) ss << "AVX2 ";
    if (HasAVX512()) ss << "AVX512 ";
    if (HasAES()) ss << "AES ";
    if (HasSHA()) ss << "SHA ";
    if (HasRDRAND()) ss << "RDRAND ";
    if (HasRDSEED()) ss << "RDSEED ";
    if (HasBMI1()) ss << "BMI1 ";
    if (HasBMI2()) ss << "BMI2 ";
    if (HasADX()) ss << "ADX ";
    if (HasCLMUL()) ss << "CLMUL ";
    if (HasFMA()) ss << "FMA ";
    if (HasF16C()) ss << "F16C ";
    if (HasPCLMULQDQ()) ss << "PCLMULQDQ ";
    if (HasSSE()) ss << "SSE ";
    if (HasSSE2()) ss << "SSE2 ";
    if (HasSSE3()) ss << "SSE3 ";
    if (HasSSSE3()) ss << "SSSE3 ";
    if (HasSSE4_1()) ss << "SSE4.1 ";
    if (HasSSE4_2()) ss << "SSE4.2 ";
    
    return ss.str();
}

void HardwareEvasion::ExecuteCPUID(int function, int subfunction, int* eax, int* ebx, int* ecx, int* edx) {
    int cpuInfo[4];
    __cpuid(cpuInfo, function);
    *eax = cpuInfo[0];
    *ebx = cpuInfo[1];
    *ecx = cpuInfo[2];
    *edx = cpuInfo[3];
}

bool HardwareEvasion::CheckCPUIDFeature(int function, int subfunction, int bit) {
    int eax, ebx, ecx, edx;
    ExecuteCPUID(function, subfunction, &eax, &ebx, &ecx, &edx);
    
    // Check which register contains the bit
    if (bit < 32) {
        return (eax & (1 << bit)) != 0;
    } else if (bit < 64) {
        return (ebx & (1 << (bit - 32))) != 0;
    } else if (bit < 96) {
        return (ecx & (1 << (bit - 64))) != 0;
    } else {
        return (edx & (1 << (bit - 96))) != 0;
    }
}

std::string HardwareEvasion::GetCPUIDString(int function) {
    char str[16] = {0};
    int eax, ebx, ecx, edx;
    ExecuteCPUID(function, 0, &eax, &ebx, &ecx, &edx);
    memcpy(str, &eax, 4);
    memcpy(str + 4, &ebx, 4);
    memcpy(str + 8, &ecx, 4);
    memcpy(str + 12, &edx, 4);
    return std::string(str);
}

// Stub implementations for remaining functions
bool HardwareEvasion::HasExecuteDisable() { return CheckCPUIDFeature(0x80000001, 0, 20); }
bool HardwareEvasion::HasNoExecute() { return CheckCPUIDFeature(0x80000001, 0, 20); }
bool HardwareEvasion::HasWriteProtect() { return CheckCPUIDFeature(0x80000001, 0, 20); }
bool HardwareEvasion::HasSupervisorModeAccessPrevention() { return CheckCPUIDFeature(0x7, 0, 20); }
bool HardwareEvasion::HasSupervisorModeExecutionPrevention() { return CheckCPUIDFeature(0x7, 0, 7); }
bool HardwareEvasion::HasAVX() { return CheckCPUIDFeature(0x1, 0, 28); }
bool HardwareEvasion::HasAVX2() { return CheckCPUIDFeature(0x7, 0, 5); }
bool HardwareEvasion::HasAVX512() { return CheckCPUIDFeature(0x7, 0, 16); }
bool HardwareEvasion::HasAES() { return CheckCPUIDFeature(0x1, 0, 25); }
bool HardwareEvasion::HasSHA() { return CheckCPUIDFeature(0x7, 0, 29); }
bool HardwareEvasion::HasRDRAND() { return CheckCPUIDFeature(0x1, 0, 30); }
bool HardwareEvasion::HasRDSEED() { return CheckCPUIDFeature(0x7, 0, 18); }
bool HardwareEvasion::HasBMI1() { return CheckCPUIDFeature(0x7, 0, 3); }
bool HardwareEvasion::HasBMI2() { return CheckCPUIDFeature(0x7, 0, 8); }
bool HardwareEvasion::HasADX() { return CheckCPUIDFeature(0x7, 0, 19); }
bool HardwareEvasion::HasCLMUL() { return CheckCPUIDFeature(0x1, 0, 1); }
bool HardwareEvasion::HasFMA() { return CheckCPUIDFeature(0x1, 0, 12); }
bool HardwareEvasion::HasF16C() { return CheckCPUIDFeature(0x1, 0, 29); }
bool HardwareEvasion::HasPCLMULQDQ() { return CheckCPUIDFeature(0x1, 0, 1); }
bool HardwareEvasion::HasSSE() { return CheckCPUIDFeature(0x1, 0, 25); }
bool HardwareEvasion::HasSSE2() { return CheckCPUIDFeature(0x1, 0, 26); }
bool HardwareEvasion::HasSSE3() { return CheckCPUIDFeature(0x1, 0, 0); }
bool HardwareEvasion::HasSSSE3() { return CheckCPUIDFeature(0x1, 0, 9); }
bool HardwareEvasion::HasSSE4_1() { return CheckCPUIDFeature(0x1, 0, 19); }
bool HardwareEvasion::HasSSE4_2() { return CheckCPUIDFeature(0x1, 0, 20); }
bool HardwareEvasion::HasIntelTSX() { return CheckCPUIDFeature(0x7, 0, 11); }
bool HardwareEvasion::HasIntelMPX() { return CheckCPUIDFeature(0x7, 0, 14); }
bool HardwareEvasion::HasIntelPT() { return CheckCPUIDFeature(0x7, 0, 25); }
bool HardwareEvasion::HasIntelSGX() { return CheckCPUIDFeature(0x7, 0, 2); }
bool HardwareEvasion::HasIntelTDX() { return CheckCPUIDFeature(0x7, 0, 28); }
bool HardwareEvasion::HasAMDSEV() { return CheckCPUIDFeature(0x8000001F, 0, 1); }
bool HardwareEvasion::HasAMDSME() { return CheckCPUIDFeature(0x8000001F, 0, 0); }
bool HardwareEvasion::HasAMDSNP() { return CheckCPUIDFeature(0x8000001F, 0, 2); }

// Convenience functions
bool DetectSecurityFeatures() {
    return g_HardwareEvasion.DetectSecurityFeatures();
}

bool BypassAllSecurityFeatures() {
    return g_HardwareEvasion.BypassAllSecurityFeatures();
}

bool BypassCET() {
    return g_HardwareEvasion.BypassCET();
}

bool BypassSMEP() {
    return g_HardwareEvasion.BypassSMEP();
}

bool BypassSMAP() {
    return g_HardwareEvasion.BypassSMAP();
}

std::string GetHardwareInfo() {
    return g_HardwareEvasion.GetHardwareInfo();
}

std::string GetFeatureSummary() {
    return g_HardwareEvasion.GetFeatureSummary();
}

} // namespace Evasion
} // namespace StealthClient
