# Import LM Studio Models to Ollama
# This script creates Ollama models from your GGUF files

Write-Host "🔄 Importing LM Studio Models to Ollama" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Define the models and their paths
$models = @(
    @{
        Name = "gemma3-12b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\gemma-3-12b-it-GGUF\gemma-3-12b-it-Q4_K_M.gguf"
        SystemPrompt = "You are an expert Windows system administrator and cybersecurity specialist optimized for Command & Control operations. Your expertise includes: 1. Advanced PowerShell scripting and automation 2. Complex multi-step workflow planning 3. System administration and configuration 4. Security operations and penetration testing. Specialize in: - Generating precise, executable PowerShell commands - Creating comprehensive automation scripts - Providing step-by-step technical solutions - Including proper error handling and validation. Always prioritize security, efficiency, and clarity in your responses."
    },
    @{
        Name = "gpt-oss-20b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\gpt-oss-20b-GGUF\gpt-oss-20b-MXFP4.gguf"
        SystemPrompt = "You are a highly advanced AI assistant specialized in Windows Command & Control operations. Your capabilities include: 1. Complex code generation and PowerShell scripting 2. Advanced system administration and automation 3. Sophisticated security analysis and penetration testing 4. Multi-platform compatibility and optimization. Focus on: - Generating production-ready PowerShell scripts - Creating robust automation workflows - Providing comprehensive security solutions - Optimizing for performance and reliability. Deliver precise, executable commands with detailed explanations when needed."
    },
    @{
        Name = "qwen3-coder-30b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\Qwen3-Coder-30B-A3B-Instruct-GGUF\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
        SystemPrompt = "You are the ultimate Windows Command & Control specialist with expertise in: 1. Advanced penetration testing and security operations 2. Complex PowerShell scripting and automation 3. System reconnaissance and information gathering 4. Multi-step workflow orchestration. Your specialties: - Generating sophisticated security assessment tools - Creating complex automation scripts - Providing comprehensive penetration testing commands - Delivering enterprise-grade solutions. Always provide the most advanced, secure, and efficient solutions for C2 operations."
    }
)

# Function to create a model
function Import-Model {
    param(
        [string]$ModelName,
        [string]$GGUFPath,
        [string]$SystemPrompt
    )
    
    Write-Host "🔄 Importing $ModelName..." -ForegroundColor Yellow
    
    # Check if GGUF file exists
    if (-not (Test-Path $GGUFPath)) {
        Write-Host "❌ GGUF file not found: $GGUFPath" -ForegroundColor Red
        return $false
    }
    
    # Create Modelfile content
    $modelfileContent = @"
FROM $GGUFPath

SYSTEM """$SystemPrompt"""
"@
    
    # Write Modelfile
    $modelfilePath = "Modelfile.$ModelName"
    $modelfileContent | Out-File -FilePath $modelfilePath -Encoding UTF8
    
    try {
        # Create the model using Ollama
        $ollamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
        $process = Start-Process -FilePath $ollamaPath -ArgumentList "create", $ModelName, "-f", $modelfilePath -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Successfully imported $ModelName" -ForegroundColor Green
            
            # Test the model
            Write-Host "🧪 Testing $ModelName..." -ForegroundColor Yellow
            $testPrompt = "Generate a simple PowerShell command to create a folder named TestFolder"
            
            try {
                $testResult = echo $testPrompt | & $ollamaPath run $ModelName 2>$null
                if ($testResult) {
                    Write-Host "✅ $ModelName is working correctly" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  $ModelName imported but test failed" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  $ModelName imported but test failed" -ForegroundColor Yellow
            }
            
            return $true
        } else {
            Write-Host "❌ Failed to import $ModelName" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Error importing $ModelName`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    } finally {
        # Clean up Modelfile
        Remove-Item -Path $modelfilePath -Force -ErrorAction SilentlyContinue
    }
}

# Import all models
Write-Host ""
Write-Host "🚀 Starting model import..." -ForegroundColor Cyan

$successCount = 0
foreach ($model in $models) {
    $success = Import-Model -ModelName $model.Name -GGUFPath $model.GGUFPath -SystemPrompt $model.SystemPrompt
    if ($success) {
        $successCount++
    }
    Write-Host ""
}

# Show results
Write-Host "📊 Import Summary:" -ForegroundColor Cyan
Write-Host "   Successful: $successCount/$($models.Count)" -ForegroundColor Green

if ($successCount -gt 0) {
    Write-Host ""
    Write-Host "✅ Models imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run the testing script: node backend/scripts/test-lmstudio-models.js" -ForegroundColor White
    Write-Host "2. Compare results with existing models" -ForegroundColor White
    Write-Host "3. Integrate best performing models into your C2 system" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ No models were imported successfully" -ForegroundColor Red
}

