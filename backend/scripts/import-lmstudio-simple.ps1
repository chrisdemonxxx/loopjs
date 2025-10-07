# Import LM Studio Models to Ollama
Write-Host "Importing LM Studio Models to Ollama" -ForegroundColor Cyan

# Define the models and their paths
$models = @(
    @{
        Name = "gemma3-12b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\gemma-3-12b-it-GGUF\gemma-3-12b-it-Q4_K_M.gguf"
        SystemPrompt = "You are an expert Windows system administrator and cybersecurity specialist optimized for Command & Control operations."
    },
    @{
        Name = "gpt-oss-20b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\gpt-oss-20b-GGUF\gpt-oss-20b-MXFP4.gguf"
        SystemPrompt = "You are a highly advanced AI assistant specialized in Windows Command & Control operations."
    },
    @{
        Name = "qwen3-coder-30b-c2"
        GGUFPath = "D:\lmstudio\lmstudio-community\Qwen3-Coder-30B-A3B-Instruct-GGUF\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
        SystemPrompt = "You are the ultimate Windows Command & Control specialist with expertise in advanced penetration testing and security operations."
    }
)

# Function to create a model
function Import-Model {
    param(
        [string]$ModelName,
        [string]$GGUFPath,
        [string]$SystemPrompt
    )
    
    Write-Host "Importing $ModelName..." -ForegroundColor Yellow
    
    # Check if GGUF file exists
    if (-not (Test-Path $GGUFPath)) {
        Write-Host "GGUF file not found: $GGUFPath" -ForegroundColor Red
        return $false
    }
    
    # Create Modelfile content
    $modelfileContent = "FROM $GGUFPath`n`nSYSTEM `"`"`"$SystemPrompt`"`"`""
    
    # Write Modelfile
    $modelfilePath = "Modelfile.$ModelName"
    $modelfileContent | Out-File -FilePath $modelfilePath -Encoding UTF8
    
    try {
        # Create the model using Ollama
        $ollamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
        $process = Start-Process -FilePath $ollamaPath -ArgumentList "create", $ModelName, "-f", $modelfilePath -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-Host "Successfully imported $ModelName" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Failed to import $ModelName" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error importing $ModelName" -ForegroundColor Red
        return $false
    } finally {
        # Clean up Modelfile
        Remove-Item -Path $modelfilePath -Force -ErrorAction SilentlyContinue
    }
}

# Import all models
Write-Host ""
Write-Host "Starting model import..." -ForegroundColor Cyan

$successCount = 0
foreach ($model in $models) {
    $success = Import-Model -ModelName $model.Name -GGUFPath $model.GGUFPath -SystemPrompt $model.SystemPrompt
    if ($success) {
        $successCount++
    }
    Write-Host ""
}

# Show results
Write-Host "Import Summary:" -ForegroundColor Cyan
Write-Host "   Successful: $successCount/$($models.Count)" -ForegroundColor Green

if ($successCount -gt 0) {
    Write-Host ""
    Write-Host "Models imported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run the testing script: node backend/scripts/test-lmstudio-models.js" -ForegroundColor White
    Write-Host "2. Compare results with existing models" -ForegroundColor White
    Write-Host "3. Integrate best performing models into your C2 system" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "No models were imported successfully" -ForegroundColor Red
}
