#include "string_encryption.h"
#include "xor_cipher.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <cmath>

namespace StealthClient {
namespace Encryption {

// Global instances
StringEncryptionManager g_StringEncryptionManager;
StringEncryptionUtils g_StringEncryptionUtils;
GlobalStringEncryptionService g_GlobalStringEncryptionService;
StringEncryptionService g_StringEncryptionService;

// SecureString implementation
SecureString::SecureString() : m_isEncrypted(false) {
}

SecureString::SecureString(const std::string& plaintext) : m_plaintext(plaintext), m_isEncrypted(false) {
}

SecureString::SecureString(const SecureString& other) {
    CopyFrom(other);
}

SecureString::SecureString(SecureString&& other) noexcept {
    MoveFrom(std::move(other));
}

SecureString::~SecureString() {
    SecureClear();
}

SecureString& SecureString::operator=(const SecureString& other) {
    if (this != &other) {
        SecureClear();
        CopyFrom(other);
    }
    return *this;
}

SecureString& SecureString::operator=(SecureString&& other) noexcept {
    if (this != &other) {
        SecureClear();
        MoveFrom(std::move(other));
    }
    return *this;
}

SecureString& SecureString::operator=(const std::string& plaintext) {
    SecureClear();
    m_plaintext = plaintext;
    m_isEncrypted = false;
    return *this;
}

std::string SecureString::GetPlaintext() const {
    if (m_isEncrypted) {
        // Return decrypted version
        auto decrypted = g_XORCipher.Decrypt(m_encryptedData);
        return std::string(decrypted.begin(), decrypted.end());
    }
    return m_plaintext;
}

void SecureString::SetPlaintext(const std::string& plaintext) {
    SecureClear();
    m_plaintext = plaintext;
    m_isEncrypted = false;
}

void SecureString::Encrypt() {
    if (!m_isEncrypted && !m_plaintext.empty()) {
        std::vector<uint8_t> plaintextVec(m_plaintext.begin(), m_plaintext.end());
        m_encryptedData = g_XORCipher.Encrypt(plaintextVec);
        SecureClearInternal();
        m_isEncrypted = true;
    }
}

void SecureString::Decrypt() {
    if (m_isEncrypted && !m_encryptedData.empty()) {
        auto decrypted = g_XORCipher.Decrypt(m_encryptedData);
        m_plaintext = std::string(decrypted.begin(), decrypted.end());
        SecureClearInternal();
        m_isEncrypted = false;
    }
}

void SecureString::SecureClear() {
    SecureClearInternal();
    m_encryptedData.clear();
    m_plaintext.clear();
    m_isEncrypted = false;
}

bool SecureString::IsEncrypted() const {
    return m_isEncrypted;
}

bool SecureString::IsEmpty() const {
    if (m_isEncrypted) {
        return m_encryptedData.empty();
    }
    return m_plaintext.empty();
}

size_t SecureString::GetSize() const {
    if (m_isEncrypted) {
        return m_encryptedData.size();
    }
    return m_plaintext.length();
}

bool SecureString::operator==(const SecureString& other) const {
    return GetPlaintext() == other.GetPlaintext();
}

bool SecureString::operator==(const std::string& other) const {
    return GetPlaintext() == other;
}

bool SecureString::operator!=(const SecureString& other) const {
    return !(*this == other);
}

bool SecureString::operator!=(const std::string& other) const {
    return !(*this == other);
}

void SecureString::CopyFrom(const SecureString& other) {
    m_plaintext = other.m_plaintext;
    m_encryptedData = other.m_encryptedData;
    m_isEncrypted = other.m_isEncrypted;
}

void SecureString::MoveFrom(SecureString&& other) {
    m_plaintext = std::move(other.m_plaintext);
    m_encryptedData = std::move(other.m_encryptedData);
    m_isEncrypted = other.m_isEncrypted;
    
    other.m_plaintext.clear();
    other.m_encryptedData.clear();
    other.m_isEncrypted = false;
}

void SecureString::EncryptInternal() {
    if (!m_plaintext.empty()) {
        std::vector<uint8_t> plaintextVec(m_plaintext.begin(), m_plaintext.end());
        m_encryptedData = g_XORCipher.Encrypt(plaintextVec);
    }
}

void SecureString::DecryptInternal() {
    if (!m_encryptedData.empty()) {
        auto decrypted = g_XORCipher.Decrypt(m_encryptedData);
        m_plaintext = std::string(decrypted.begin(), decrypted.end());
    }
}

void SecureString::SecureClearInternal() {
    if (!m_plaintext.empty()) {
        volatile char* ptr = const_cast<char*>(m_plaintext.c_str());
        for (size_t i = 0; i < m_plaintext.length(); i++) {
            ptr[i] = 0;
        }
        m_plaintext.clear();
    }
    
    if (!m_encryptedData.empty()) {
        volatile uint8_t* ptr = m_encryptedData.data();
        for (size_t i = 0; i < m_encryptedData.size(); i++) {
            ptr[i] = 0;
        }
        m_encryptedData.clear();
    }
}

// StringEncryptionManager implementation
StringEncryptionManager::StringEncryptionManager() {
    std::cout << "[DEBUG] String encryption manager initialized" << std::endl;
}

StringEncryptionManager::~StringEncryptionManager() {
    ClearAllManagedStrings();
}

void StringEncryptionManager::StoreString(const std::string& key, const std::string& plaintext) {
    SecureString secureStr(plaintext);
    secureStr.Encrypt();
    m_encryptedStrings[key] = secureStr;
    
    std::cout << "[DEBUG] String stored and encrypted: " << key << std::endl;
}

std::string StringEncryptionManager::RetrieveString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        return it->second.GetPlaintext();
    }
    return "";
}

void StringEncryptionManager::RemoveString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        it->second.SecureClear();
        m_encryptedStrings.erase(it);
        std::cout << "[DEBUG] String removed: " << key << std::endl;
    }
}

void StringEncryptionManager::ClearAllStrings() {
    for (auto& pair : m_encryptedStrings) {
        pair.second.SecureClear();
    }
    m_encryptedStrings.clear();
    ClearAllManagedStrings();
    
    std::cout << "[DEBUG] All strings cleared" << std::endl;
}

std::unique_ptr<SecureString> StringEncryptionManager::CreateSecureString(const std::string& plaintext) {
    auto secureStr = std::make_unique<SecureString>(plaintext);
    AddManagedString(std::move(secureStr));
    return std::make_unique<SecureString>(plaintext);
}

void StringEncryptionManager::EncryptString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        it->second.Encrypt();
    }
}

void StringEncryptionManager::DecryptString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        it->second.Decrypt();
    }
}

void StringEncryptionManager::SecureClearString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    if (it != m_encryptedStrings.end()) {
        it->second.SecureClear();
    }
}

void StringEncryptionManager::EncryptAllStrings() {
    for (auto& pair : m_encryptedStrings) {
        pair.second.Encrypt();
    }
}

void StringEncryptionManager::DecryptAllStrings() {
    for (auto& pair : m_encryptedStrings) {
        pair.second.Decrypt();
    }
}

void StringEncryptionManager::SecureClearAllStrings() {
    for (auto& pair : m_encryptedStrings) {
        pair.second.SecureClear();
    }
}

size_t StringEncryptionManager::GetStringCount() const {
    return m_encryptedStrings.size();
}

bool StringEncryptionManager::HasString(const std::string& key) const {
    return m_encryptedStrings.find(key) != m_encryptedStrings.end();
}

std::vector<std::string> StringEncryptionManager::GetStringKeys() const {
    std::vector<std::string> keys;
    for (const auto& pair : m_encryptedStrings) {
        keys.push_back(pair.first);
    }
    return keys;
}

std::string StringEncryptionManager::GetManagerStatus() const {
    std::stringstream ss;
    ss << "String Encryption Manager Status:\n";
    ss << "  Stored Strings: " << GetStringCount() << "\n";
    ss << "  Managed Strings: " << m_managedStrings.size() << "\n";
    return ss.str();
}

void StringEncryptionManager::AddManagedString(std::unique_ptr<SecureString> str) {
    m_managedStrings.push_back(std::move(str));
}

void StringEncryptionManager::RemoveManagedString(const std::string& key) {
    // Implementation would remove managed string by key
}

void StringEncryptionManager::ClearAllManagedStrings() {
    for (auto& str : m_managedStrings) {
        if (str) {
            str->SecureClear();
        }
    }
    m_managedStrings.clear();
}

// StringEncryptionUtils implementation
std::string StringEncryptionUtils::EncryptString(const std::string& plaintext) {
    return g_XORCipher.EncryptString(plaintext);
}

std::string StringEncryptionUtils::DecryptString(const std::string& ciphertext) {
    return g_XORCipher.DecryptString(ciphertext);
}

void StringEncryptionUtils::SecureClearString(std::string& str) {
    g_XORCipher.SecureClear(str);
}

std::string StringEncryptionUtils::VectorToString(const std::vector<uint8_t>& data) {
    return std::string(data.begin(), data.end());
}

std::vector<uint8_t> StringEncryptionUtils::StringToVector(const std::string& str) {
    return std::vector<uint8_t>(str.begin(), str.end());
}

std::string StringEncryptionUtils::VectorToHex(const std::vector<uint8_t>& data) {
    return g_XORCipher.VectorToHex(data);
}

std::vector<uint8_t> StringEncryptionUtils::HexToVector(const std::string& hexString) {
    return g_XORCipher.HexToVector(hexString);
}

bool StringEncryptionUtils::IsValidHexString(const std::string& str) {
    if (str.length() % 2 != 0) {
        return false;
    }
    
    for (char c : str) {
        if (!std::isxdigit(c)) {
            return false;
        }
    }
    
    return true;
}

bool StringEncryptionUtils::IsValidBase64String(const std::string& str) {
    // Simple base64 validation
    if (str.length() % 4 != 0) {
        return false;
    }
    
    for (char c : str) {
        if (!std::isalnum(c) && c != '+' && c != '/' && c != '=') {
            return false;
        }
    }
    
    return true;
}

bool StringEncryptionUtils::IsEncryptedString(const std::string& str) {
    // Check if string looks like encrypted data (hex string)
    return IsValidHexString(str) && str.length() > 2;
}

std::string StringEncryptionUtils::Obfuscate(const std::string& str) {
    return ObfuscateString(str);
}

std::string StringEncryptionUtils::Deobfuscate(const std::string& str) {
    return DeobfuscateString(str);
}

size_t StringEncryptionUtils::GetStringEntropy(const std::string& str) {
    if (str.empty()) {
        return 0;
    }
    
    // Calculate Shannon entropy
    std::unordered_map<char, size_t> charCounts;
    for (char c : str) {
        charCounts[c]++;
    }
    
    double entropy = 0.0;
    double length = static_cast<double>(str.length());
    
    for (const auto& pair : charCounts) {
        double probability = static_cast<double>(pair.second) / length;
        if (probability > 0.0) {
            entropy -= probability * std::log2(probability);
        }
    }
    
    return static_cast<size_t>(entropy * 100); // Return as integer percentage
}

bool StringEncryptionUtils::IsHighEntropyString(const std::string& str) {
    size_t entropy = GetStringEntropy(str);
    return entropy > StringEncryptionConstants::HIGH_ENTROPY_THRESHOLD * 100;
}

std::string StringEncryptionUtils::GetStringInfo(const std::string& str) {
    std::stringstream ss;
    ss << "String Information:\n";
    ss << "  Length: " << str.length() << " characters\n";
    ss << "  Entropy: " << GetStringEntropy(str) / 100.0 << " bits\n";
    ss << "  High Entropy: " << (IsHighEntropyString(str) ? "Yes" : "No") << "\n";
    ss << "  Valid Hex: " << (IsValidHexString(str) ? "Yes" : "No") << "\n";
    ss << "  Valid Base64: " << (IsValidBase64String(str) ? "Yes" : "No") << "\n";
    ss << "  Appears Encrypted: " << (IsEncryptedString(str) ? "Yes" : "No") << "\n";
    return ss.str();
}

std::string StringEncryptionUtils::ObfuscateString(const std::string& str) {
    std::string obfuscated = str;
    
    // Simple obfuscation: XOR with position
    for (size_t i = 0; i < obfuscated.length(); i++) {
        obfuscated[i] ^= static_cast<char>(i & 0xFF);
    }
    
    return obfuscated;
}

std::string StringEncryptionUtils::DeobfuscateString(const std::string& str) {
    std::string deobfuscated = str;
    
    // Reverse obfuscation: XOR with position
    for (size_t i = 0; i < deobfuscated.length(); i++) {
        deobfuscated[i] ^= static_cast<char>(i & 0xFF);
    }
    
    return deobfuscated;
}

// GlobalStringEncryptionService implementation
GlobalStringEncryptionService::GlobalStringEncryptionService() {
    InitializeService();
}

GlobalStringEncryptionService::~GlobalStringEncryptionService() {
    ShutdownService();
}

void GlobalStringEncryptionService::InitializeService() {
    std::cout << "[DEBUG] Global string encryption service initialized" << std::endl;
}

void GlobalStringEncryptionService::ShutdownService() {
    SecureClearAll();
    std::cout << "[DEBUG] Global string encryption service shutdown" << std::endl;
}

void GlobalStringEncryptionService::Initialize() {
    InitializeService();
}

void GlobalStringEncryptionService::Shutdown() {
    ShutdownService();
}

std::string GlobalStringEncryptionService::EncryptString(const std::string& plaintext) {
    return m_utils.EncryptString(plaintext);
}

std::string GlobalStringEncryptionService::DecryptString(const std::string& ciphertext) {
    return m_utils.DecryptString(ciphertext);
}

void GlobalStringEncryptionService::SecureClearString(std::string& str) {
    m_utils.SecureClearString(str);
}

void GlobalStringEncryptionService::StoreString(const std::string& key, const std::string& plaintext) {
    m_manager.StoreString(key, plaintext);
}

std::string GlobalStringEncryptionService::RetrieveString(const std::string& key) {
    return m_manager.RetrieveString(key);
}

void GlobalStringEncryptionService::RemoveString(const std::string& key) {
    m_manager.RemoveString(key);
}

void GlobalStringEncryptionService::ClearAllStrings() {
    m_manager.ClearAllStrings();
}

void GlobalStringEncryptionService::EncryptAllStrings() {
    m_manager.EncryptAllStrings();
}

void GlobalStringEncryptionService::DecryptAllStrings() {
    m_manager.DecryptAllStrings();
}

void GlobalStringEncryptionService::SecureClearAllStrings() {
    m_manager.SecureClearAllStrings();
}

size_t GlobalStringEncryptionService::GetStringCount() const {
    return m_manager.GetStringCount();
}

std::string GlobalStringEncryptionService::GetServiceStatus() const {
    std::stringstream ss;
    ss << "Global String Encryption Service Status:\n";
    ss << m_manager.GetManagerStatus() << "\n";
    return ss.str();
}

std::string GlobalStringEncryptionService::GetServiceSummary() const {
    std::stringstream ss;
    ss << "Service Summary:\n";
    ss << "  Total Strings: " << GetStringCount() << "\n";
    ss << "  Service Status: Active\n";
    return ss.str();
}

void GlobalStringEncryptionService::SecureClearAll() {
    m_manager.SecureClearAllStrings();
}

// Convenience functions
std::string EncryptString(const std::string& plaintext) {
    return g_GlobalStringEncryptionService.EncryptString(plaintext);
}

std::string DecryptString(const std::string& ciphertext) {
    return g_GlobalStringEncryptionService.DecryptString(ciphertext);
}

void SecureClearString(std::string& str) {
    g_GlobalStringEncryptionService.SecureClearString(str);
}

void StoreEncryptedString(const std::string& key, const std::string& plaintext) {
    g_GlobalStringEncryptionService.StoreString(key, plaintext);
}

std::string RetrieveEncryptedString(const std::string& key) {
    return g_GlobalStringEncryptionService.RetrieveString(key);
}

void RemoveEncryptedString(const std::string& key) {
    g_GlobalStringEncryptionService.RemoveString(key);
}

void ClearAllEncryptedStrings() {
    g_GlobalStringEncryptionService.ClearAllStrings();
}

std::string GetStringEncryptionStatus() {
    return g_GlobalStringEncryptionService.GetServiceStatus();
}

// StringEncryptionService implementation
StringEncryptionService::StringEncryptionService() {
    std::cout << "[DEBUG] StringEncryptionService constructor called" << std::endl;
}

StringEncryptionService::~StringEncryptionService() {
    SecureClearAll();
}

void StringEncryptionService::Initialize() {
    std::cout << "[DEBUG] StringEncryptionService::Initialize called" << std::endl;
    // Initialize the service
}

void StringEncryptionService::Shutdown() {
    std::cout << "[DEBUG] StringEncryptionService::Shutdown called" << std::endl;
    SecureClearAll();
}

std::string StringEncryptionService::EncryptString(const std::string& plaintext) {
    return g_XORCipher.EncryptString(plaintext);
}

std::string StringEncryptionService::DecryptString(const std::string& ciphertext) {
    return g_XORCipher.DecryptString(ciphertext);
}

void StringEncryptionService::SecureClear(std::string& str) {
    g_XORCipher.SecureClear(str);
}

void StringEncryptionService::SecureClearAll() {
    m_encryptedStrings.clear();
}

void StringEncryptionService::CacheEncryptedString(const std::string& key, const std::string& encrypted) {
    m_encryptedStrings[key] = encrypted;
}

std::string StringEncryptionService::GetCachedEncryptedString(const std::string& key) {
    auto it = m_encryptedStrings.find(key);
    return (it != m_encryptedStrings.end()) ? it->second : "";
}

void StringEncryptionService::ClearCache() {
    m_encryptedStrings.clear();
}

void StringEncryptionService::UpdateKeys() {
    g_XORCipher.GenerateNewKeys();
}

size_t StringEncryptionService::GetCachedStringCount() const {
    return m_encryptedStrings.size();
}

std::string StringEncryptionService::GetServiceStatus() const {
    return "StringEncryptionService: Active, Cached Strings: " + std::to_string(m_encryptedStrings.size());
}

} // namespace Encryption
} // namespace StealthClient
