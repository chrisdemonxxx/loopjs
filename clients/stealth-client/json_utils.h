#pragma once
#include <string>
#include <map>
#include <vector>
#include "json.hpp"

using json = nlohmann::json;

namespace StealthClient {

// JSON utilities using nlohmann/json
class JsonUtils {
public:
    // Helper methods for common message types
    static std::string CreateRegisterMessage(const std::string& uuid, const std::string& computerName, const std::string& ipAddress, const std::string& platform);
    static std::string CreateHeartbeatMessage(const std::string& uuid);
    static std::string CreateOutputMessage(const std::string& taskId, const std::string& output, const std::string& status);
    
    // Parse incoming messages
    static std::string GetMessageType(const std::string& jsonStr);
    static std::string GetStringField(const std::string& jsonStr, const std::string& field);
    static int GetIntField(const std::string& jsonStr, const std::string& field);
    static bool GetBoolField(const std::string& jsonStr, const std::string& field);
    
    // Utility methods
    static json ParseJson(const std::string& jsonStr);
    static std::string ToJsonString(const json& j);
};

} // namespace StealthClient
