# Setup GitHub Secret for Auto-Deployment
# This script helps you set up the GCP_SA_KEY secret for GitHub Actions

Write-Host "`n🔧 GitHub Actions Auto-Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$PROJECT_ID = "code-assist-470813"
$SA_EMAIL = "github-actions@code-assist-470813.iam.gserviceaccount.com"
$KEY_FILE = "github-sa-key.json"
$REPO = "chrisdemonxxx/loopjs"

# Step 1: Check if service account exists
Write-Host "📋 Step 1: Checking service account..." -ForegroundColor Yellow
$saExists = gcloud iam service-accounts describe $SA_EMAIL 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service account exists: $SA_EMAIL" -ForegroundColor Green
} else {
    Write-Host "❌ Service account not found!" -ForegroundColor Red
    exit 1
}

# Step 2: Check existing keys
Write-Host "`n📋 Step 2: Checking existing keys..." -ForegroundColor Yellow
$existingKeys = gcloud iam service-accounts keys list --iam-account=$SA_EMAIL --format="value(name)" | Measure-Object -Line
Write-Host "Found $($existingKeys.Lines) existing key(s)" -ForegroundColor Gray

# Step 3: Offer to create new key
Write-Host "`n📋 Step 3: Create service account key" -ForegroundColor Yellow
$createKey = Read-Host "Do you want to create a new key? (y/n)"

if ($createKey -eq "y" -or $createKey -eq "Y") {
    Write-Host "Creating new key..." -ForegroundColor Gray
    gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SA_EMAIL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Key created: $KEY_FILE" -ForegroundColor Green
        
        # Step 4: Copy to clipboard
        Write-Host "`n📋 Step 4: Copying key to clipboard..." -ForegroundColor Yellow
        Get-Content $KEY_FILE | Set-Clipboard
        Write-Host "✅ Key copied to clipboard!" -ForegroundColor Green
        
        # Step 5: Instructions
        Write-Host "`n📋 Step 5: Add secret to GitHub" -ForegroundColor Yellow
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "1. Opening GitHub secrets page..." -ForegroundColor Cyan
        Start-Sleep -Seconds 2
        Start-Process "https://github.com/$REPO/settings/secrets/actions"
        
        Write-Host "`n2. On the GitHub page:" -ForegroundColor Cyan
        Write-Host "   - Click 'New repository secret'" -ForegroundColor White
        Write-Host "   - Name: GCP_SA_KEY" -ForegroundColor Yellow
        Write-Host "   - Value: Paste from clipboard (Ctrl+V)" -ForegroundColor Yellow
        Write-Host "   - Click 'Add secret'" -ForegroundColor White
        
        Write-Host "`n3. Press Enter when done..." -ForegroundColor Cyan
        Read-Host
        
        # Step 6: Cleanup
        Write-Host "`n📋 Step 6: Cleanup..." -ForegroundColor Yellow
        Remove-Item $KEY_FILE -Force
        Write-Host "✅ Key file deleted (security)" -ForegroundColor Green
        
        # Step 7: Test
        Write-Host "`n📋 Step 7: Test deployment" -ForegroundColor Yellow
        Write-Host "Opening GitHub Actions..." -ForegroundColor Gray
        Start-Process "https://github.com/$REPO/actions"
        
        Write-Host "`n✅ Setup complete!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        Write-Host "`nTo test:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://github.com/$REPO/actions" -ForegroundColor White
        Write-Host "2. Click 'Deploy All Services'" -ForegroundColor White
        Write-Host "3. Click 'Run workflow' → 'Run workflow'" -ForegroundColor White
        Write-Host "`n🚀 From now on, every push to main will auto-deploy!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Failed to create key" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n⚠️  Skipped key creation" -ForegroundColor Yellow
    Write-Host "If you already have the key, add it manually:" -ForegroundColor White
    Write-Host "https://github.com/$REPO/settings/secrets/actions" -ForegroundColor Cyan
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📚 For more info, see: .github/DEPLOYMENT_FIX.md" -ForegroundColor Cyan

