#pragma once
#include <string>
#include <vector>
#include <map>
#include <windows.h>
#include <iphlpapi.h>
#include <psapi.h>
#include <tlhelp32.h>

#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "psapi.lib")

namespace StealthClient {

class SystemInfoCollector {
public:
    struct SystemInfo {
        std::string computerName;
        std::string userName;
        std::string osVersion;
        std::string architecture;
        std::string hostname;
        std::string ipAddress;
        std::string machineFingerprint;
        std::vector<std::string> capabilities;
        std::map<std::string, std::string> additionalInfo;
    };

    static SystemInfo CollectSystemInfo();
    static std::string GenerateMachineFingerprint();
    static std::string GetLocalIPAddress();
    static std::vector<std::string> GetCapabilities();

private:
    static std::string GetOSVersion();
    static std::string GetArchitecture();
    static std::string GetComputerName();
    static std::string GetUserName();
    static std::string GetHostname();
    static std::map<std::string, std::string> GetAdditionalInfo();
};

} // namespace StealthClient
