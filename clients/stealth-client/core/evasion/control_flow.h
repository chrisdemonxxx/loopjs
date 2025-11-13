#pragma once
#include <functional>
#include <vector>
#include <random>
#include <unordered_map>

namespace StealthClient {
namespace Evasion {

// Control flow flattening state machine
class ControlFlowFlattener {
private:
    enum class State {
        INIT,
        EXECUTE_1,
        EXECUTE_2,
        EXECUTE_3,
        EXECUTE_4,
        EXECUTE_5,
        EXECUTE_6,
        EXECUTE_7,
        EXECUTE_8,
        FINAL
    };
    
    State m_currentState;
    std::mt19937 m_rng;
    std::unordered_map<State, std::function<void()>> m_stateHandlers;
    
    // State transition functions
    void TransitionToNext();
    void TransitionToRandom();
    void SetState(State newState);
    
public:
    ControlFlowFlattener();
    ~ControlFlowFlattener();
    
    // Execute flattened control flow
    void ExecuteFlattened(const std::vector<std::function<void()>>& operations);
    
    // Add state handler
    void AddStateHandler(State state, std::function<void()> handler);
    
    // Execute single operation with flattening
    void ExecuteOperation(std::function<void()> operation);
    
    // Reset state machine
    void Reset();
    
    // Get current state
    State GetCurrentState() const { return m_currentState; }
};

// Macro for automatic control flow flattening
#define FLATTEN_FLOW(code) \
    do { \
        static ControlFlowFlattener flattener; \
        flattener.ExecuteOperation([&]() { code; }); \
    } while(0)

// Advanced control flow obfuscation
class AdvancedControlFlow {
private:
    std::vector<std::function<void()>> m_operations;
    std::vector<std::function<bool()>> m_conditions;
    std::mt19937 m_rng;
    
    // Obfuscation techniques
    void AddDummyOperations();
    void ShuffleOperations();
    void AddConditionalBranches();
    void AddLoopUnrolling();
    void AddFunctionInlining();
    
public:
    AdvancedControlFlow();
    ~AdvancedControlFlow();
    
    // Add operation to be obfuscated
    void AddOperation(std::function<void()> operation);
    
    // Add conditional operation
    void AddConditionalOperation(std::function<bool()> condition, 
                                std::function<void()> operation);
    
    // Execute all operations with obfuscation
    void ExecuteObfuscated();
    
    // Clear all operations
    void Clear();
    
    // Set obfuscation level
    void SetObfuscationLevel(int level);
    
private:
    int m_obfuscationLevel;
};

// Function call obfuscation
class FunctionCallObfuscator {
private:
    std::unordered_map<void*, std::vector<void*>> m_functionMappings;
    std::mt19937 m_rng;
    
public:
    FunctionCallObfuscator();
    ~FunctionCallObfuscator();
    
    // Obfuscate function call
    template<typename Func, typename... Args>
    auto ObfuscateCall(Func func, Args... args) -> decltype(func(args...)) {
        // Add random delays and dummy operations
        AddRandomDelay();
        ExecuteDummyOperations();
        
        // Call the actual function
        return func(args...);
    }
    
    // Add function mapping for indirection
    void AddFunctionMapping(void* originalFunc, void* obfuscatedFunc);
    
    // Get obfuscated function pointer
    void* GetObfuscatedFunction(void* originalFunc);
    
private:
    void AddRandomDelay();
    void ExecuteDummyOperations();
};

// Global instances
extern ControlFlowFlattener g_ControlFlowFlattener;
extern AdvancedControlFlow g_AdvancedControlFlow;
extern FunctionCallObfuscator g_FunctionCallObfuscator;

// Convenience macros
#define OBFUSCATE_CALL(func, ...) g_FunctionCallObfuscator.ObfuscateCall(func, __VA_ARGS__)
#define ADD_OBFUSCATED_OPERATION(op) g_AdvancedControlFlow.AddOperation(op)
#define EXECUTE_OBFUSCATED() g_AdvancedControlFlow.ExecuteObfuscated()

// Control flow patterns
namespace ControlFlowPatterns {
    // Linear execution with dummy operations
    void LinearWithDummies(const std::vector<std::function<void()>>& operations);
    
    // Random execution order
    void RandomExecution(const std::vector<std::function<void()>>& operations);
    
    // Conditional branching
    void ConditionalBranching(const std::vector<std::function<void()>>& operations,
                             const std::vector<std::function<bool()>>& conditions);
    
    // Loop unrolling
    void LoopUnrolling(const std::function<void()>& operation, int iterations);
    
    // Function inlining
    void InlineFunctions(const std::vector<std::function<void()>>& operations);
    
    // State machine execution
    void StateMachineExecution(const std::vector<std::function<void()>>& operations);
    
    // Recursive obfuscation
    void RecursiveObfuscation(const std::function<void()>& operation, int depth);
}

} // namespace Evasion
} // namespace StealthClient
