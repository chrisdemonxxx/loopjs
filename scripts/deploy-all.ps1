# ================================================
# Complete Deployment Automation Script
# ================================================
# This script runs the entire deployment process
# Deploys both frontend and backend to Google Cloud Run
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$MongoDBUri = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipGCPSetup = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipGitPush = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipClientUpdate = $false
)

# Color output functions
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Step { Write-Host "`n🔧 $args" -ForegroundColor Magenta }
function Write-Header { 
    Write-Host "`n" + "="*60 -ForegroundColor Magenta
    Write-Host "  $args" -ForegroundColor Magenta
    Write-Host "="*60 -ForegroundColor Magenta
}

Write-Header "🚀 LoopJS Complete Deployment Automation"

# Check if we're in the right directory
if (-not (Test-Path "scripts") -or -not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Error "This script must be run from the project root directory"
    exit 1
}

$startTime = Get-Date

# ================================================
# Phase 1: GCP Setup
# ================================================
if (-not $SkipGCPSetup) {
    Write-Header "Phase 1: GCP Setup"
    
    $setupArgs = @()
    if ($MongoDBUri) {
        $setupArgs += "-MongoDBUri"
        $setupArgs += $MongoDBUri
    }
    
    & ".\scripts\setup-gcp.ps1" @setupArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "GCP setup failed"
        exit 1
    }
    
    Write-Success "GCP setup completed"
} else {
    Write-Warning "Skipping GCP setup (--SkipGCPSetup flag provided)"
}

# ================================================
# Phase 2: Commit and Push to GitHub
# ================================================
if (-not $SkipGitPush) {
    Write-Header "Phase 2: Deploy via GitHub Actions"
    
    Write-Info "Checking git status..."
    $gitStatus = git status --porcelain
    
    if ($gitStatus) {
        Write-Info "Staging GitHub Actions workflows..."
        git add .github/
        
        Write-Info "Committing changes..."
        git commit -m "Add GitHub Actions workflows for automated deployment"
        
        Write-Info "Pushing to GitHub..."
        git push origin main
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Git push failed"
            exit 1
        }
        
        Write-Success "Code pushed to GitHub"
        Write-Info "GitHub Actions will now deploy your application"
        Write-Info "View progress at: https://github.com/YOUR-USERNAME/loopjs/actions"
    } else {
        Write-Warning "No changes to commit. Workflows may already be deployed."
    }
} else {
    Write-Warning "Skipping git push (--SkipGitPush flag provided)"
}

# ================================================
# Phase 3: Wait for Deployment
# ================================================
Write-Header "Phase 3: Waiting for Deployment"

Write-Info "Waiting for backend deployment to complete..."
Write-Info "This may take 2-5 minutes..."

$maxAttempts = 30
$attempt = 0
$deployed = $false

while ($attempt -lt $maxAttempts -and -not $deployed) {
    $attempt++
    Start-Sleep -Seconds 10
    
    try {
        $backendUrl = gcloud run services describe loopjs-backend `
            --region us-central1 `
            --format="value(status.url)" 2>&1
        
        if ($LASTEXITCODE -eq 0 -and $backendUrl) {
            Write-Info "Backend service found, checking health..."
            
            try {
                $health = Invoke-WebRequest -Uri "$backendUrl/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($health.StatusCode -eq 200) {
                    $deployed = $true
                    Write-Success "Backend is healthy and responding!"
                }
            } catch {
                Write-Info "Waiting for backend to become healthy... (attempt $attempt/$maxAttempts)"
            }
        } else {
            Write-Info "Waiting for backend deployment... (attempt $attempt/$maxAttempts)"
        }
    } catch {
        Write-Info "Waiting for backend deployment... (attempt $attempt/$maxAttempts)"
    }
}

if (-not $deployed) {
    Write-Warning "Deployment is taking longer than expected"
    Write-Info "You can check the status manually:"
    Write-Host "  • GitHub Actions: https://github.com/YOUR-USERNAME/loopjs/actions" -ForegroundColor Gray
    Write-Host "  • Run: gcloud run services describe loopjs-backend --region us-central1" -ForegroundColor Gray
    
    $continue = Read-Host "`nContinue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Info "Exiting. Run .\scripts\update-client-config.ps1 later when deployment completes."
        exit 0
    }
}

# ================================================
# Phase 4: Update Client Configuration
# ================================================
if (-not $SkipClientUpdate -and (Test-Path "clients/qt-client")) {
    Write-Header "Phase 4: Update Client Configuration"
    
    & ".\scripts\update-client-config.ps1"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Client configuration update had issues"
    } else {
        Write-Success "Client configuration updated"
    }
} else {
    if ($SkipClientUpdate) {
        Write-Warning "Skipping client update (--SkipClientUpdate flag provided)"
    } else {
        Write-Warning "Client directory not found, skipping client update"
    }
}

# ================================================
# Phase 5: Verification
# ================================================
Write-Header "Phase 5: Deployment Verification"

& ".\scripts\verify-deployment.ps1"

$verificationResult = $LASTEXITCODE

# ================================================
# Final Summary
# ================================================
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "🎉 Deployment Process Complete!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

Write-Host "`n⏱️  Total Time: $($duration.Minutes) minutes $($duration.Seconds) seconds" -ForegroundColor Cyan

Write-Host "`n📋 What was done:" -ForegroundColor Cyan
if (-not $SkipGCPSetup) {
    Write-Host "  ✅ GCP APIs enabled and configured" -ForegroundColor Green
    Write-Host "  ✅ Secrets created and permissions granted" -ForegroundColor Green
}
if (-not $SkipGitPush) {
    Write-Host "  ✅ GitHub Actions workflows deployed" -ForegroundColor Green
    Write-Host "  ✅ Automated deployment triggered" -ForegroundColor Green
}
if (-not $SkipClientUpdate) {
    Write-Host "  ✅ Client configuration updated" -ForegroundColor Green
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Build the Qt client:" -ForegroundColor White
Write-Host "     cd clients/qt-client" -ForegroundColor Gray
Write-Host "     .\build.bat" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test the client connection:" -ForegroundColor White
Write-Host "     cd clients/qt-client/build" -ForegroundColor Gray
Write-Host "     .\SysManagePro.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Monitor your deployment:" -ForegroundColor White
Write-Host "     GitHub Actions: https://github.com/YOUR-USERNAME/loopjs/actions" -ForegroundColor Gray
Write-Host "     Backend Logs: gcloud run services logs read loopjs-backend --region us-central1" -ForegroundColor Gray

if ($verificationResult -eq 0) {
    Write-Host "`n✅ All systems operational!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some checks failed. Review the output above." -ForegroundColor Yellow
}

Write-Host ""

