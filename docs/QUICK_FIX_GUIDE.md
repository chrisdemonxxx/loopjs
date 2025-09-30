# Quick Fix Guide - Get Your Deployment Working NOW

If you're confused and just want to get things working, follow these steps in order.

## 🎯 Goal

- Clean GitHub repository
- Automated deployments from GitHub to Google Cloud
- Working client-server communication

---

## 🚀 Option A: Quick Start (No Restructuring)

If you want to get deployments working WITHOUT reorganizing the repo:

### Step 1: Add GitHub Actions (5 minutes)

1. The GitHub Actions workflows have been created in `.github/workflows/`
2. Just add the GitHub secrets (see Step 2 below)

### Step 2: Configure GitHub Secrets (10 minutes)

Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

| Secret Name | Value | How to Get It |
|------------|-------|---------------|
| `GCP_PROJECT_ID` | Your project ID | Run `gcloud config get-value project` |
| `GCP_SA_KEY` | Service account JSON | See commands below |

**Get GCP Service Account Key:**

```powershell
# In PowerShell on Windows:
gcloud iam service-accounts create github-actions --display-name="GitHub Actions"

$PROJECT_ID = gcloud config get-value project

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts keys create github-actions-key.json `
  --iam-account="github-actions@$PROJECT_ID.iam.gserviceaccount.com"

# Copy contents of github-actions-key.json to GitHub Secret GCP_SA_KEY
Get-Content github-actions-key.json | Set-Clipboard
Write-Host "Service account key copied to clipboard!"
```

### Step 3: Enable Required APIs (2 minutes)

```powershell
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### Step 4: Create Secrets in Google Cloud (5 minutes)

```powershell
# MongoDB URI (replace with your actual connection string)
$MONGODB_URI = "mongodb+srv://user:password@cluster.mongodb.net/database"
echo $MONGODB_URI | gcloud secrets create MONGODB_URI --data-file=-

# Generate and create JWT secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
echo $JWT_SECRET | gcloud secrets create JWT_SECRET --data-file=-

# Generate and create Session secret
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
echo $SESSION_SECRET | gcloud secrets create SESSION_SECRET --data-file=-

Write-Host "✅ Secrets created successfully!"
```

### Step 5: Grant Secret Access (2 minutes)

```powershell
$PROJECT_ID = gcloud config get-value project
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"

gcloud secrets add-iam-policy-binding MONGODB_URI `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SESSION_SECRET `
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

Write-Host "✅ Secret access granted!"
```

### Step 6: Test Deployment (5 minutes)

```powershell
# Commit and push the GitHub Actions workflows
git add .github/
git commit -m "Add GitHub Actions for automated deployment"
git push origin main

# Watch the deployment in GitHub
# Go to: https://github.com/YOUR-USERNAME/loopjs/actions
```

### Step 7: Get Your Backend URL

After deployment succeeds:

```powershell
gcloud run services describe loopjs-backend `
  --region us-central1 `
  --format="value(status.url)"

# This will output something like:
# https://loopjs-backend-xxxxx-uc.a.run.app
```

### Step 8: Update Client Configuration

1. Copy the backend URL from Step 7
2. Update `clients/qt-client/config.json`:

```json
{
  "server": {
    "url": "wss://loopjs-backend-xxxxx-uc.a.run.app/ws"
  }
}
```

3. Update `clients/qt-client/mainwindow.cpp`:

```cpp
#define DEF_WS_URL "wss://loopjs-backend-xxxxx-uc.a.run.app/ws"
```

4. Rebuild client:

```powershell
cd "clients/qt-client"
.\build.bat
```

### Step 9: Test Everything

```powershell
# Start the client
cd "clients/qt-client/build"
.\SysManagePro.exe

# In another terminal, check the backend logs
gcloud run services logs read loopjs-backend --region us-central1 --limit 50

# Open the web panel (your Vercel URL)
# You should see the client appear!
```

---

## ✅ Success Checklist

You know it's working when:

- [ ] GitHub Actions shows green checkmark
- [ ] Backend is accessible at Cloud Run URL
- [ ] `/health` endpoint returns `{"status":"healthy"}`
- [ ] Client connects (console shows "WebSocket connected")
- [ ] Client appears in web panel
- [ ] Can send commands from web panel to client

---

## 🐛 Common Issues

### "Permission denied" in GitHub Actions

**Fix:** Make sure service account has all three roles:
- `roles/run.admin`
- `roles/storage.admin`
- `roles/iam.serviceAccountUser`

### "Secret not found" error

**Fix:** Verify secrets exist and have proper access:

```powershell
gcloud secrets list
gcloud secrets describe MONGODB_URI
```

### Client won't connect

**Fix:** Check these:

1. Backend URL is correct (no typos)
2. URL starts with `wss://` not `ws://`
3. URL ends with `/ws`
4. Backend is actually running:

```powershell
$BACKEND_URL = gcloud run services describe loopjs-backend --region us-central1 --format="value(status.url)"
curl "$BACKEND_URL/health"
```

### Web panel shows "Authentication required"

**Fix:** The web panel needs to authenticate with a token. Make sure you're logged in through the frontend.

---

## 📞 Emergency Rollback

If something breaks:

```powershell
# Rollback backend to previous version
gcloud run services update-traffic loopjs-backend `
  --region us-central1 `
  --to-revisions=PREVIOUS_REVISION=100

# List revisions to find a working one
gcloud run revisions list --service loopjs-backend --region us-central1
```

---

## 🎉 You're Done!

If you followed all steps, you now have:
- ✅ Automated deployments from GitHub
- ✅ Backend running on Google Cloud Run
- ✅ Frontend on Vercel
- ✅ Client connecting successfully
- ✅ Zero-downtime deployments

Every time you push to `main`, your changes will automatically deploy!

---

## 📚 Next Steps

- Read `DEPLOYMENT_SETUP.md` for detailed information
- Read `GITHUB_CLEANUP_PLAN.md` to clean up your repo
- Set up monitoring and alerts
- Configure custom domain
- Add more security features