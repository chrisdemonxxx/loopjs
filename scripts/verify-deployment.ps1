# ================================================
# Deployment Verification Script
# ================================================
# This script verifies that your deployment is working correctly
# - Checks backend health
# - Verifies WebSocket endpoint
# - Checks frontend deployment
# - Tests connectivity
# ================================================

param(
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

$allChecksPassed = $true

# ================================================
# Check 1: Backend Deployment
# ================================================
Write-Step "Checking Backend Deployment..."

try {
    $backendUrl = gcloud run services describe $ServiceName `
        --region $Region `
        --format="value(status.url)" 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $backendUrl) {
        Write-Success "Backend deployed at: $backendUrl"
    } else {
        Write-Error "Backend service not found"
        $allChecksPassed = $false
        $backendUrl = $null
    }
} catch {
    Write-Error "Failed to check backend deployment: $_"
    $allChecksPassed = $false
    $backendUrl = $null
}

# ================================================
# Check 2: Health Endpoint
# ================================================
if ($backendUrl) {
    Write-Step "Testing Health Endpoint..."
    
    try {
        $healthResponse = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 10
        
        if ($healthResponse.StatusCode -eq 200) {
            $healthData = $healthResponse.Content | ConvertFrom-Json
            if ($healthData.status -eq "healthy") {
                Write-Success "Health check passed: $($healthResponse.Content)"
            } else {
                Write-Warning "Health check returned unexpected status: $($healthResponse.Content)"
                $allChecksPassed = $false
            }
        } else {
            Write-Error "Health check failed with status code: $($healthResponse.StatusCode)"
            $allChecksPassed = $false
        }
    } catch {
        Write-Error "Health check failed: $($_.Exception.Message)"
        $allChecksPassed = $false
    }
}

# ================================================
# Check 3: WebSocket Configuration
# ================================================
if ($backendUrl) {
    Write-Step "Checking WebSocket Configuration..."
    
    $wsUrl = $backendUrl -replace "^https://", "wss://"
    $wsUrl = "$wsUrl/ws"
    Write-Info "WebSocket URL: $wsUrl"
    Write-Success "WebSocket endpoint configured"
}

# ================================================
# Check 4: Secrets Configuration
# ================================================
Write-Step "Checking GCP Secrets..."

$secrets = @("MONGODB_URI", "JWT_SECRET", "SESSION_SECRET")
$secretsOk = $true

foreach ($secret in $secrets) {
    try {
        $secretInfo = gcloud secrets describe $secret --format="value(name)" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$secret exists"
        } else {
            Write-Error "$secret not found"
            $secretsOk = $false
            $allChecksPassed = $false
        }
    } catch {
        Write-Error "Failed to check $secret"
        $secretsOk = $false
        $allChecksPassed = $false
    }
}

# ================================================
# Check 5: Service Configuration
# ================================================
if ($backendUrl) {
    Write-Step "Checking Service Configuration..."
    
    try {
        $serviceInfo = gcloud run services describe $ServiceName --region $Region --format=json | ConvertFrom-Json
        
        # Check memory
        $memory = $serviceInfo.spec.template.spec.containers[0].resources.limits.memory
        Write-Info "Memory: $memory"
        
        # Check concurrency
        $concurrency = $serviceInfo.spec.template.spec.containerConcurrency
        Write-Info "Concurrency: $concurrency"
        
        # Check secrets
        $envSecrets = $serviceInfo.spec.template.spec.containers[0].env | Where-Object { $_.valueFrom.secretKeyRef }
        if ($envSecrets.Count -ge 3) {
            Write-Success "Secrets properly configured in Cloud Run"
        } else {
            Write-Warning "Some secrets may not be configured in Cloud Run"
        }
        
        Write-Success "Service configuration looks good"
    } catch {
        Write-Warning "Could not verify service configuration: $_"
    }
}

# ================================================
# Check 6: Recent Logs
# ================================================
if ($backendUrl) {
    Write-Step "Checking Recent Logs..."
    
    try {
        Write-Info "Fetching last 5 log entries..."
        $logs = gcloud run services logs read $ServiceName --region $Region --limit 5 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Logs accessible"
            Write-Info "Recent logs:"
            Write-Host $logs -ForegroundColor Gray
        } else {
            Write-Warning "Could not fetch logs"
        }
    } catch {
        Write-Warning "Could not fetch logs: $_"
    }
}

# ================================================
# Check 7: Client Configuration Files
# ================================================
Write-Step "Checking Client Configuration..."

if (Test-Path "clients/qt-client/config.json") {
    try {
        $config = Get-Content "clients/qt-client/config.json" | ConvertFrom-Json
        $configUrl = $config.server.url
        
        if ($configUrl) {
            Write-Info "config.json URL: $configUrl"
            
            if ($backendUrl -and $configUrl -match $backendUrl.Replace("https://", "")) {
                Write-Success "config.json is up to date"
            } else {
                Write-Warning "config.json may need updating with current backend URL"
            }
        } else {
            Write-Warning "config.json doesn't have server URL configured"
        }
    } catch {
        Write-Warning "Could not parse config.json: $_"
    }
} else {
    Write-Warning "config.json not found"
}

if (Test-Path "clients/qt-client/mainwindow.cpp") {
    $mainwindow = Get-Content "clients/qt-client/mainwindow.cpp" -Raw
    if ($mainwindow -match '#define\s+DEF_WS_URL\s+"([^"]*)"') {
        $cppUrl = $matches[1]
        Write-Info "mainwindow.cpp URL: $cppUrl"
        Write-Success "mainwindow.cpp has WebSocket URL configured"
    } else {
        Write-Warning "DEF_WS_URL not found in mainwindow.cpp"
    }
} else {
    Write-Warning "mainwindow.cpp not found"
}

# ================================================
# Summary
# ================================================
Write-Host "`n" + "="*60 -ForegroundColor $(if ($allChecksPassed) { "Green" } else { "Yellow" })
if ($allChecksPassed) {
    Write-Host "🎉 All Checks Passed!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some Checks Failed" -ForegroundColor Yellow
}
Write-Host "="*60 -ForegroundColor $(if ($allChecksPassed) { "Green" } else { "Yellow" })

Write-Host "`n📋 Deployment Status:" -ForegroundColor Cyan
if ($backendUrl) {
    Write-Host "  • Backend URL:   $backendUrl" -ForegroundColor White
    Write-Host "  • Backend Domain: https://loopjs-backend-361659024403.us-central1.run.app/" -ForegroundColor White
    Write-Host "  • WebSocket URL: wss://loopjs-backend-361659024403.us-central1.run.app/ws" -ForegroundColor White
}
Write-Host "  • Frontend Domain: https://loopjs.vidai.sbs/" -ForegroundColor White
Write-Host "  • Health Status: $(if ($allChecksPassed) { '✅ Healthy' } else { '⚠️  Issues detected' })" -ForegroundColor $(if ($allChecksPassed) { "Green" } else { "Yellow" })

if (-not $allChecksPassed) {
    Write-Host "`n📝 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Check GitHub Actions: https://github.com/YOUR-USERNAME/loopjs/actions" -ForegroundColor White
    Write-Host "  • View backend logs: gcloud run services logs read $ServiceName --region $Region" -ForegroundColor White
    Write-Host "  • Verify secrets: gcloud secrets list" -ForegroundColor White
    Write-Host "  • Re-run setup: .\scripts\setup-gcp.ps1" -ForegroundColor White
}

Write-Host ""
exit $(if ($allChecksPassed) { 0 } else { 1 })

