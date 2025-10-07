# LM Studio Model Testing Runner
# This script helps you test LM Studio models step by step

Write-Host "🧪 LM Studio Model Testing Runner" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend/scripts/test-lmstudio-models.js")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Ollama is running
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get
    Write-Host "✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not running. Please start Ollama first:" -ForegroundColor Red
    Write-Host "   ollama serve" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting LM Studio Model Testing..." -ForegroundColor Cyan
Write-Host ""
Write-Host "This will test the following models:" -ForegroundColor Yellow
Write-Host "1. gemma3-12b-c2 (12B parameters)" -ForegroundColor White
Write-Host "2. gpt-oss-20b-c2 (20B parameters)" -ForegroundColor White
Write-Host "3. qwen3-coder-30b-c2 (30B parameters)" -ForegroundColor White
Write-Host ""
Write-Host "Each model will be tested with 8 different test cases." -ForegroundColor Yellow
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed? (y/N)"
if ($confirmation -ne "y" -and $confirmation -ne "Y") {
    Write-Host "❌ Testing cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Running tests..." -ForegroundColor Cyan

# Run the testing script
try {
    Set-Location "backend/scripts"
    node test-lmstudio-models.js
    Set-Location "../.."
    
    Write-Host ""
    Write-Host "✅ Testing completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Results saved to:" -ForegroundColor Cyan
    Write-Host "   - lmstudio-gemma3-12b-c2-results.json" -ForegroundColor White
    Write-Host "   - lmstudio-gpt-oss-20b-c2-results.json" -ForegroundColor White
    Write-Host "   - lmstudio-qwen3-coder-30b-c2-results.json" -ForegroundColor White
    Write-Host "   - lmstudio-comprehensive-results.json" -ForegroundColor White
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the individual model results" -ForegroundColor White
    Write-Host "2. Compare with your existing Ollama models" -ForegroundColor White
    Write-Host "3. Integrate the best performing model into your C2 system" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}

