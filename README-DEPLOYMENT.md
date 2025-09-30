# 🚀 LoopJS - Google Cloud Automated Deployment

Complete automation for deploying LoopJS frontend and backend to Google Cloud Run with GitHub Actions.

## 📋 Overview

- **Backend**: [https://loopjs-backend-361659024403.us-central1.run.app/](https://loopjs-backend-361659024403.us-central1.run.app/)
- **Frontend**: [https://loopjs.vidai.sbs/](https://loopjs.vidai.sbs/)
- **WebSocket**: `wss://loopjs-backend-361659024403.us-central1.run.app/ws`

## 🎯 What You Get

✅ **Automated CI/CD Pipeline**
- Push to `main` → Automatic deployment to Google Cloud Run
- Separate workflows for backend and frontend
- Combined workflow for deploying both services together

✅ **Zero-Downtime Deployments**
- Blue-green deployment strategy
- Health checks before traffic routing
- Automatic rollback on failure

✅ **Fully Managed Infrastructure**
- Auto-scaling based on traffic
- Built-in load balancing
- SSL certificates managed by Google
- Custom domain support

## 🚀 Quick Start

### Prerequisites

1. ✅ Google Cloud account with billing enabled
2. ✅ `gcloud` CLI installed and authenticated
3. ✅ GitHub repository with Actions enabled
4. ✅ GitHub secrets configured:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY`

### One-Command Setup

```powershell
.\scripts\deploy-all.ps1 -MongoDBUri "mongodb+srv://user:password@cluster.mongodb.net/database"
```

This command will:
1. Enable all required GCP APIs
2. Create secrets in Google Secret Manager
3. Configure IAM permissions
4. Commit and push GitHub Actions workflows
5. Wait for deployment to complete
6. Update client configuration
7. Verify everything is working

## 📂 GitHub Actions Workflows

### 1. Backend Deployment (`.github/workflows/deploy-backend.yml`)

Triggers on:
- Push to `main` with changes in `backend/**`
- Manual workflow dispatch

**Steps:**
1. Builds Docker image from `backend/Dockerfile`
2. Pushes to Google Container Registry
3. Deploys to Cloud Run (loopjs-backend)
4. Tests health endpoint
5. Outputs deployment URL

### 2. Frontend Deployment (`.github/workflows/deploy-frontend.yml`)

Triggers on:
- Push to `main` with changes in `frontend/**`
- Manual workflow dispatch

**Steps:**
1. Builds Docker image from `frontend/Dockerfile`
2. Pushes to Google Container Registry
3. Deploys to Cloud Run (loopjs-frontend)
4. Tests frontend endpoint
5. Outputs deployment URL

### 3. Deploy All (`.github/workflows/deploy-all.yml`)

Triggers on:
- Push to `main` (any changes)
- Manual workflow dispatch

**Steps:**
1. Deploys backend first
2. Deploys frontend after backend succeeds
3. Tests both services
4. Outputs complete deployment summary

## 🔧 Manual Deployment

### Using GitHub Actions UI

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select a workflow:
   - `Deploy Backend to Cloud Run`
   - `Deploy Frontend to Cloud Run`
   - `Deploy All Services`
4. Click **Run workflow**
5. Select branch (`main`)
6. Click **Run workflow** button

### Using Scripts

```powershell
# Full deployment
.\scripts\deploy-all.ps1

# Just GCP setup
.\scripts\setup-gcp.ps1 -MongoDBUri "your-mongodb-uri"

# Update client config
.\scripts\update-client-config.ps1

# Verify deployment
.\scripts\verify-deployment.ps1

# Configure custom domains
.\scripts\setup-domain.ps1
```

## 🌐 Custom Domain Configuration

Your frontend is already configured with a custom domain: **loopjs.vidai.sbs**

To add or modify domain mappings:

```powershell
# View current domain mappings
.\scripts\setup-domain.ps1

# Add backend custom domain
.\scripts\setup-domain.ps1 -BackendDomain "api.loopjs.vidai.sbs"
```

### DNS Configuration

The domain `loopjs.vidai.sbs` is already configured. If you need to add new domains:

1. Run `setup-domain.ps1` to get DNS records
2. Add the records to your DNS provider (Cloudflare, GoDaddy, etc.)
3. Wait for DNS propagation (15 minutes - 48 hours)
4. Google will automatically provision SSL certificates

## 🔐 Secrets Management

### GitHub Secrets (Required)

Configure these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Your Google Cloud project ID |
| `GCP_SA_KEY` | Service account JSON key (see below) |

### Creating GCP Service Account

```powershell
# Create service account
gcloud iam service-accounts create github-actions --display-name="GitHub Actions"

# Get project ID
$PROJECT_ID = gcloud config get-value project

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json `
  --iam-account="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

# Copy to clipboard
Get-Content github-actions-key.json | Set-Clipboard
Write-Host "✅ Service account key copied to clipboard!"
```

### Google Cloud Secrets (Managed by scripts)

These are automatically created by `setup-gcp.ps1`:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT token secret (auto-generated)
- `SESSION_SECRET` - Session secret (auto-generated)

## 📊 Monitoring & Logs

### View Logs

```powershell
# Backend logs
gcloud run services logs read loopjs-backend --region us-central1 --limit 50

# Frontend logs
gcloud run services logs read loopjs-frontend --region us-central1 --limit 50

# Follow logs (real-time)
gcloud run services logs tail loopjs-backend --region us-central1
```

### Check Service Status

```powershell
# Backend status
gcloud run services describe loopjs-backend --region us-central1

# Frontend status
gcloud run services describe loopjs-frontend --region us-central1

# All services
gcloud run services list --region us-central1
```

### View Deployment History

```powershell
# List backend revisions
gcloud run revisions list --service loopjs-backend --region us-central1

# List frontend revisions
gcloud run revisions list --service loopjs-frontend --region us-central1
```

## 🔄 Rollback

If a deployment breaks something:

```powershell
# List revisions to find a working one
gcloud run revisions list --service loopjs-backend --region us-central1

# Rollback to specific revision
gcloud run services update-traffic loopjs-backend `
  --region us-central1 `
  --to-revisions=loopjs-backend-00123-xyz=100
```

## 🐛 Troubleshooting

### Deployment Failed

1. Check GitHub Actions logs: `https://github.com/YOUR-USERNAME/loopjs/actions`
2. Verify secrets are configured correctly
3. Check GCP quotas and billing
4. Review Cloud Run logs for errors

### Backend Not Responding

```powershell
# Check backend health
curl https://loopjs-backend-361659024403.us-central1.run.app/health

# View recent errors
gcloud run services logs read loopjs-backend --region us-central1 --limit 100

# Check service status
gcloud run services describe loopjs-backend --region us-central1
```

### Frontend Not Loading

```powershell
# Check frontend
curl https://loopjs.vidai.sbs/

# View frontend logs
gcloud run services logs read loopjs-frontend --region us-central1 --limit 50

# Verify domain mapping
gcloud run domain-mappings describe loopjs.vidai.sbs --region us-central1
```

### Client Can't Connect

1. Verify backend is running
2. Check WebSocket URL is correct: `wss://loopjs-backend-361659024403.us-central1.run.app/ws`
3. Update client configuration: `.\scripts\update-client-config.ps1`
4. Rebuild client: `cd clients/qt-client && .\build.bat`

## 📈 Scaling & Performance

### Auto-Scaling Configuration

Both services are configured with:
- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 10
- **CPU**: 1 vCPU
- **Memory**: 512Mi (backend), 256Mi (frontend)
- **Timeout**: 300 seconds

### Modify Scaling Settings

Edit the workflow files or run:

```powershell
# Update backend scaling
gcloud run services update loopjs-backend `
  --region us-central1 `
  --max-instances 20 `
  --memory 1Gi

# Update frontend scaling
gcloud run services update loopjs-frontend `
  --region us-central1 `
  --max-instances 20 `
  --memory 512Mi
```

## 💰 Cost Optimization

Cloud Run charges based on:
1. **CPU time** (when processing requests)
2. **Memory usage** (when processing requests)
3. **Number of requests**

**Tips to reduce costs:**
- Services scale to zero when idle (no charges)
- Use smaller memory allocations if possible
- Implement caching to reduce database calls
- Use Cloud CDN for static assets

**Estimate monthly costs:**
- Light usage (< 100K requests): $0-5
- Medium usage (< 1M requests): $5-20
- Heavy usage (> 1M requests): $20-100

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Domain Mapping Guide](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Cloud Run Pricing](https://cloud.google.com/run/pricing)

## 🎉 Success Checklist

- [ ] GitHub Actions secrets configured (`GCP_PROJECT_ID`, `GCP_SA_KEY`)
- [ ] GCP APIs enabled (Cloud Run, Container Registry, Secret Manager)
- [ ] Secrets created in GCP (MONGODB_URI, JWT_SECRET, SESSION_SECRET)
- [ ] Workflows pushed to GitHub (`.github/workflows/`)
- [ ] Backend deploying successfully
- [ ] Frontend deploying successfully
- [ ] Health check passing: [https://loopjs-backend-361659024403.us-central1.run.app/health](https://loopjs-backend-361659024403.us-central1.run.app/health)
- [ ] Frontend accessible: [https://loopjs.vidai.sbs/](https://loopjs.vidai.sbs/)
- [ ] Client connecting to WebSocket
- [ ] Monitoring and logging working

## 📞 Support

For issues or questions:
1. Check `scripts/README.md` for script documentation
2. Check `docs/QUICK_FIX_GUIDE.md` for step-by-step manual setup
3. Review GitHub Actions logs
4. Check Cloud Run logs
5. Run verification script: `.\scripts\verify-deployment.ps1`

---

**Built with ❤️ for automated, scalable deployments**

