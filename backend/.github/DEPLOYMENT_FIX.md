# 🔧 GitHub Actions Auto-Deployment Fix

## What Was Fixed

### ✅ Problem
- GitHub Actions workflows were failing with Docker build errors
- Frontend builds failed due to `vite: Permission denied`
- Complex Docker-in-Docker builds were unreliable

### ✅ Solution
- **Simplified workflows** to use `gcloud run deploy --source` (Cloud Build)
- **Fixed Dockerfile** with proper permissions for node binaries
- **Added Cloud Build permissions** to GitHub Actions service account
- **Hardcoded PROJECT_ID** to avoid missing secrets

---

## 🚀 How Auto-Deployment Works Now

### Triggers
Workflows automatically deploy when you push to `main`:

1. **deploy-frontend.yml** - Triggers when `frontend/**` changes
2. **deploy-backend.yml** - Triggers when `backend/**` changes  
3. **deploy-all.yml** - Triggers on ANY push to `main`

### Process
1. GitHub Actions authenticates to GCP using `GCP_SA_KEY` secret
2. Uses Cloud Build to build Docker images (more reliable)
3. Deploys to Cloud Run
4. Tests endpoints
5. Shows deployment URLs

---

## 🔐 Required GitHub Secret

You need **ONE secret** in your GitHub repository:

### `GCP_SA_KEY`

This is the service account key for: `github-actions@code-assist-470813.iam.gserviceaccount.com`

#### To Set/Update This Secret:

```powershell
# 1. Generate a new key (if needed)
gcloud iam service-accounts keys create github-sa-key.json `
  --iam-account=github-actions@code-assist-470813.iam.gserviceaccount.com

# 2. Copy the content
Get-Content github-sa-key.json | Set-Clipboard

# 3. Go to GitHub:
#    https://github.com/chrisdemonxxx/loopjs/settings/secrets/actions
#    
#    - Click "New repository secret"
#    - Name: GCP_SA_KEY
#    - Value: Paste the JSON content
#    - Click "Add secret"

# 4. Delete the key file (security)
Remove-Item github-sa-key.json
```

---

## ✅ Verify Setup

### Check if secret exists:
1. Go to: https://github.com/chrisdemonxxx/loopjs/settings/secrets/actions
2. You should see `GCP_SA_KEY` listed

### Test the workflow:
1. Go to: https://github.com/chrisdemonxxx/loopjs/actions
2. Click "Deploy All Services" workflow
3. Click "Run workflow" → "Run workflow"
4. Watch it deploy! ✅

---

## 🎯 Service Account Permissions

The `github-actions` service account has these roles:
- ✅ `roles/run.admin` - Deploy to Cloud Run
- ✅ `roles/storage.admin` - Store Docker images
- ✅ `roles/iam.serviceAccountUser` - Use service accounts
- ✅ `roles/cloudbuild.builds.builder` - Build with Cloud Build

---

## 📊 Monitoring Deployments

### Watch deployments:
- **GitHub Actions**: https://github.com/chrisdemonxxx/loopjs/actions
- **GCP Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=code-assist-470813
- **GCP Cloud Run**: https://console.cloud.google.com/run?project=code-assist-470813

### Check build logs:
```powershell
# Latest build
gcloud builds list --limit=1

# View logs
gcloud builds log <BUILD_ID>
```

---

## 🔧 Troubleshooting

### If deployment still fails:

1. **Check the secret exists**:
   - https://github.com/chrisdemonxxx/loopjs/settings/secrets/actions
   - Should see `GCP_SA_KEY`

2. **Check service account key is valid**:
   ```powershell
   gcloud iam service-accounts keys list `
     --iam-account=github-actions@code-assist-470813.iam.gserviceaccount.com
   ```

3. **View failed workflow**:
   - Go to https://github.com/chrisdemonxxx/loopjs/actions
   - Click the failed run
   - Check which step failed

4. **Common issues**:
   - ❌ Secret expired → Generate new key
   - ❌ Permission denied → Check service account roles
   - ❌ Build timeout → Increase timeout in workflow

---

## 🎉 Success!

After this fix, every push to `main` will automatically:
1. ✅ Build using Cloud Build (reliable!)
2. ✅ Deploy to Cloud Run
3. ✅ Test endpoints
4. ✅ Show you the URLs

**No more manual deployments!** 🚀

---

## 📝 Quick Commands

```powershell
# Force trigger deployment
git commit --allow-empty -m "Trigger deployment"
git push origin main

# Watch deployment
Start-Process "https://github.com/chrisdemonxxx/loopjs/actions"

# Check deployed services
gcloud run services list --platform managed
```

