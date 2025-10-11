#include "json_utils.h"
#include <iostream>
#include <sstream>

namespace StealthClient {

json JsonUtils::ParseJson(const std::string& jsonStr) {
    try {
        return json::parse(jsonStr);
    } catch (const json::parse_error& e) {
        std::cerr << "[ERROR] JSON parse error: " << e.what() << std::endl;
        return json::object();
    }
}

std::string JsonUtils::ToJsonString(const json& j) {
    try {
        return j.dump();
    } catch (const json::exception& e) {
        std::cerr << "[ERROR] JSON dump error: " << e.what() << std::endl;
        return "{}";
    }
}

std::string JsonUtils::CreateRegisterMessage(const std::string& uuid, const std::string& computerName, const std::string& ipAddress, const std::string& platform) {
    json message;
    message["type"] = "register";
    message["uuid"] = uuid;
    message["computerName"] = computerName;
    message["ipAddress"] = ipAddress;
    message["platform"] = platform;
    message["timestamp"] = std::time(nullptr);
    
    return ToJsonString(message);
}

std::string JsonUtils::CreateHeartbeatMessage(const std::string& uuid) {
    json message;
    message["type"] = "heartbeat";
    message["uuid"] = uuid;
    message["timestamp"] = std::time(nullptr);
    
    return ToJsonString(message);
}

std::string JsonUtils::CreateOutputMessage(const std::string& taskId, const std::string& output, const std::string& status) {
    json message;
    message["type"] = "command_result";
    message["taskId"] = taskId;
    message["output"] = output;
    message["status"] = status;
    message["timestamp"] = std::time(nullptr);
    
    return ToJsonString(message);
}

std::string JsonUtils::GetMessageType(const std::string& jsonStr) {
    try {
        json j = ParseJson(jsonStr);
        if (j.contains("type") && j["type"].is_string()) {
            return j["type"].get<std::string>();
        }
    } catch (const json::exception& e) {
        std::cerr << "[ERROR] Failed to get message type: " << e.what() << std::endl;
    }
    return "";
}

std::string JsonUtils::GetStringField(const std::string& jsonStr, const std::string& field) {
    try {
        json j = ParseJson(jsonStr);
        if (j.contains(field) && j[field].is_string()) {
            return j[field].get<std::string>();
        }
    } catch (const json::exception& e) {
        std::cerr << "[ERROR] Failed to get string field '" << field << "': " << e.what() << std::endl;
    }
    return "";
}

int JsonUtils::GetIntField(const std::string& jsonStr, const std::string& field) {
    try {
        json j = ParseJson(jsonStr);
        if (j.contains(field) && j[field].is_number_integer()) {
            return j[field].get<int>();
        }
    } catch (const json::exception& e) {
        std::cerr << "[ERROR] Failed to get int field '" << field << "': " << e.what() << std::endl;
    }
    return 0;
}

bool JsonUtils::GetBoolField(const std::string& jsonStr, const std::string& field) {
    try {
        json j = ParseJson(jsonStr);
        if (j.contains(field) && j[field].is_boolean()) {
            return j[field].get<bool>();
        }
    } catch (const json::exception& e) {
        std::cerr << "[ERROR] Failed to get bool field '" << field << "': " << e.what() << std::endl;
    }
    return false;
}

} // namespace StealthClient