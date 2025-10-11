#pragma once
#include <vector>
#include <string>
#include <random>
#include <chrono>
#include <unordered_map>

namespace StealthClient {
namespace Encryption {

// Multi-key XOR cipher implementation
class XORCipher {
private:
    std::vector<uint8_t> m_keys;
    std::mt19937 m_rng;
    size_t m_keyIndex;
    
    // Key management
    void GenerateKeys(size_t keyCount = 16);
    void RotateKeys();
    uint8_t GetNextKey();
    
    // Encryption/decryption helpers
    std::vector<uint8_t> XOREncryptInternal(const std::vector<uint8_t>& data, const std::vector<uint8_t>& keys);
    std::vector<uint8_t> XORDecryptInternal(const std::vector<uint8_t>& data, const std::vector<uint8_t>& keys);
    
public:
    XORCipher();
    XORCipher(const std::vector<uint8_t>& keys);
    ~XORCipher();
    
    // Main encryption/decryption functions
    std::vector<uint8_t> Encrypt(const std::vector<uint8_t>& plaintext);
    std::vector<uint8_t> Decrypt(const std::vector<uint8_t>& ciphertext);
    
    // String encryption/decryption
    std::string EncryptString(const std::string& plaintext);
    std::string DecryptString(const std::string& ciphertext);
    
    // Hex string encryption/decryption
    std::string EncryptToHex(const std::vector<uint8_t>& plaintext);
    std::vector<uint8_t> DecryptFromHex(const std::string& hexString);
    
    // Key management
    void SetKeys(const std::vector<uint8_t>& keys);
    std::vector<uint8_t> GetKeys() const;
    void GenerateNewKeys(size_t keyCount = 16);
    
    // Utility functions
    std::string VectorToHex(const std::vector<uint8_t>& data);
    std::vector<uint8_t> HexToVector(const std::string& hexString);
    void SecureClear(std::vector<uint8_t>& data);
    void SecureClear(std::string& str);
    
    // Advanced features
    bool EncryptFile(const std::string& inputFile, const std::string& outputFile);
    bool DecryptFile(const std::string& inputFile, const std::string& outputFile);
    bool EncryptMemory(void* data, size_t size);
    bool DecryptMemory(void* data, size_t size);
    
private:
    void InitializeRNG();
};

// Dynamic key management
class DynamicKeyManager {
private:
    std::vector<uint8_t> m_sessionKeys;
    std::vector<uint8_t> m_derivedKeys;
    std::mt19937 m_rng;
    std::chrono::high_resolution_clock::time_point m_lastRotation;
    
    // Key generation
    void GenerateSessionKeys();
    void DeriveKeysFromSession();
    void GenerateKeyFromEntropy();
    void GenerateKeyFromSystem();
    
    // Key exchange
    bool PerformKeyExchange(const std::string& peerPublicKey);
    std::string GeneratePublicKey();
    std::string GeneratePrivateKey();
    
public:
    DynamicKeyManager();
    ~DynamicKeyManager();
    
    // Key management
    void InitializeKeys();
    void RotateKeys();
    void UpdateKeys();
    
    // Key exchange
    bool ExchangeKeys(const std::string& peerPublicKey);
    std::string GetPublicKey();
    std::string GetPrivateKey();
    
    // Key derivation
    std::vector<uint8_t> DeriveEncryptionKey(const std::string& context);
    std::vector<uint8_t> DeriveMACKey(const std::string& context);
    std::vector<uint8_t> DeriveIV(const std::string& context);
    
    // Key status
    bool AreKeysValid() const;
    bool AreKeysExpired() const;
    size_t GetKeyCount() const;
    std::string GetKeyStatus() const;
    
private:
    void SecureClearKeys();
    bool IsKeyExpired() const;
};

// String encryption service
class StringEncryptionService {
private:
    XORCipher m_cipher;
    DynamicKeyManager m_keyManager;
    std::unordered_map<std::string, std::string> m_encryptedStrings;
    
    // String management
    void EncryptStringInPlace(std::string& str);
    void DecryptStringInPlace(std::string& str);
    void SecureClearString(std::string& str);
    
public:
    StringEncryptionService();
    ~StringEncryptionService();
    
    // Initialization and cleanup
    void Initialize();
    void Shutdown();
    
    // String encryption/decryption
    std::string EncryptString(const std::string& plaintext);
    std::string DecryptString(const std::string& ciphertext);
    
    // Secure string handling
    void SecureClear(std::string& str);
    void SecureClearAll();
    
    // String caching
    void CacheEncryptedString(const std::string& key, const std::string& encrypted);
    std::string GetCachedEncryptedString(const std::string& key);
    void ClearCache();
    
    // Key management
    void UpdateKeys();
    
    // Status
    size_t GetCachedStringCount() const;
    std::string GetServiceStatus() const;
};

// Global instances
extern XORCipher g_XORCipher;
extern DynamicKeyManager g_DynamicKeyManager;
extern StringEncryptionService g_StringEncryptionService;

// Convenience functions
std::vector<uint8_t> XOREncrypt(const std::vector<uint8_t>& plaintext);
std::vector<uint8_t> XORDecrypt(const std::vector<uint8_t>& ciphertext);
std::string XOREncryptString(const std::string& plaintext);
std::string XORDecryptString(const std::string& ciphertext);
void XORSecureClear(std::vector<uint8_t>& data);
void XORSecureClear(std::string& str);

// Encryption constants
namespace EncryptionConstants {
    constexpr size_t DEFAULT_KEY_COUNT = 16;
    constexpr size_t MIN_KEY_COUNT = 4;
    constexpr size_t MAX_KEY_COUNT = 64;
    constexpr size_t KEY_ROTATION_INTERVAL = 3600; // 1 hour in seconds
    constexpr size_t SESSION_KEY_SIZE = 32;
    constexpr size_t DERIVED_KEY_SIZE = 16;
}

} // namespace Encryption
} // namespace StealthClient
