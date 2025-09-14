#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <string>
#include <fstream>

#pragma comment(lib, "wininet.lib")

// Debug logging function
void writeDebugLog(const std::string& message) {
    std::ofstream logFile("C:\\temp\\test_client_debug.log", std::ios::app);
    if (logFile.is_open()) {
        SYSTEMTIME st;
        GetSystemTime(&st);
        logFile << "[" << st.wYear << "-" << st.wMonth << "-" << st.wDay 
                << " " << st.wHour << ":" << st.wMinute << ":" << st.wSecond << "] "
                << message << std::endl;
        logFile.close();
    }
    std::cout << message << std::endl;
}

// Simple HTTP POST function
bool makeHttpRequest(const std::string& server, const std::string& endpoint, const std::string& data) {
    writeDebugLog("Attempting to connect to: " + server + endpoint);
    
    HINTERNET hInternet = InternetOpenA("TestClient/1.0", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) {
        writeDebugLog("Failed to initialize WinINet");
        return false;
    }
    
    HINTERNET hConnect = InternetConnectA(hInternet, server.c_str(), 3000, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
    if (!hConnect) {
        writeDebugLog("Failed to connect to server");
        InternetCloseHandle(hInternet);
        return false;
    }
    
    HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", endpoint.c_str(), NULL, NULL, NULL, 0, 0);
    if (!hRequest) {
        writeDebugLog("Failed to create HTTP request");
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return false;
    }
    
    // Add headers
    std::string headers = "Content-Type: application/json\r\n";
    HttpAddRequestHeadersA(hRequest, headers.c_str(), headers.length(), HTTP_ADDREQ_FLAG_ADD);
    
    // Send request
    BOOL result = HttpSendRequestA(hRequest, NULL, 0, (LPVOID)data.c_str(), data.length());
    
    if (result) {
        writeDebugLog("Request sent successfully");
        
        // Read response
        char buffer[4096];
        DWORD bytesRead;
        std::string response;
        
        while (InternetReadFile(hRequest, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
            response.append(buffer, bytesRead);
        }
        
        writeDebugLog("Response: " + response);
    } else {
        DWORD error = GetLastError();
        writeDebugLog("Request failed with error: " + std::to_string(error));
    }
    
    InternetCloseHandle(hRequest);
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    
    return result;
}

int main() {
    // Create temp directory
    CreateDirectoryA("C:\\temp", NULL);
    
    writeDebugLog("=== TEST CLIENT STARTING ===");
    
    // Get system information
    char computerName[MAX_COMPUTERNAME_LENGTH + 1];
    DWORD size = sizeof(computerName);
    GetComputerNameA(computerName, &size);
    
    // Generate a test UUID
    std::string uuid = "test-client-12345";
    
    // Create registration payload
    std::string payload = "{";
    payload += "\"uuid\":\"" + uuid + "\",";
    payload += "\"computerName\":\"" + std::string(computerName) + "\",";
    payload += "\"ipAddress\":\"127.0.0.1\",";
    payload += "\"hostname\":\"" + std::string(computerName) + "\",";
    payload += "\"platform\":\"Windows Test\",";
    payload += "\"additionalSystemDetails\":\"Test Client\"";
    payload += "}";
    
    writeDebugLog("Registration payload: " + payload);
    
    // Try to register with the backend
    if (makeHttpRequest("localhost", "/api/info/register-client", payload)) {
        writeDebugLog("Registration successful!");
        
        // Send heartbeat
        std::string heartbeatPayload = "{\"uuid\":\"" + uuid + "\"}";
        if (makeHttpRequest("localhost", "/api/info/client-heartbeat", heartbeatPayload)) {
            writeDebugLog("Heartbeat successful!");
        }
    } else {
        writeDebugLog("Registration failed!");
    }
    
    writeDebugLog("=== TEST CLIENT FINISHED ===");
    
    std::cout << "Press Enter to exit..." << std::endl;
    std::cin.get();
    
    return 0;
}