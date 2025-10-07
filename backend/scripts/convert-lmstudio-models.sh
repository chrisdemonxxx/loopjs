#!/bin/bash

# LM Studio to Ollama Model Conversion Script
# This script converts your GGUF models to Ollama-compatible format

echo "🔄 LM Studio to Ollama Model Conversion Script"
echo "=============================================="

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama is not running. Please start Ollama first:"
    echo "   ollama serve"
    exit 1
fi

echo "✅ Ollama is running"

# Function to create Modelfile for a specific model
create_modelfile() {
    local model_name=$1
    local base_model=$2
    local system_prompt=$3
    
    cat > "Modelfile.${model_name}" << EOF
FROM ${base_model}

SYSTEM """${system_prompt}"""
EOF
}

# Function to create and test a model
create_model() {
    local model_name=$1
    local base_model=$2
    local system_prompt=$3
    
    echo "🔄 Creating ${model_name}..."
    
    # Create Modelfile
    create_modelfile "${model_name}" "${base_model}" "${system_prompt}"
    
    # Create the model in Ollama
    if ollama create "${model_name}" -f "Modelfile.${model_name}"; then
        echo "✅ Successfully created ${model_name}"
        
        # Test the model with a simple prompt
        echo "🧪 Testing ${model_name}..."
        if echo "Generate a simple PowerShell command to create a folder named TestFolder" | ollama run "${model_name}" > /dev/null 2>&1; then
            echo "✅ ${model_name} is working correctly"
        else
            echo "⚠️  ${model_name} created but may have issues"
        fi
    else
        echo "❌ Failed to create ${model_name}"
        return 1
    fi
    
    # Clean up Modelfile
    rm -f "Modelfile.${model_name}"
}

# System prompts for each model
GEMMA_SYSTEM_PROMPT="You are an expert Windows system administrator and cybersecurity specialist optimized for Command & Control operations. Your expertise includes:

1. Advanced PowerShell scripting and automation
2. Complex multi-step workflow planning
3. System administration and configuration
4. Security operations and penetration testing

Specialize in:
- Generating precise, executable PowerShell commands
- Creating comprehensive automation scripts
- Providing step-by-step technical solutions
- Including proper error handling and validation

Always prioritize security, efficiency, and clarity in your responses."

GPT_OSS_SYSTEM_PROMPT="You are a highly advanced AI assistant specialized in Windows Command & Control operations. Your capabilities include:

1. Complex code generation and PowerShell scripting
2. Advanced system administration and automation
3. Sophisticated security analysis and penetration testing
4. Multi-platform compatibility and optimization

Focus on:
- Generating production-ready PowerShell scripts
- Creating robust automation workflows
- Providing comprehensive security solutions
- Optimizing for performance and reliability

Deliver precise, executable commands with detailed explanations when needed."

QWEN_SYSTEM_PROMPT="You are the ultimate Windows Command & Control specialist with expertise in:

1. Advanced penetration testing and security operations
2. Complex PowerShell scripting and automation
3. System reconnaissance and information gathering
4. Multi-step workflow orchestration

Your specialties:
- Generating sophisticated security assessment tools
- Creating complex automation scripts
- Providing comprehensive penetration testing commands
- Delivering enterprise-grade solutions

Always provide the most advanced, secure, and efficient solutions for C2 operations."

# Convert models one by one
echo ""
echo "🚀 Starting model conversion..."

# Convert Gemma 3 12B
echo ""
echo "📦 Converting Gemma 3 12B..."
create_model "gemma3-12b-c2" "gemma-3-12b-it-GGUF" "${GEMMA_SYSTEM_PROMPT}"

# Convert GPT-OSS 20B
echo ""
echo "📦 Converting GPT-OSS 20B..."
create_model "gpt-oss-20b-c2" "gpt-oss-20b-GGUF" "${GPT_OSS_SYSTEM_PROMPT}"

# Convert Qwen3 Coder 30B
echo ""
echo "📦 Converting Qwen3 Coder 30B..."
create_model "qwen3-coder-30b-c2" "Qwen3-Coder-30B-A3B-Instruct-GGUF" "${QWEN_SYSTEM_PROMPT}"

# List all available models
echo ""
echo "📋 Available Ollama Models:"
ollama list

echo ""
echo "✅ Conversion complete!"
echo ""
echo "🧪 Next steps:"
echo "1. Run the testing script: node backend/scripts/test-lmstudio-models.js"
echo "2. Compare results with existing models"
echo "3. Integrate best performing models into your C2 system"
echo ""
echo "🎯 Models created:"
echo "   - gemma3-12b-c2 (12B parameters)"
echo "   - gpt-oss-20b-c2 (20B parameters)" 
echo "   - qwen3-coder-30b-c2 (30B parameters)"

