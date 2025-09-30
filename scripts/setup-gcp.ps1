# ================================================
# GCP Setup Automation Script
# ================================================
# This script automates Steps 3-5 from QUICK_FIX_GUIDE.md
# - Enables required GCP APIs
# - Creates secrets in Google Cloud Secret Manager
# - Grants proper IAM permissions
# ================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$MongoDBUri = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipSecrets = $false
)

# Color output functions
function Write-Success { 
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green 
}

function Write-Info { 
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan 
}

function Write-Warning { 
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow 
}

function Write-Error { 
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red 
}

function Write-Step { 
    param([string]$Message)
    Write-Host "`n🔧 $Message" -ForegroundColor Magenta 
}

# Check if gcloud is installed
Write-Info "Checking if gcloud CLI is installed..."
try {
    $gcloudVersion = gcloud version 2>&1
    Write-Success "gcloud CLI found"
} catch {
    Write-Error "gcloud CLI not found. Please install it first: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Get project ID
Write-Info "Getting GCP project ID..."
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Error "No GCP project configured. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}
Write-Success "Using project: $PROJECT_ID"

# Get project number
Write-Info "Getting project number..."
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>$null
if (-not $PROJECT_NUMBER) {
    Write-Error "Failed to get project number"
    exit 1
}
Write-Success "Project number: $PROJECT_NUMBER"

# ================================================
# STEP 3: Enable Required APIs
# ================================================
Write-Step "STEP 3: Enabling Required GCP APIs"

$apis = @(
    "run.googleapis.com",
    "containerregistry.googleapis.com", 
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com"
)

foreach ($api in $apis) {
    Write-Info "Enabling $api..."
    gcloud services enable $api 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "$api enabled"
    } else {
        Write-Warning "Failed to enable $api (might already be enabled)"
    }
}

Write-Success "All APIs enabled successfully!"

# ================================================
# STEP 4: Create Secrets in Google Cloud
# ================================================
if (-not $SkipSecrets) {
    Write-Step "STEP 4: Creating Secrets in Google Cloud"

    # MongoDB URI
    if (-not $MongoDBUri) {
        Write-Warning "MongoDB URI not provided via parameter"
        $MongoDBUri = Read-Host "Enter your MongoDB connection URI (or press Enter to skip)"
    }

    if ($MongoDBUri) {
        Write-Info "Creating MONGODB_URI secret..."
        try {
            # Check if secret already exists
            $existingSecret = gcloud secrets describe MONGODB_URI 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Warning "MONGODB_URI secret already exists. Adding new version..."
                $MongoDBUri | gcloud secrets versions add MONGODB_URI --data-file=-
            } else {
                $MongoDBUri | gcloud secrets create MONGODB_URI --data-file=-
            }
            Write-Success "MONGODB_URI secret created/updated"
        } catch {
            Write-Warning "Failed to create MONGODB_URI secret: $_"
        }
    } else {
        Write-Warning "Skipping MONGODB_URI creation"
    }

    # JWT Secret
    Write-Info "Generating and creating JWT_SECRET..."
    $JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    try {
        $existingSecret = gcloud secrets describe JWT_SECRET 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Warning "JWT_SECRET already exists. Adding new version..."
            $JWT_SECRET | gcloud secrets versions add JWT_SECRET --data-file=-
        } else {
            $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=-
        }
        Write-Success "JWT_SECRET created/updated"
    } catch {
        Write-Warning "Failed to create JWT_SECRET: $_"
    }

    # Session Secret
    Write-Info "Generating and creating SESSION_SECRET..."
    $SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    try {
        $existingSecret = gcloud secrets describe SESSION_SECRET 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Warning "SESSION_SECRET already exists. Adding new version..."
            $SESSION_SECRET | gcloud secrets versions add SESSION_SECRET --data-file=-
        } else {
            $SESSION_SECRET | gcloud secrets create SESSION_SECRET --data-file=-
        }
        Write-Success "SESSION_SECRET created/updated"
    } catch {
        Write-Warning "Failed to create SESSION_SECRET: $_"
    }

    Write-Success "Secrets created successfully!"
} else {
    Write-Warning "Skipping secret creation (--SkipSecrets flag provided)"
}

# ================================================
# STEP 5: Grant Secret Access
# ================================================
Write-Step "STEP 5: Granting Secret Access to Cloud Run"

$secrets = @("MONGODB_URI", "JWT_SECRET", "SESSION_SECRET")
$member = "serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

foreach ($secret in $secrets) {
    Write-Info "Granting access to $secret..."
    try {
        gcloud secrets add-iam-policy-binding $secret `
            --member=$member `
            --role="roles/secretmanager.secretAccessor" 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Access granted to $secret"
        } else {
            Write-Warning "Failed to grant access to $secret (might already have access)"
        }
    } catch {
        Write-Warning "Error granting access to $secret: $_"
    }
}

Write-Success "Secret access configuration complete!"

# ================================================
# Summary
# ================================================
Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "🎉 GCP Setup Complete!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "  • Project: $PROJECT_ID" -ForegroundColor White
Write-Host "  • APIs Enabled: ✅" -ForegroundColor Green
if (-not $SkipSecrets) {
    Write-Host "  • Secrets Created: ✅" -ForegroundColor Green
    Write-Host "  • IAM Permissions: ✅" -ForegroundColor Green
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Make sure GitHub Actions secrets are configured" -ForegroundColor White
Write-Host "  2. Commit and push .github/workflows to trigger deployment:" -ForegroundColor White
Write-Host "     git add .github/" -ForegroundColor Gray
Write-Host "     git commit -m 'Add GitHub Actions workflows'" -ForegroundColor Gray
Write-Host "     git push origin main" -ForegroundColor Gray
Write-Host "  3. Watch deployment: https://github.com/YOUR-USERNAME/loopjs/actions" -ForegroundColor White
Write-Host "  4. Run scripts/update-client-config.ps1 after deployment completes" -ForegroundColor White

Write-Host "`n✅ You're ready to deploy!" -ForegroundColor Green

