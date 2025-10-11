#include "xor_cipher.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <fstream>
#include <algorithm>

namespace StealthClient {
namespace Encryption {

// Global instances
XORCipher g_XORCipher;
DynamicKeyManager g_DynamicKeyManager;
StringEncryptionService g_StringEncryptionService;

// XORCipher implementation
XORCipher::XORCipher() : m_keyIndex(0) {
    InitializeRNG();
    GenerateKeys();
}

XORCipher::XORCipher(const std::vector<uint8_t>& keys) : m_keys(keys), m_keyIndex(0) {
    InitializeRNG();
}

XORCipher::~XORCipher() {
    SecureClear(m_keys);
}

void XORCipher::InitializeRNG() {
    m_rng.seed(std::chrono::high_resolution_clock::now().time_since_epoch().count());
}

void XORCipher::GenerateKeys(size_t keyCount) {
    m_keys.clear();
    m_keys.reserve(keyCount);
    
    for (size_t i = 0; i < keyCount; i++) {
        m_keys.push_back(static_cast<uint8_t>(m_rng() & 0xFF));
    }
    
    m_keyIndex = 0;
    std::cout << "[DEBUG] Generated " << keyCount << " XOR keys" << std::endl;
}

void XORCipher::RotateKeys() {
    GenerateKeys(m_keys.size());
}

uint8_t XORCipher::GetNextKey() {
    if (m_keys.empty()) {
        return 0;
    }
    
    uint8_t key = m_keys[m_keyIndex];
    m_keyIndex = (m_keyIndex + 1) % m_keys.size();
    return key;
}

std::vector<uint8_t> XORCipher::Encrypt(const std::vector<uint8_t>& plaintext) {
    if (plaintext.empty()) {
        return std::vector<uint8_t>();
    }
    
    std::vector<uint8_t> ciphertext;
    ciphertext.reserve(plaintext.size() + 1);
    
    // Add key index as first byte
    ciphertext.push_back(static_cast<uint8_t>(m_keyIndex));
    
    // Encrypt each byte with rotating keys
    for (size_t i = 0; i < plaintext.size(); i++) {
        uint8_t key = GetNextKey();
        ciphertext.push_back(plaintext[i] ^ key);
    }
    
    return ciphertext;
}

std::vector<uint8_t> XORCipher::Decrypt(const std::vector<uint8_t>& ciphertext) {
    if (ciphertext.empty() || ciphertext.size() < 2) {
        return std::vector<uint8_t>();
    }
    
    std::vector<uint8_t> plaintext;
    plaintext.reserve(ciphertext.size() - 1);
    
    // Get key index from first byte
    m_keyIndex = ciphertext[0];
    
    // Decrypt each byte
    for (size_t i = 1; i < ciphertext.size(); i++) {
        uint8_t key = GetNextKey();
        plaintext.push_back(ciphertext[i] ^ key);
    }
    
    return plaintext;
}

std::string XORCipher::EncryptString(const std::string& plaintext) {
    std::vector<uint8_t> plaintextVec(plaintext.begin(), plaintext.end());
    auto ciphertextVec = Encrypt(plaintextVec);
    return VectorToHex(ciphertextVec);
}

std::string XORCipher::DecryptString(const std::string& ciphertext) {
    auto ciphertextVec = HexToVector(ciphertext);
    auto plaintextVec = Decrypt(ciphertextVec);
    return std::string(plaintextVec.begin(), plaintextVec.end());
}

std::string XORCipher::EncryptToHex(const std::vector<uint8_t>& plaintext) {
    auto ciphertext = Encrypt(plaintext);
    return VectorToHex(ciphertext);
}

std::vector<uint8_t> XORCipher::DecryptFromHex(const std::string& hexString) {
    auto ciphertext = HexToVector(hexString);
    return Decrypt(ciphertext);
}

void XORCipher::SetKeys(const std::vector<uint8_t>& keys) {
    m_keys = keys;
    m_keyIndex = 0;
}

std::vector<uint8_t> XORCipher::GetKeys() const {
    return m_keys;
}

void XORCipher::GenerateNewKeys(size_t keyCount) {
    GenerateKeys(keyCount);
}

std::string XORCipher::VectorToHex(const std::vector<uint8_t>& data) {
    std::stringstream ss;
    for (uint8_t byte : data) {
        ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(byte);
    }
    return ss.str();
}

std::vector<uint8_t> XORCipher::HexToVector(const std::string& hexString) {
    std::vector<uint8_t> data;
    
    if (hexString.length() % 2 != 0) {
        return data;
    }
    
    data.reserve(hexString.length() / 2);
    
    for (size_t i = 0; i < hexString.length(); i += 2) {
        std::string byteString = hexString.substr(i, 2);
        uint8_t byte = static_cast<uint8_t>(std::stoul(byteString, nullptr, 16));
        data.push_back(byte);
    }
    
    return data;
}

void XORCipher::SecureClear(std::vector<uint8_t>& data) {
    volatile uint8_t* ptr = data.data();
    for (size_t i = 0; i < data.size(); i++) {
        ptr[i] = 0;
    }
    data.clear();
}

void XORCipher::SecureClear(std::string& str) {
    volatile char* ptr = const_cast<char*>(str.c_str());
    for (size_t i = 0; i < str.length(); i++) {
        ptr[i] = 0;
    }
    str.clear();
}

bool XORCipher::EncryptFile(const std::string& inputFile, const std::string& outputFile) {
    std::ifstream inFile(inputFile, std::ios::binary);
    if (!inFile) {
        std::cerr << "[ERROR] Failed to open input file: " << inputFile << std::endl;
        return false;
    }
    
    std::ofstream outFile(outputFile, std::ios::binary);
    if (!outFile) {
        std::cerr << "[ERROR] Failed to create output file: " << outputFile << std::endl;
        return false;
    }
    
    // Read file content
    std::vector<uint8_t> fileContent((std::istreambuf_iterator<char>(inFile)),
                                     std::istreambuf_iterator<char>());
    
    // Encrypt content
    auto encryptedContent = Encrypt(fileContent);
    
    // Write encrypted content
    outFile.write(reinterpret_cast<const char*>(encryptedContent.data()), encryptedContent.size());
    
    inFile.close();
    outFile.close();
    
    std::cout << "[DEBUG] File encrypted successfully: " << inputFile << " -> " << outputFile << std::endl;
    return true;
}

bool XORCipher::DecryptFile(const std::string& inputFile, const std::string& outputFile) {
    std::ifstream inFile(inputFile, std::ios::binary);
    if (!inFile) {
        std::cerr << "[ERROR] Failed to open input file: " << inputFile << std::endl;
        return false;
    }
    
    std::ofstream outFile(outputFile, std::ios::binary);
    if (!outFile) {
        std::cerr << "[ERROR] Failed to create output file: " << outputFile << std::endl;
        return false;
    }
    
    // Read encrypted content
    std::vector<uint8_t> encryptedContent((std::istreambuf_iterator<char>(inFile)),
                                          std::istreambuf_iterator<char>());
    
    // Decrypt content
    auto decryptedContent = Decrypt(encryptedContent);
    
    // Write decrypted content
    outFile.write(reinterpret_cast<const char*>(decryptedContent.data()), decryptedContent.size());
    
    inFile.close();
    outFile.close();
    
    std::cout << "[DEBUG] File decrypted successfully: " << inputFile << " -> " << outputFile << std::endl;
    return true;
}

bool XORCipher::EncryptMemory(void* data, size_t size) {
    if (!data || size == 0) {
        return false;
    }
    
    uint8_t* ptr = static_cast<uint8_t*>(data);
    for (size_t i = 0; i < size; i++) {
        uint8_t key = GetNextKey();
        ptr[i] ^= key;
    }
    
    return true;
}

bool XORCipher::DecryptMemory(void* data, size_t size) {
    if (!data || size == 0) {
        return false;
    }
    
    uint8_t* ptr = static_cast<uint8_t*>(data);
    for (size_t i = 0; i < size; i++) {
        uint8_t key = GetNextKey();
        ptr[i] ^= key;
    }
    
    return true;
}

// DynamicKeyManager implementation
DynamicKeyManager::DynamicKeyManager() {
    InitializeRNG();
    InitializeKeys();
}

DynamicKeyManager::~DynamicKeyManager() {
    SecureClearKeys();
}

void DynamicKeyManager::InitializeRNG() {
    m_rng.seed(std::chrono::high_resolution_clock::now().time_since_epoch().count());
}

void DynamicKeyManager::InitializeKeys() {
    GenerateSessionKeys();
    DeriveKeysFromSession();
    m_lastRotation = std::chrono::high_resolution_clock::now();
    
    std::cout << "[DEBUG] Dynamic key manager initialized" << std::endl;
}

void DynamicKeyManager::GenerateSessionKeys() {
    m_sessionKeys.clear();
    m_sessionKeys.reserve(EncryptionConstants::SESSION_KEY_SIZE);
    
    for (size_t i = 0; i < EncryptionConstants::SESSION_KEY_SIZE; i++) {
        m_sessionKeys.push_back(static_cast<uint8_t>(m_rng() & 0xFF));
    }
    
    std::cout << "[DEBUG] Generated session keys" << std::endl;
}

void DynamicKeyManager::DeriveKeysFromSession() {
    m_derivedKeys.clear();
    m_derivedKeys.reserve(EncryptionConstants::DERIVED_KEY_SIZE);
    
    // Simple key derivation (in practice, use proper KDF)
    for (size_t i = 0; i < EncryptionConstants::DERIVED_KEY_SIZE; i++) {
        uint8_t derivedKey = 0;
        for (size_t j = 0; j < m_sessionKeys.size(); j++) {
            derivedKey ^= m_sessionKeys[j];
        }
        derivedKey ^= static_cast<uint8_t>(i);
        m_derivedKeys.push_back(derivedKey);
    }
    
    std::cout << "[DEBUG] Derived keys from session" << std::endl;
}

void DynamicKeyManager::RotateKeys() {
    GenerateSessionKeys();
    DeriveKeysFromSession();
    m_lastRotation = std::chrono::high_resolution_clock::now();
    
    std::cout << "[DEBUG] Keys rotated" << std::endl;
}

void DynamicKeyManager::UpdateKeys() {
    if (IsKeyExpired()) {
        RotateKeys();
    }
}

bool DynamicKeyManager::ExchangeKeys(const std::string& peerPublicKey) {
    std::cout << "[DEBUG] Performing key exchange with peer" << std::endl;
    
    // Simplified key exchange (in practice, use proper key exchange protocol)
    GenerateSessionKeys();
    DeriveKeysFromSession();
    
    return true;
}

std::string DynamicKeyManager::GetPublicKey() {
    return VectorToHex(m_sessionKeys);
}

std::string DynamicKeyManager::GetPrivateKey() {
    return VectorToHex(m_derivedKeys);
}

std::vector<uint8_t> DynamicKeyManager::DeriveEncryptionKey(const std::string& context) {
    std::vector<uint8_t> key;
    key.reserve(16);
    
    // Simple key derivation based on context
    for (size_t i = 0; i < 16; i++) {
        uint8_t derivedKey = 0;
        for (size_t j = 0; j < m_sessionKeys.size(); j++) {
            derivedKey ^= m_sessionKeys[j];
        }
        derivedKey ^= static_cast<uint8_t>(context[i % context.length()]);
        derivedKey ^= static_cast<uint8_t>(i);
        key.push_back(derivedKey);
    }
    
    return key;
}

std::vector<uint8_t> DynamicKeyManager::DeriveMACKey(const std::string& context) {
    return DeriveEncryptionKey(context + "_MAC");
}

std::vector<uint8_t> DynamicKeyManager::DeriveIV(const std::string& context) {
    return DeriveEncryptionKey(context + "_IV");
}

bool DynamicKeyManager::AreKeysValid() const {
    return !m_sessionKeys.empty() && !m_derivedKeys.empty();
}

bool DynamicKeyManager::AreKeysExpired() const {
    return IsKeyExpired();
}

size_t DynamicKeyManager::GetKeyCount() const {
    return m_sessionKeys.size() + m_derivedKeys.size();
}

std::string DynamicKeyManager::GetKeyStatus() const {
    std::stringstream ss;
    ss << "Key Status:\n";
    ss << "  Session Keys: " << m_sessionKeys.size() << " bytes\n";
    ss << "  Derived Keys: " << m_derivedKeys.size() << " bytes\n";
    ss << "  Valid: " << (AreKeysValid() ? "Yes" : "No") << "\n";
    ss << "  Expired: " << (AreKeysExpired() ? "Yes" : "No") << "\n";
    return ss.str();
}

void DynamicKeyManager::SecureClearKeys() {
    SecureClear(m_sessionKeys);
    SecureClear(m_derivedKeys);
}

bool DynamicKeyManager::IsKeyExpired() const {
    auto now = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::seconds>(now - m_lastRotation);
    return duration.count() >= EncryptionConstants::KEY_ROTATION_INTERVAL;
}

// StringEncryptionService implementation
StringEncryptionService::StringEncryptionService() {
    std::cout << "[DEBUG] String encryption service initialized" << std::endl;
}

StringEncryptionService::~StringEncryptionService() {
    SecureClearAll();
}

std::string StringEncryptionService::EncryptString(const std::string& plaintext) {
    return m_cipher.EncryptString(plaintext);
}

std::string StringEncryptionService::DecryptString(const std::string& ciphertext) {
    return m_cipher.DecryptString(ciphertext);
}

void StringEncryptionService::EncryptStringInPlace(std::string& str) {
    std::string encrypted = EncryptString(str);
    str = encrypted;
}

void StringEncryptionService::DecryptStringInPlace(std::string& str) {
    std::string decrypted = DecryptString(str);
    str = decrypted;
}

void StringEncryptionService::SecureClear(std::string& str) {
    m_cipher.SecureClear(str);
}

void StringEncryptionService::SecureClearAll() {
    for (auto& pair : m_encryptedStrings) {
        SecureClear(const_cast<std::string&>(pair.first));
        SecureClear(const_cast<std::string&>(pair.second));
    }
    m_encryptedStrings.clear();
}

void StringEncryptionService::CacheEncryptedString(const std::string& key, const std::string& encrypted) {
    m_encryptedStrings[key] = encrypted;
}

std::string StringEncryptionService::GetCachedEncryptedString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        return it->second;
    }
    return "";
}

void StringEncryptionService::ClearCache() {
    SecureClearAll();
}

void StringEncryptionService::RotateKeys() {
    m_cipher.RotateKeys();
    m_keyManager.RotateKeys();
}

void StringEncryptionService::UpdateKeys() {
    m_keyManager.UpdateKeys();
}

size_t StringEncryptionService::GetCachedStringCount() const {
    return m_encryptedStrings.size();
}

std::string StringEncryptionService::GetServiceStatus() const {
    std::stringstream ss;
    ss << "String Encryption Service Status:\n";
    ss << "  Cached Strings: " << GetCachedStringCount() << "\n";
    ss << "  Key Manager: " << (m_keyManager.AreKeysValid() ? "Valid" : "Invalid") << "\n";
    return ss.str();
}

// Convenience functions
std::vector<uint8_t> XOREncrypt(const std::vector<uint8_t>& plaintext) {
    return g_XORCipher.Encrypt(plaintext);
}

std::vector<uint8_t> XORDecrypt(const std::vector<uint8_t>& ciphertext) {
    return g_XORCipher.Decrypt(ciphertext);
}

std::string XOREncryptString(const std::string& plaintext) {
    return g_XORCipher.EncryptString(plaintext);
}

std::string XORDecryptString(const std::string& ciphertext) {
    return g_XORCipher.DecryptString(ciphertext);
}

void XORSecureClear(std::vector<uint8_t>& data) {
    g_XORCipher.SecureClear(data);
}

void XORSecureClear(std::string& str) {
    g_XORCipher.SecureClear(str);
}

} // namespace Encryption
} // namespace StealthClient
