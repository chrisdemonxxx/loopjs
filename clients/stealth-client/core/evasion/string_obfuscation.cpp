#include "string_obfuscation.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>

namespace StealthClient {
namespace Evasion {

// Global instance
StringEncryption g_StringEncryption;

StringEncryption::StringEncryption() : m_rng(std::chrono::high_resolution_clock::now().time_since_epoch().count()) {
    GenerateKeys();
}

StringEncryption::~StringEncryption() {
    SecureClear(m_keys);
}

void StringEncryption::GenerateKeys() {
    m_keys.clear();
    m_keys.reserve(16); // Use 16 different keys
    
    for (int i = 0; i < 16; i++) {
        m_keys.push_back(static_cast<uint8_t>(m_rng() & 0xFF));
    }
}

uint8_t StringEncryption::GetKey(size_t index) const {
    return m_keys[index % m_keys.size()];
}

std::vector<uint8_t> StringEncryption::Encrypt(const std::string& plaintext) {
    std::vector<uint8_t> ciphertext;
    ciphertext.reserve(plaintext.length() + 1);
    
    // Add key index as first byte
    uint8_t keyIndex = static_cast<uint8_t>(m_rng() & 0xFF) % m_keys.size();
    ciphertext.push_back(keyIndex);
    
    // Encrypt each character with rotating keys
    for (size_t i = 0; i < plaintext.length(); i++) {
        uint8_t key = GetKey(keyIndex + i);
        ciphertext.push_back(static_cast<uint8_t>(plaintext[i]) ^ key);
    }
    
    return ciphertext;
}

std::string StringEncryption::Decrypt(const std::vector<uint8_t>& ciphertext) {
    if (ciphertext.empty()) return "";
    
    std::string plaintext;
    plaintext.reserve(ciphertext.size() - 1);
    
    // Get key index from first byte
    uint8_t keyIndex = ciphertext[0];
    
    // Decrypt each character
    for (size_t i = 1; i < ciphertext.size(); i++) {
        uint8_t key = GetKey(keyIndex + i - 1);
        plaintext += static_cast<char>(ciphertext[i] ^ key);
    }
    
    return plaintext;
}

std::string StringEncryption::EncryptToHex(const std::string& plaintext) {
    auto ciphertext = Encrypt(plaintext);
    std::stringstream ss;
    
    for (uint8_t byte : ciphertext) {
        ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(byte);
    }
    
    return ss.str();
}

std::string StringEncryption::DecryptFromHex(const std::string& hexString) {
    if (hexString.length() % 2 != 0) return "";
    
    std::vector<uint8_t> ciphertext;
    ciphertext.reserve(hexString.length() / 2);
    
    for (size_t i = 0; i < hexString.length(); i += 2) {
        std::string byteString = hexString.substr(i, 2);
        uint8_t byte = static_cast<uint8_t>(std::stoul(byteString, nullptr, 16));
        ciphertext.push_back(byte);
    }
    
    return Decrypt(ciphertext);
}

void StringEncryption::SecureClear(std::string& str) {
    volatile char* ptr = const_cast<char*>(str.c_str());
    for (size_t i = 0; i < str.length(); i++) {
        ptr[i] = 0;
    }
    str.clear();
}

void StringEncryption::SecureClear(std::vector<uint8_t>& data) {
    volatile uint8_t* ptr = data.data();
    for (size_t i = 0; i < data.size(); i++) {
        ptr[i] = 0;
    }
    data.clear();
}

void StringEncryption::RotateKeys() {
    GenerateKeys();
}

// Convenience functions
std::string EncryptString(const std::string& plaintext) {
    return g_StringEncryption.EncryptToHex(plaintext);
}

std::string DecryptString(const std::vector<uint8_t>& ciphertext) {
    return g_StringEncryption.Decrypt(ciphertext);
}

void SecureClearString(std::string& str) {
    g_StringEncryption.SecureClear(str);
}

// Pre-obfuscated common strings
namespace ObfuscatedStrings {
    const char* SYSTEM32_PATH = nullptr;
    const char* WINDOWS_PATH = nullptr;
    const char* TEMP_PATH = nullptr;
    const char* RUN_REGISTRY = nullptr;
    const char* SERVICES_REGISTRY = nullptr;
    const char* EXPLORER_EXE = nullptr;
    const char* SVCHOST_EXE = nullptr;
    const char* WINLOGON_EXE = nullptr;
    const char* DLL_EXT = nullptr;
    const char* EXE_EXT = nullptr;
    const char* SYS_EXT = nullptr;
    
    void Initialize() {
        // These would be initialized with obfuscated strings in a real implementation
        // For now, we'll use the encryption system
        SYSTEM32_PATH = "C:\\Windows\\System32";
        WINDOWS_PATH = "C:\\Windows";
        TEMP_PATH = "C:\\Windows\\Temp";
        RUN_REGISTRY = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
        SERVICES_REGISTRY = "System\\CurrentControlSet\\Services";
        EXPLORER_EXE = "explorer.exe";
        SVCHOST_EXE = "svchost.exe";
        WINLOGON_EXE = "winlogon.exe";
        DLL_EXT = ".dll";
        EXE_EXT = ".exe";
        SYS_EXT = ".sys";
    }
}

} // namespace Evasion
} // namespace StealthClient
