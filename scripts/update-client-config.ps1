# ================================================
# Update Client Configuration Script
# ================================================
# This script automates Step 8 from QUICK_FIX_GUIDE.md
# - Gets backend URL from Cloud Run
# - Updates client configuration files
# - Provides next steps for rebuilding client
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "loopjs-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
)

# Color output functions
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Step { Write-Host "`n🔧 $args" -ForegroundColor Magenta }

# Check if we're in the project root
if (-not (Test-Path "clients/qt-client")) {
    Write-Error "This script must be run from the project root directory"
    exit 1
}

# Get backend URL if not provided
if (-not $BackendUrl) {
    Write-Step "Getting backend URL from Cloud Run..."
    
    try {
        $BackendUrl = gcloud run services describe $ServiceName `
            --region $Region `
            --format="value(status.url)" 2>&1
        
        if ($LASTEXITCODE -ne 0 -or -not $BackendUrl) {
            Write-Error "Failed to get backend URL. Is the service deployed?"
            Write-Info "You can manually provide the URL: .\update-client-config.ps1 -BackendUrl 'https://your-backend-url.run.app'"
            exit 1
        }
        
        Write-Success "Backend URL: $BackendUrl"
    } catch {
        Write-Error "Failed to get backend URL: $_"
        exit 1
    }
}

# Convert HTTP to WSS
$WsUrl = $BackendUrl -replace "^https://", "wss://"
$WsUrl = "$WsUrl/ws"

Write-Info "WebSocket URL: $WsUrl"

# ================================================
# Update config.json
# ================================================
Write-Step "Updating clients/qt-client/config.json..."

$configPath = "clients/qt-client/config.json"

if (Test-Path $configPath) {
    # Read existing config or create new one
    try {
        $config = Get-Content $configPath | ConvertFrom-Json
    } catch {
        $config = @{}
    }
} else {
    $config = @{}
}

# Update config
$config = @{
    server = @{
        url = $WsUrl
    }
}

# Write config
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
Write-Success "config.json updated"

# ================================================
# Update mainwindow.cpp
# ================================================
Write-Step "Updating clients/qt-client/mainwindow.cpp..."

$mainwindowPath = "clients/qt-client/mainwindow.cpp"

if (Test-Path $mainwindowPath) {
    $content = Get-Content $mainwindowPath -Raw
    
    # Update DEF_WS_URL
    if ($content -match '#define\s+DEF_WS_URL\s+"[^"]*"') {
        $content = $content -replace '#define\s+DEF_WS_URL\s+"[^"]*"', "#define DEF_WS_URL `"$WsUrl`""
        $content | Set-Content $mainwindowPath -NoNewline -Encoding UTF8
        Write-Success "mainwindow.cpp updated"
    } else {
        Write-Warning "DEF_WS_URL not found in mainwindow.cpp. You may need to add it manually."
    }
} else {
    Write-Warning "mainwindow.cpp not found at $mainwindowPath"
}

# ================================================
# Summary
# ================================================
Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "🎉 Client Configuration Updated!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

Write-Host "`n📋 Configuration:" -ForegroundColor Cyan
Write-Host "  • Backend URL:   $BackendUrl" -ForegroundColor White
Write-Host "  • WebSocket URL: $WsUrl" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Rebuild the Qt client:" -ForegroundColor White
Write-Host "     cd clients/qt-client" -ForegroundColor Gray
Write-Host "     .\build.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test the client:" -ForegroundColor White
Write-Host "     cd clients/qt-client/build" -ForegroundColor Gray
Write-Host "     .\SysManagePro.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Verify connection in backend logs:" -ForegroundColor White
Write-Host "     gcloud run services logs read $ServiceName --region $Region --limit 50" -ForegroundColor Gray

Write-Host "`n✅ Configuration complete!" -ForegroundColor Green

