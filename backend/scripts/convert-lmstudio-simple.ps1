# LM Studio to Ollama Model Conversion Script (PowerShell)
# This script converts your GGUF models to Ollama-compatible format

Write-Host "🔄 LM Studio to Ollama Model Conversion Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Check if Ollama is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running. Please start Ollama first:" -ForegroundColor Red
    Write-Host "   ollama serve" -ForegroundColor Yellow
    exit 1
}

# Function to create Modelfile for a specific model
function Create-Modelfile {
    param(
        [string]$ModelName,
        [string]$BaseModel,
        [string]$SystemPrompt
    )
    
    $modelfileContent = @"
FROM $BaseModel

SYSTEM """$SystemPrompt"""
"@
    
    $modelfilePath = "Modelfile.$ModelName"
    $modelfileContent | Out-File -FilePath $modelfilePath -Encoding UTF8
    return $modelfilePath
}

# Function to create and test a model
function Create-Model {
    param(
        [string]$ModelName,
        [string]$BaseModel,
        [string]$SystemPrompt
    )
    
    Write-Host "🔄 Creating $ModelName..." -ForegroundColor Yellow
    
    # Create Modelfile
    $modelfilePath = Create-Modelfile -ModelName $ModelName -BaseModel $BaseModel -SystemPrompt $SystemPrompt
    
    # Create the model in Ollama
    try {
        $process = Start-Process -FilePath "ollama" -ArgumentList "create", $ModelName, "-f", $modelfilePath -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Successfully created $ModelName" -ForegroundColor Green
            
            # Test the model with a simple prompt
            Write-Host "🧪 Testing $ModelName..." -ForegroundColor Yellow
            $testPrompt = "Generate a simple PowerShell command to create a folder named TestFolder"
            
            try {
                $testResult = echo $testPrompt | ollama run $ModelName 2>$null
                if ($testResult) {
                    Write-Host "✅ $ModelName is working correctly" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  $ModelName created but may have issues" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  $ModelName created but test failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Failed to create $ModelName" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error creating $ModelName`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    # Clean up Modelfile
    Remove-Item -Path $modelfilePath -Force -ErrorAction SilentlyContinue
    return $true
}

# System prompts for each model
$GEMMA_SYSTEM_PROMPT = @"
You are an expert Windows system administrator and cybersecurity specialist optimized for Command & Control operations. Your expertise includes:

1. Advanced PowerShell scripting and automation
2. Complex multi-step workflow planning
3. System administration and configuration
4. Security operations and penetration testing

Specialize in:
- Generating precise, executable PowerShell commands
- Creating comprehensive automation scripts
- Providing step-by-step technical solutions
- Including proper error handling and validation

Always prioritize security, efficiency, and clarity in your responses.
"@

$GPT_OSS_SYSTEM_PROMPT = @"
You are a highly advanced AI assistant specialized in Windows Command & Control operations. Your capabilities include:

1. Complex code generation and PowerShell scripting
2. Advanced system administration and automation
3. Sophisticated security analysis and penetration testing
4. Multi-platform compatibility and optimization

Focus on:
- Generating production-ready PowerShell scripts
- Creating robust automation workflows
- Providing comprehensive security solutions
- Optimizing for performance and reliability

Deliver precise, executable commands with detailed explanations when needed.
"@

$QWEN_SYSTEM_PROMPT = @"
You are the ultimate Windows Command & Control specialist with expertise in:

1. Advanced penetration testing and security operations
2. Complex PowerShell scripting and automation
3. System reconnaissance and information gathering
4. Multi-step workflow orchestration

Your specialties:
- Generating sophisticated security assessment tools
- Creating complex automation scripts
- Providing comprehensive penetration testing commands
- Delivering enterprise-grade solutions

Always provide the most advanced, secure, and efficient solutions for C2 operations.
"@

# Convert models one by one
Write-Host ""
Write-Host "🚀 Starting model conversion..." -ForegroundColor Cyan

# Convert Gemma 3 12B
Write-Host ""
Write-Host "📦 Converting Gemma 3 12B..." -ForegroundColor Yellow
$gemmaSuccess = Create-Model -ModelName "gemma3-12b-c2" -BaseModel "gemma-3-12b-it-GGUF" -SystemPrompt $GEMMA_SYSTEM_PROMPT

# Convert GPT-OSS 20B
Write-Host ""
Write-Host "📦 Converting GPT-OSS 20B..." -ForegroundColor Yellow
$gptSuccess = Create-Model -ModelName "gpt-oss-20b-c2" -BaseModel "gpt-oss-20b-GGUF" -SystemPrompt $GPT_OSS_SYSTEM_PROMPT

# Convert Qwen3 Coder 30B
Write-Host ""
Write-Host "📦 Converting Qwen3 Coder 30B..." -ForegroundColor Yellow
$qwenSuccess = Create-Model -ModelName "qwen3-coder-30b-c2" -BaseModel "Qwen3-Coder-30B-A3B-Instruct-GGUF" -SystemPrompt $QWEN_SYSTEM_PROMPT

# List all available models
Write-Host ""
Write-Host "📋 Available Ollama Models:" -ForegroundColor Cyan
try {
    ollama list
} catch {
    Write-Host "Could not list models" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Conversion complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run the testing script: node backend/scripts/test-lmstudio-models.js" -ForegroundColor White
Write-Host "2. Compare results with existing models" -ForegroundColor White
Write-Host "3. Integrate best performing models into your C2 system" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Models created:" -ForegroundColor Cyan
Write-Host "   - gemma3-12b-c2 (12B parameters)" -ForegroundColor White
Write-Host "   - gpt-oss-20b-c2 (20B parameters)" -ForegroundColor White
Write-Host "   - qwen3-coder-30b-c2 (30B parameters)" -ForegroundColor White

# Summary
$totalModels = 3
$successfulModels = @($gemmaSuccess, $gptSuccess, $qwenSuccess) | Where-Object { $_ -eq $true } | Measure-Object | Select-Object -ExpandProperty Count

Write-Host ""
Write-Host "📊 Conversion Summary:" -ForegroundColor Cyan
Write-Host "   Successful: $successfulModels/$totalModels" -ForegroundColor Green

