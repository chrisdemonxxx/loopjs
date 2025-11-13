#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace StealthClient {
namespace Encryption {

// Secure string wrapper
class SecureString {
private:
    std::vector<uint8_t> m_encryptedData;
    bool m_isEncrypted;
    std::string m_plaintext;
    
    // Encryption/decryption
    void EncryptInternal();
    void DecryptInternal();
    void SecureClearInternal();
    
public:
    SecureString();
    SecureString(const std::string& plaintext);
    SecureString(const SecureString& other);
    SecureString(SecureString&& other) noexcept;
    ~SecureString();
    
    // Assignment operators
    SecureString& operator=(const SecureString& other);
    SecureString& operator=(SecureString&& other) noexcept;
    SecureString& operator=(const std::string& plaintext);
    
    // String operations
    std::string GetPlaintext() const;
    void SetPlaintext(const std::string& plaintext);
    void Encrypt();
    void Decrypt();
    void SecureClear();
    
    // Status
    bool IsEncrypted() const;
    bool IsEmpty() const;
    size_t GetSize() const;
    
    // Comparison
    bool operator==(const SecureString& other) const;
    bool operator==(const std::string& other) const;
    bool operator!=(const SecureString& other) const;
    bool operator!=(const std::string& other) const;
    
private:
    void CopyFrom(const SecureString& other);
    void MoveFrom(SecureString&& other);
};

// String encryption manager
class StringEncryptionManager {
private:
    std::unordered_map<std::string, SecureString> m_encryptedStrings;
    std::vector<std::unique_ptr<SecureString>> m_managedStrings;
    
    // String management
    void AddManagedString(std::unique_ptr<SecureString> str);
    void RemoveManagedString(const std::string& key);
    void ClearAllManagedStrings();
    
public:
    StringEncryptionManager();
    ~StringEncryptionManager();
    
    // String management
    void StoreString(const std::string& key, const std::string& plaintext);
    std::string RetrieveString(const std::string& key);
    void RemoveString(const std::string& key);
    void ClearAllStrings();
    
    // Secure string operations
    std::unique_ptr<SecureString> CreateSecureString(const std::string& plaintext);
    void EncryptString(const std::string& key);
    void DecryptString(const std::string& key);
    void SecureClearString(const std::string& key);
    
    // Bulk operations
    void EncryptAllStrings();
    void DecryptAllStrings();
    void SecureClearAllStrings();
    
    // Status
    size_t GetStringCount() const;
    bool HasString(const std::string& key) const;
    std::vector<std::string> GetStringKeys() const;
    std::string GetManagerStatus() const;
    
private:
    void SecureClearAll();
};

// String encryption utilities
class StringEncryptionUtils {
private:
    // String manipulation
    static std::string ToHex(const std::vector<uint8_t>& data);
    static std::vector<uint8_t> FromHex(const std::string& hexString);
    static std::string ToBase64(const std::vector<uint8_t>& data);
    static std::vector<uint8_t> FromBase64(const std::string& base64String);
    
    // String obfuscation
    static std::string ObfuscateString(const std::string& str);
    static std::string DeobfuscateString(const std::string& str);
    
public:
    // Utility functions
    static std::string EncryptString(const std::string& plaintext);
    static std::string DecryptString(const std::string& ciphertext);
    static void SecureClearString(std::string& str);
    
    // String conversion
    static std::string VectorToString(const std::vector<uint8_t>& data);
    static std::vector<uint8_t> StringToVector(const std::string& str);
    static std::string VectorToHex(const std::vector<uint8_t>& data);
    static std::vector<uint8_t> HexToVector(const std::string& hexString);
    
    // String validation
    static bool IsValidHexString(const std::string& str);
    static bool IsValidBase64String(const std::string& str);
    static bool IsEncryptedString(const std::string& str);
    
    // String obfuscation
    static std::string Obfuscate(const std::string& str);
    static std::string Deobfuscate(const std::string& str);
    
    // String analysis
    static size_t GetStringEntropy(const std::string& str);
    static bool IsHighEntropyString(const std::string& str);
    static std::string GetStringInfo(const std::string& str);
};

// Global string encryption service
class GlobalStringEncryptionService {
private:
    StringEncryptionManager m_manager;
    StringEncryptionUtils m_utils;
    
    // Service management
    void InitializeService();
    void ShutdownService();
    
public:
    GlobalStringEncryptionService();
    ~GlobalStringEncryptionService();
    
    // Service operations
    void Initialize();
    void Shutdown();
    
    // String operations
    std::string EncryptString(const std::string& plaintext);
    std::string DecryptString(const std::string& ciphertext);
    void SecureClearString(std::string& str);
    
    // String management
    void StoreString(const std::string& key, const std::string& plaintext);
    std::string RetrieveString(const std::string& key);
    void RemoveString(const std::string& key);
    void ClearAllStrings();
    
    // Bulk operations
    void EncryptAllStrings();
    void DecryptAllStrings();
    void SecureClearAllStrings();
    
    // Status
    size_t GetStringCount() const;
    std::string GetServiceStatus() const;
    std::string GetServiceSummary() const;
    
private:
    void SecureClearAll();
};

// Global instances
extern StringEncryptionManager g_StringEncryptionManager;
extern StringEncryptionUtils g_StringEncryptionUtils;
extern GlobalStringEncryptionService g_GlobalStringEncryptionService;

// Convenience functions
std::string EncryptString(const std::string& plaintext);
std::string DecryptString(const std::string& ciphertext);
void SecureClearString(std::string& str);
void StoreEncryptedString(const std::string& key, const std::string& plaintext);
std::string RetrieveEncryptedString(const std::string& key);
void RemoveEncryptedString(const std::string& key);
void ClearAllEncryptedStrings();
std::string GetStringEncryptionStatus();

// String encryption constants
namespace StringEncryptionConstants {
    constexpr size_t DEFAULT_STRING_SIZE = 256;
    constexpr size_t MAX_STRING_SIZE = 4096;
    constexpr size_t MIN_STRING_SIZE = 1;
    constexpr size_t DEFAULT_ENTROPY_THRESHOLD = 4.0;
    constexpr size_t HIGH_ENTROPY_THRESHOLD = 6.0;
}

// String encryption types
namespace StringEncryptionTypes {
    constexpr int PLAINTEXT = 0;
    constexpr int ENCRYPTED = 1;
    constexpr int OBFUSCATED = 2;
    constexpr int SECURE = 3;
}

} // namespace Encryption
} // namespace StealthClient
