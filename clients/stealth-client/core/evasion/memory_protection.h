#pragma once
#include <windows.h>
#include <vector>
#include <functional>

namespace StealthClient {
namespace Evasion {

// ROP (Return-Oriented Programming) structures
struct ROPGadget {
    void* address;
    std::vector<uint8_t> instructions;
    size_t size;
    std::string description;
};

struct ROPChain {
    std::vector<ROPGadget> gadgets;
    std::vector<uint8_t> payload;
    size_t totalSize;
};

// JOP (Jump-Oriented Programming) structures
struct JOPGadget {
    void* address;
    std::vector<uint8_t> instructions;
    size_t size;
    std::string description;
};

struct JOPChain {
    std::vector<JOPGadget> gadgets;
    std::vector<uint8_t> payload;
    size_t totalSize;
};

class MemoryProtectionBypass {
private:
    std::vector<ROPGadget> m_ropGadgets;
    std::vector<JOPGadget> m_jopGadgets;
    
    // ROP chain building
    bool FindROPGadgets(HMODULE module);
    bool BuildROPChain(const std::vector<std::string>& operations, ROPChain& chain);
    bool ExecuteROPChain(const ROPChain& chain, void* targetProcess = nullptr);
    
    // JOP chain building
    bool FindJOPGadgets(HMODULE module);
    bool BuildJOPChain(const std::vector<std::string>& operations, JOPChain& chain);
    bool ExecuteJOPChain(const JOPChain& chain, void* targetProcess = nullptr);
    
    // Memory manipulation
    bool AllocateMemoryWithROP(size_t size, void** address);
    bool ProtectMemoryWithROP(void* address, size_t size, DWORD protection);
    bool WriteMemoryWithROP(void* address, const void* data, size_t size);
    bool ReadMemoryWithROP(void* address, void* buffer, size_t size);
    
    // Helper functions
    bool IsValidGadget(void* address, size_t size);
    std::vector<uint8_t> DisassembleGadget(void* address, size_t size);
    bool ValidateROPChain(const ROPChain& chain);
    bool ValidateJOPChain(const JOPChain& chain);
    
public:
    MemoryProtectionBypass();
    ~MemoryProtectionBypass();
    
    // Main bypass functions
    bool AllocateProtectedMemory(size_t size, void** address);
    bool ExecuteWithROP(std::function<void()> operation);
    bool ExecuteWithJOP(std::function<void()> operation);
    
    // Memory protection bypass
    bool BypassDEP(void* address, size_t size);
    bool BypassASLR(void* address, size_t size);
    bool BypassCFG(void* address, size_t size);
    bool BypassCET(void* address, size_t size);
    
    // Advanced memory techniques
    bool UseROPForVirtualProtect(void* address, size_t size, DWORD protection);
    bool UseROPForVirtualAlloc(size_t size, DWORD allocationType, DWORD protection);
    bool UseROPForWriteProcessMemory(HANDLE process, void* address, const void* data, size_t size);
    bool UseROPForReadProcessMemory(HANDLE process, void* address, void* buffer, size_t size);
    
    // Gadget management
    void AddROPGadget(const ROPGadget& gadget);
    void AddJOPGadget(const JOPGadget& gadget);
    void ClearGadgets();
    
    // Chain execution
    bool ExecuteCustomROPChain(const std::vector<void*>& gadgets, const std::vector<uint8_t>& payload);
    bool ExecuteCustomJOPChain(const std::vector<void*>& gadgets, const std::vector<uint8_t>& payload);
    
    // Memory scanning
    std::vector<void*> ScanForGadgets(HMODULE module, const std::string& pattern);
    std::vector<void*> ScanForROPChains(HMODULE module);
    std::vector<void*> ScanForJOPChains(HMODULE module);
    
    // Anti-detection
    bool EvadeMemoryScanners();
    bool EvadeHeapSprayDetection();
    bool EvadeROPDetection();
    bool EvadeJOPDetection();
    
private:
    // Internal ROP/JOP execution
    bool ExecuteROPInternal(const ROPChain& chain, void* stack);
    bool ExecuteJOPInternal(const JOPChain& chain, void* stack);
    
    // Memory pattern matching
    bool MatchPattern(void* address, const std::string& pattern);
    std::vector<void*> FindPattern(HMODULE module, const std::string& pattern);
};

// Global instance
extern MemoryProtectionBypass g_MemoryProtectionBypass;

// Convenience functions
bool AllocateProtectedMemory(size_t size, void** address);
bool ExecuteWithROP(std::function<void()> operation);
bool ExecuteWithJOP(std::function<void()> operation);
bool BypassMemoryProtection(void* address, size_t size, DWORD protection);

// Memory protection constants
namespace MemoryProtection {
    constexpr DWORD EXECUTE_READ = PAGE_EXECUTE_READ;
    constexpr DWORD EXECUTE_READWRITE = PAGE_EXECUTE_READWRITE;
    constexpr DWORD EXECUTE_WRITECOPY = PAGE_EXECUTE_WRITECOPY;
    constexpr DWORD READONLY = PAGE_READONLY;
    constexpr DWORD READWRITE = PAGE_READWRITE;
    constexpr DWORD WRITECOPY = PAGE_WRITECOPY;
    constexpr DWORD NOACCESS = PAGE_NOACCESS;
    constexpr DWORD GUARD = PAGE_GUARD;
    constexpr DWORD NOCACHE = PAGE_NOCACHE;
    constexpr DWORD WRITECOMBINE = PAGE_WRITECOMBINE;
}

// ROP/JOP patterns
namespace ROPPatterns {
    // Common ROP gadgets
    extern const std::string POP_EAX_RET;
    extern const std::string POP_EBX_RET;
    extern const std::string POP_ECX_RET;
    extern const std::string POP_EDX_RET;
    extern const std::string POP_ESI_RET;
    extern const std::string POP_EDI_RET;
    extern const std::string POP_EBP_RET;
    extern const std::string POP_ESP_RET;
    extern const std::string RET;
    extern const std::string NOP;
    
    // Function call patterns
    extern const std::string CALL_EAX;
    extern const std::string CALL_EBX;
    extern const std::string CALL_ECX;
    extern const std::string CALL_EDX;
    extern const std::string CALL_ESI;
    extern const std::string CALL_EDI;
    extern const std::string CALL_EBP;
    
    // Arithmetic patterns
    extern const std::string ADD_EAX_EBX;
    extern const std::string SUB_EAX_EBX;
    extern const std::string MUL_EAX_EBX;
    extern const std::string DIV_EAX_EBX;
    
    // Memory access patterns
    extern const std::string MOV_EAX_DWORD_PTR_EBX;
    extern const std::string MOV_DWORD_PTR_EBX_EAX;
    extern const std::string LEA_EAX_DWORD_PTR_EBX_ECX;
}

namespace JOPPatterns {
    // Common JOP gadgets
    extern const std::string JMP_EAX;
    extern const std::string JMP_EBX;
    extern const std::string JMP_ECX;
    extern const std::string JMP_EDX;
    extern const std::string JMP_ESI;
    extern const std::string JMP_EDI;
    extern const std::string JMP_EBP;
    
    // Conditional jumps
    extern const std::string JZ_EAX;
    extern const std::string JNZ_EAX;
    extern const std::string JC_EAX;
    extern const std::string JNC_EAX;
    extern const std::string JS_EAX;
    extern const std::string JNS_EAX;
    
    // Indirect jumps
    extern const std::string JMP_DWORD_PTR_EAX;
    extern const std::string JMP_DWORD_PTR_EBX;
    extern const std::string JMP_DWORD_PTR_ECX;
    extern const std::string JMP_DWORD_PTR_EDX;
}

} // namespace Evasion
} // namespace StealthClient
