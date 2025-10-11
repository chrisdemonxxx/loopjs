#pragma once
#include <windows.h>
#include <string>
#include <vector>
#include <cstdint>

namespace StealthClient {
namespace Evasion {

// CPU feature detection and bypass
class HardwareEvasion {
private:
    // CPU feature detection
    bool DetectIntelCET();
    bool DetectSMEP();
    bool DetectSMAP();
    bool DetectNX();
    bool DetectDEP();
    bool DetectASLR();
    bool DetectCFG();
    bool DetectHVCI();
    bool DetectKPTI();
    bool DetectRetpoline();
    
    // CPU feature bypass
    bool BypassIntelCET();
    bool BypassSMEP();
    bool BypassSMAP();
    bool BypassNX();
    bool BypassDEP();
    bool BypassASLR();
    bool BypassCFG();
    bool BypassHVCI();
    bool BypassKPTI();
    bool BypassRetpoline();
    
    // Hardware information
    std::string GetCPUBrand();
    std::string GetCPUVendor();
    int GetCPUCores();
    int GetCPUThreads();
    std::string GetCPUCacheInfo();
    std::string GetCPUFeatures();
    
    // Memory protection features
    bool HasExecuteDisable();
    bool HasNoExecute();
    bool HasWriteProtect();
    bool HasSupervisorModeAccessPrevention();
    bool HasSupervisorModeExecutionPrevention();
    
    // Advanced CPU features
    bool HasAVX();
    bool HasAVX2();
    bool HasAVX512();
    bool HasAES();
    bool HasSHA();
    bool HasRDRAND();
    bool HasRDSEED();
    bool HasBMI1();
    bool HasBMI2();
    bool HasADX();
    bool HasCLMUL();
    bool HasFMA();
    bool HasF16C();
    bool HasPCLMULQDQ();
    bool HasSSE();
    bool HasSSE2();
    bool HasSSE3();
    bool HasSSSE3();
    bool HasSSE4_1();
    bool HasSSE4_2();
    
    // Security features
    bool HasIntelTSX();
    bool HasIntelMPX();
    bool HasIntelCET();
    bool HasIntelPT();
    bool HasIntelSGX();
    bool HasIntelTDX();
    bool HasAMDSEV();
    bool HasAMDSME();
    bool HasAMDSNP();
    
    // Helper functions
    void ExecuteCPUID(int function, int subfunction, int* eax, int* ebx, int* ecx, int* edx);
    bool CheckCPUIDFeature(int function, int subfunction, int bit);
    std::string GetCPUIDString(int function);
    
public:
    HardwareEvasion();
    ~HardwareEvasion();
    
    // Main detection functions
    bool DetectSecurityFeatures();
    std::vector<std::string> GetDetectedFeatures();
    std::string GetFeatureSummary();
    
    // Bypass functions
    bool BypassAllSecurityFeatures();
    bool BypassHardwareProtections();
    bool BypassMemoryProtections();
    bool BypassExecutionProtections();
    
    // Individual bypass methods
    bool BypassCET();
    
    // Advanced bypass techniques
    bool UseROPToBypassCET();
    bool UseJOPToBypassSMEP();
    bool UseRetpolineToBypassSpectre();
    bool UseMeltdownToBypassKPTI();
    bool UseSpectreToBypassASLR();
    bool UseMDSToBypassSMAP();
    
    // Hardware-based evasion
    bool EvadeHardwareMonitoring();
    bool EvadePerformanceCounters();
    bool EvadeCacheTiming();
    bool EvadeBranchPrediction();
    bool EvadeSpeculativeExecution();
    
    // CPU-specific techniques
    bool UseIntelSpecificBypass();
    bool UseAMDSpecificBypass();
    bool UseGenericBypass();
    
    // Status and information
    bool IsFeatureDetected(const std::string& feature);
    bool IsFeatureBypassed(const std::string& feature);
    std::string GetHardwareInfo();
    std::string GetBypassStatus();
    
private:
    std::vector<std::string> m_detectedFeatures;
    std::vector<std::string> m_bypassedFeatures;
    std::string m_cpuBrand;
    std::string m_cpuVendor;
    int m_cpuCores;
    int m_cpuThreads;
    bool m_initialized;
    
    void InitializeHardwareInfo();
};

// Global instance
extern HardwareEvasion g_HardwareEvasion;

// Convenience functions
bool DetectSecurityFeatures();
bool BypassAllSecurityFeatures();
bool BypassCET();
bool BypassSMEP();
bool BypassSMAP();
std::string GetHardwareInfo();
std::string GetFeatureSummary();

// Hardware feature constants
namespace HardwareFeatures {
    const std::string INTEL_CET = "Intel CET";
    const std::string SMEP = "SMEP";
    const std::string SMAP = "SMAP";
    const std::string NX = "NX";
    const std::string DEP = "DEP";
    const std::string ASLR = "ASLR";
    const std::string CFG = "CFG";
    const std::string HVCI = "HVCI";
    const std::string KPTI = "KPTI";
    const std::string RETPOLINE = "Retpoline";
    const std::string AVX = "AVX";
    const std::string AVX2 = "AVX2";
    const std::string AVX512 = "AVX512";
    const std::string AES = "AES";
    const std::string SHA = "SHA";
    const std::string RDRAND = "RDRAND";
    const std::string RDSEED = "RDSEED";
    const std::string BMI1 = "BMI1";
    const std::string BMI2 = "BMI2";
    const std::string ADX = "ADX";
    const std::string CLMUL = "CLMUL";
    const std::string FMA = "FMA";
    const std::string F16C = "F16C";
    const std::string PCLMULQDQ = "PCLMULQDQ";
    const std::string SSE = "SSE";
    const std::string SSE2 = "SSE2";
    const std::string SSE3 = "SSE3";
    const std::string SSSE3 = "SSSE3";
    const std::string SSE4_1 = "SSE4.1";
    const std::string SSE4_2 = "SSE4.2";
    const std::string INTEL_TSX = "Intel TSX";
    const std::string INTEL_MPX = "Intel MPX";
    const std::string INTEL_PT = "Intel PT";
    const std::string INTEL_SGX = "Intel SGX";
    const std::string INTEL_TDX = "Intel TDX";
    const std::string AMD_SEV = "AMD SEV";
    const std::string AMD_SME = "AMD SME";
    const std::string AMD_SNP = "AMD SNP";
}

// Bypass techniques
namespace BypassTechniques {
    const std::string ROP = "ROP";
    const std::string JOP = "JOP";
    const std::string RETPOLINE = "Retpoline";
    const std::string MELTDOWN = "Meltdown";
    const std::string SPECTRE = "Spectre";
    const std::string MDS = "MDS";
    const std::string PLATYPUS = "Platypus";
    const std::string L1TF = "L1TF";
    const std::string MCE = "MCE";
    const std::string TAA = "TAA";
    const std::string ITLBMH = "ITLBMH";
    const std::string SRBDS = "SRBDS";
    const std::string MMIO = "MMIO";
    const std::string RETBLEED = "Retbleed";
    const std::string BRANCH_TYPE_CONFUSION = "Branch Type Confusion";
    const std::string INTEL_DOWNFALL = "Intel Downfall";
    const std::string AMD_INCEPTION = "AMD Inception";
}

} // namespace Evasion
} // namespace StealthClient
