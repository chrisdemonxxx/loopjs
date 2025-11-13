#pragma once
#include <string>
#include <vector>
#include <chrono>
#include <functional>

namespace StealthClient {
namespace Encryption {

// Session key management
class SessionKeyManager {
private:
    std::vector<uint8_t> m_sessionKey;
    std::chrono::high_resolution_clock::time_point m_keyCreationTime;
    std::chrono::high_resolution_clock::time_point m_lastUsedTime;
    bool m_keyValid;
    
    // Key generation
    void GenerateSessionKey();
    void GenerateKeyFromEntropy();
    void GenerateKeyFromSystem();
    void GenerateKeyFromUser();
    
public:
    SessionKeyManager();
    ~SessionKeyManager();
    
    // Key management
    void InitializeSession();
    void RotateSessionKey();
    void InvalidateSession();
    
    // Key access
    std::vector<uint8_t> GetSessionKey() const;
    std::string GetSessionKeyHex() const;
    bool IsSessionValid() const;
    
    // Key lifecycle
    bool IsKeyExpired() const;
    void UpdateLastUsed();
    std::chrono::seconds GetKeyAge() const;
    
    // Key derivation
    std::vector<uint8_t> DeriveKey(const std::string& context, size_t keySize = 32);
    std::vector<uint8_t> DeriveEncryptionKey(const std::string& context);
    std::vector<uint8_t> DeriveMACKey(const std::string& context);
    std::vector<uint8_t> DeriveIV(const std::string& context);
    
private:
    void SecureClearKey();
    bool IsKeyExpiredInternal() const;
};

// Key exchange protocol
class KeyExchangeProtocol {
private:
    std::string m_publicKey;
    std::string m_privateKey;
    std::string m_peerPublicKey;
    std::vector<uint8_t> m_sharedSecret;
    bool m_exchangeComplete;
    
    // Key generation
    void GenerateKeyPair();
    void GenerateSharedSecret();
    
    // Protocol implementation
    bool PerformECDHExchange();
    bool PerformRSAExchange();
    bool PerformCustomExchange();
    
public:
    KeyExchangeProtocol();
    ~KeyExchangeProtocol();
    
    // Key exchange
    bool InitiateKeyExchange();
    bool CompleteKeyExchange(const std::string& peerPublicKey);
    bool PerformKeyExchange(const std::string& peerPublicKey);
    
    // Key access
    std::string GetPublicKey() const;
    std::string GetPrivateKey() const;
    std::vector<uint8_t> GetSharedSecret() const;
    
    // Status
    bool IsExchangeComplete() const;
    std::string GetExchangeStatus() const;
    
    // Protocol selection
    void SetProtocol(int protocol);
    int GetProtocol() const;
    
private:
    int m_protocol;
    void SecureClearKeys();
};

// Key rotation manager
class KeyRotationManager {
private:
    std::vector<std::vector<uint8_t>> m_keyHistory;
    std::vector<uint8_t> m_currentKey;
    std::chrono::high_resolution_clock::time_point m_lastRotation;
    size_t m_maxHistorySize;
    std::chrono::seconds m_rotationInterval;
    
    // Rotation logic
    void RotateKeys();
    void AddKeyToHistory(const std::vector<uint8_t>& key);
    void CleanupOldKeys();
    
public:
    KeyRotationManager();
    ~KeyRotationManager();
    
    // Key rotation
    void InitializeRotation();
    void PerformRotation();
    void ForceRotation();
    
    // Key access
    std::vector<uint8_t> GetCurrentKey() const;
    std::vector<uint8_t> GetPreviousKey() const;
    std::vector<std::vector<uint8_t>> GetKeyHistory() const;
    
    // Configuration
    void SetRotationInterval(std::chrono::seconds interval);
    void SetMaxHistorySize(size_t maxSize);
    
    // Status
    bool IsRotationDue() const;
    std::chrono::seconds GetTimeUntilRotation() const;
    size_t GetKeyHistorySize() const;
    std::string GetRotationStatus() const;
    
private:
    void SecureClearHistory();
    bool IsRotationDueInternal() const;
};

// Global key manager
class GlobalKeyManager {
private:
    SessionKeyManager m_sessionManager;
    KeyExchangeProtocol m_exchangeProtocol;
    KeyRotationManager m_rotationManager;
    
    // Key coordination
    void CoordinateKeyUpdates();
    void SynchronizeKeyState();
    
public:
    GlobalKeyManager();
    ~GlobalKeyManager();
    
    // Initialization
    void Initialize();
    void Shutdown();
    
    // Key management
    void UpdateKeys();
    void RotateKeys();
    void ExchangeKeys(const std::string& peerPublicKey);
    
    // Key access
    std::vector<uint8_t> GetCurrentEncryptionKey();
    std::vector<uint8_t> GetCurrentMACKey();
    std::vector<uint8_t> GetCurrentIV();
    
    // Status
    bool AreKeysValid() const;
    std::string GetKeyStatus() const;
    std::string GetKeySummary() const;
    
    // Configuration
    void SetKeyRotationInterval(std::chrono::seconds interval);
    void SetMaxKeyHistorySize(size_t maxSize);
    
private:
    void SecureClearAllKeys();
};

// Global instances
extern SessionKeyManager g_SessionKeyManager;
extern KeyExchangeProtocol g_KeyExchangeProtocol;
extern KeyRotationManager g_KeyRotationManager;
extern GlobalKeyManager g_GlobalKeyManager;

// Convenience functions
std::vector<uint8_t> GenerateSessionKey();
std::vector<uint8_t> DeriveEncryptionKey(const std::string& context);
std::vector<uint8_t> DeriveMACKey(const std::string& context);
std::vector<uint8_t> DeriveIV(const std::string& context);
bool PerformKeyExchange(const std::string& peerPublicKey);
void RotateKeys();
void UpdateKeys();
std::string GetKeyStatus();

// Key management constants
namespace KeyConstants {
    constexpr size_t DEFAULT_KEY_SIZE = 32;
    constexpr size_t MIN_KEY_SIZE = 16;
    constexpr size_t MAX_KEY_SIZE = 64;
    constexpr size_t DEFAULT_IV_SIZE = 16;
    constexpr size_t DEFAULT_MAC_SIZE = 32;
    constexpr std::chrono::seconds DEFAULT_ROTATION_INTERVAL(3600); // 1 hour
    constexpr size_t DEFAULT_MAX_HISTORY = 10;
    constexpr std::chrono::seconds DEFAULT_KEY_LIFETIME(86400); // 24 hours
}

// Key exchange protocols
namespace KeyExchangeProtocols {
    constexpr int ECDH = 0;
    constexpr int RSA = 1;
    constexpr int CUSTOM = 2;
    constexpr int AUTO = 3;
}

} // namespace Encryption
} // namespace StealthClient
