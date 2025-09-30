# Deployment Automation Scripts

This directory contains PowerShell scripts to automate the entire deployment process for LoopJS.

## 🚀 Quick Start

**Run everything in one command:**

```powershell
.\scripts\deploy-all.ps1 -MongoDBUri "mongodb+srv://user:password@cluster.mongodb.net/database"
```

## 📜 Available Scripts

### 1. `deploy-all.ps1` - Complete Automation

Runs the entire deployment process from start to finish.

**Usage:**
```powershell
# Full deployment with MongoDB URI
.\scripts\deploy-all.ps1 -MongoDBUri "your-mongodb-uri"

# Skip GCP setup (if already done)
.\scripts\deploy-all.ps1 -SkipGCPSetup

# Skip git push (if already pushed)
.\scripts\deploy-all.ps1 -SkipGitPush

# Skip client configuration update
.\scripts\deploy-all.ps1 -SkipClientUpdate
```

**What it does:**
1. Sets up GCP (APIs, secrets, permissions)
2. Commits and pushes GitHub Actions workflows
3. Waits for deployment to complete
4. Updates client configuration
5. Verifies everything is working

---

### 2. `setup-gcp.ps1` - GCP Configuration

Sets up Google Cloud Platform infrastructure.

**Usage:**
```powershell
# Interactive (will prompt for MongoDB URI)
.\scripts\setup-gcp.ps1

# With MongoDB URI
.\scripts\setup-gcp.ps1 -MongoDBUri "mongodb+srv://..."

# Skip secret creation
.\scripts\setup-gcp.ps1 -SkipSecrets
```

**What it does:**
- Enables required GCP APIs (Cloud Run, Container Registry, etc.)
- Creates secrets in Google Secret Manager (MONGODB_URI, JWT_SECRET, SESSION_SECRET)
- Grants IAM permissions for Cloud Run to access secrets

---

### 3. `update-client-config.ps1` - Client Configuration

Updates Qt client configuration with backend URL.

**Usage:**
```powershell
# Auto-detect backend URL from Cloud Run
.\scripts\update-client-config.ps1

# Specify backend URL manually
.\scripts\update-client-config.ps1 -BackendUrl "https://your-backend.run.app"

# Use custom service name or region
.\scripts\update-client-config.ps1 -ServiceName "my-backend" -Region "us-west1"
```

**What it does:**
- Retrieves backend URL from Cloud Run
- Updates `clients/qt-client/config.json`
- Updates `clients/qt-client/mainwindow.cpp` with WebSocket URL

---

### 4. `verify-deployment.ps1` - Verification & Testing

Verifies that your deployment is working correctly.

**Usage:**
```powershell
.\scripts\verify-deployment.ps1
```

**What it checks:**
- ✅ Backend deployment status
- ✅ Health endpoint response
- ✅ WebSocket configuration
- ✅ GCP secrets existence
- ✅ Service configuration (memory, concurrency)
- ✅ Recent logs
- ✅ Client configuration files

---

### 5. `setup-domain.ps1` - Domain Mapping (Optional)

Configures custom domain mapping for Cloud Run services.

**Usage:**
```powershell
# Map custom domain to frontend (already configured)
.\scripts\setup-domain.ps1

# Map custom domain to backend as well
.\scripts\setup-domain.ps1 -BackendDomain "api.loopjs.vidai.sbs"

# Check existing domain mappings
.\scripts\setup-domain.ps1 -FrontendDomain "loopjs.vidai.sbs"
```

**What it does:**
- Creates domain mappings in Cloud Run
- Displays required DNS records
- Verifies SSL certificate status
- Shows domain mapping status

**Note:** Your frontend is already accessible at [https://loopjs.vidai.sbs/](https://loopjs.vidai.sbs/)

---

## 📋 Typical Workflow

### First Time Setup

```powershell
# 1. Configure gcloud locally (if not already done)
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Run complete deployment
.\scripts\deploy-all.ps1 -MongoDBUri "your-mongodb-uri"

# 3. Build and test client
cd clients/qt-client
.\build.bat
cd build
.\SysManagePro.exe
```

### After Code Changes

```powershell
# Just commit and push - GitHub Actions will auto-deploy
git add .
git commit -m "Your changes"
git push origin main

# Wait for deployment, then verify
.\scripts\verify-deployment.ps1
```

### Update Client After Backend Changes

```powershell
.\scripts\update-client-config.ps1
cd clients/qt-client
.\build.bat
```

### Troubleshooting

```powershell
# Check deployment status
.\scripts\verify-deployment.ps1

# Re-run GCP setup
.\scripts\setup-gcp.ps1

# Manually check backend
gcloud run services describe loopjs-backend --region us-central1

# View logs
gcloud run services logs read loopjs-backend --region us-central1 --limit 50
```

---

## 🔧 Prerequisites

Before running these scripts, ensure you have:

1. **PowerShell** (Windows PowerShell or PowerShell Core)
2. **gcloud CLI** installed and authenticated
   ```powershell
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Git** installed and repository initialized
4. **GitHub Actions secrets** configured:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`
   - `VERCEL_TOKEN` (for frontend)
   - `VERCEL_ORG_ID` (for frontend)
   - `VERCEL_PROJECT_ID` (for frontend)

---

## 🎯 Script Parameters Reference

### Common Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-MongoDBUri` | MongoDB connection string | Prompted if not provided |
| `-ServiceName` | Cloud Run service name | `loopjs-backend` |
| `-Region` | GCP region | `us-central1` |

### deploy-all.ps1 Specific

| Parameter | Description |
|-----------|-------------|
| `-SkipGCPSetup` | Skip GCP configuration |
| `-SkipGitPush` | Skip committing/pushing to GitHub |
| `-SkipClientUpdate` | Skip updating client configuration |

### setup-gcp.ps1 Specific

| Parameter | Description |
|-----------|-------------|
| `-SkipSecrets` | Skip creating secrets (if already exist) |

---

## 📊 Exit Codes

All scripts return meaningful exit codes:

- `0` - Success
- `1` - Error occurred

Use `$LASTEXITCODE` to check the result in PowerShell.

---

## 🛡️ Security Notes

- Never commit `github-actions-key.json` to git
- Keep MongoDB URI secure
- Rotate secrets periodically
- Use `.gitignore` to exclude sensitive files

---

## 🐛 Common Issues

### "gcloud command not found"

Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install

### "Permission denied" errors

Ensure you're authenticated and have proper permissions:
```powershell
gcloud auth login
gcloud auth application-default login
```

### "Secret already exists" warnings

This is normal - the script will add a new version to existing secrets.

### Client can't connect

1. Verify backend is deployed: `.\scripts\verify-deployment.ps1`
2. Check client config is updated: `.\scripts\update-client-config.ps1`
3. Rebuild client: `cd clients/qt-client && .\build.bat`

---

## 📞 Support

For more help, see:
- `docs/QUICK_FIX_GUIDE.md` - Step-by-step manual guide
- `docs/DEPLOYMENT_SETUP.md` - Detailed deployment information
- GitHub Actions logs: `https://github.com/YOUR-USERNAME/loopjs/actions`

---

## 🎉 Success!

Once everything is deployed, you'll have:
- ✅ Backend auto-deploying to Cloud Run on every push
- ✅ Frontend auto-deploying to Cloud Run on every push
- ✅ Clients configured and ready to connect
- ✅ Monitoring and logging enabled
- ✅ Zero-downtime deployments
- ✅ Custom domain support (loopjs.vidai.sbs)

Happy coding! 🚀

