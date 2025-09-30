# ================================================
# Domain Mapping Setup Script
# ================================================
# This script helps map custom domains to Cloud Run services
# For loopjs.vidai.sbs → frontend
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$FrontendDomain = "loopjs.vidai.sbs",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendDomain = "",
    
    [Parameter(Mandatory=$false)]
    [string]$FrontendService = "loopjs-frontend",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendService = "loopjs-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-central1"
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

Write-Header "🌐 Domain Mapping Configuration"

# Get project ID
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Error "No GCP project configured"
    exit 1
}

Write-Info "Project: $PROJECT_ID"
Write-Info "Region: $Region"

# ================================================
# Frontend Domain Mapping
# ================================================
if ($FrontendDomain) {
    Write-Step "Setting up domain mapping for Frontend"
    Write-Info "Domain: $FrontendDomain"
    Write-Info "Service: $FrontendService"
    
    # Check if domain mapping already exists
    $existingMapping = gcloud run domain-mappings describe $FrontendDomain `
        --region $Region `
        --platform managed 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Domain mapping already exists for $FrontendDomain"
        Write-Info "Current configuration:"
        gcloud run domain-mappings describe $FrontendDomain --region $Region --platform managed
    } else {
        Write-Info "Creating domain mapping..."
        
        # Create domain mapping
        gcloud run domain-mappings create `
            --service $FrontendService `
            --domain $FrontendDomain `
            --region $Region `
            --platform managed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Domain mapping created for $FrontendDomain"
        } else {
            Write-Error "Failed to create domain mapping"
        }
    }
    
    # Get DNS records to configure
    Write-Step "DNS Configuration Required"
    Write-Info "Add these DNS records to your domain registrar:"
    Write-Host ""
    
    gcloud run domain-mappings describe $FrontendDomain `
        --region $Region `
        --platform managed `
        --format="table(status.resourceRecords.name, status.resourceRecords.type, status.resourceRecords.rrdata)"
    
    Write-Host ""
    Write-Warning "You need to configure these DNS records at your domain registrar (e.g., Cloudflare, GoDaddy)"
}

# ================================================
# Backend Domain Mapping (Optional)
# ================================================
if ($BackendDomain) {
    Write-Step "Setting up domain mapping for Backend"
    Write-Info "Domain: $BackendDomain"
    Write-Info "Service: $BackendService"
    
    # Check if domain mapping already exists
    $existingMapping = gcloud run domain-mappings describe $BackendDomain `
        --region $Region `
        --platform managed 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Warning "Domain mapping already exists for $BackendDomain"
    } else {
        Write-Info "Creating domain mapping..."
        
        # Create domain mapping
        gcloud run domain-mappings create `
            --service $BackendService `
            --domain $BackendDomain `
            --region $Region `
            --platform managed
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Domain mapping created for $BackendDomain"
        } else {
            Write-Error "Failed to create domain mapping"
        }
    }
    
    # Get DNS records to configure
    Write-Step "DNS Configuration Required for Backend"
    gcloud run domain-mappings describe $BackendDomain `
        --region $Region `
        --platform managed `
        --format="table(status.resourceRecords.name, status.resourceRecords.type, status.resourceRecords.rrdata)"
}

# ================================================
# Verification
# ================================================
Write-Step "Domain Mapping Status"

Write-Info "All domain mappings in region $Region:"
gcloud run domain-mappings list --region $Region --platform managed

# ================================================
# Summary
# ================================================
Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "🎉 Domain Configuration Complete!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
if ($FrontendDomain) {
    Write-Host "  • Frontend Domain: $FrontendDomain → $FrontendService" -ForegroundColor White
}
if ($BackendDomain) {
    Write-Host "  • Backend Domain: $BackendDomain → $BackendService" -ForegroundColor White
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure DNS records at your domain registrar" -ForegroundColor White
Write-Host "  2. Wait for DNS propagation (can take up to 48 hours)" -ForegroundColor White
Write-Host "  3. Verify domain mapping:" -ForegroundColor White
if ($FrontendDomain) {
    Write-Host "     curl https://$FrontendDomain" -ForegroundColor Gray
}
if ($BackendDomain) {
    Write-Host "     curl https://$BackendDomain/health" -ForegroundColor Gray
}
Write-Host "  4. Check SSL certificate status (auto-provisioned by Google)" -ForegroundColor White

Write-Host "`n⏱️  Note: SSL certificates are automatically provisioned but may take 15-60 minutes" -ForegroundColor Yellow

Write-Host "`n✅ Configuration saved!" -ForegroundColor Green

