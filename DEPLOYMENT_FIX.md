# Deployment Failure Fix Guide

## ❌ Current Issue

**Error:** `invalid_grant: Invalid grant: account not found`

**Service Account:** `github-actions@code-assist-470813.iam.gserviceaccount.com`

**GitHub Secret:** `GCP_SA_KEY`

---

## 🔍 Problem Analysis

The deployments are failing because the Google Cloud service account key stored in GitHub Secrets is either:
1. **Expired** - Service account keys have expiration dates
2. **Invalid** - Key was deleted or corrupted
3. **Wrong account** - Key doesn't match the service account

---

## ✅ Solution: Regenerate and Update Service Account Key

### Step 1: Generate New Service Account Key

```bash
# If you have gcloud CLI installed locally:
gcloud iam service-accounts keys create github-sa-key.json \
  --iam-account=github-actions@code-assist-470813.iam.gserviceaccount.com \
  --project=code-assist-470813
```

**OR** use Google Cloud Console:
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=code-assist-470813
2. Click on `github-actions@code-assist-470813.iam.gserviceaccount.com`
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key"
5. Choose "JSON" format
6. Download the key file

### Step 2: Copy Key Content

```bash
# On Linux/Mac:
cat github-sa-key.json | pbcopy  # Mac
cat github-sa-key.json | xclip -selection clipboard  # Linux

# Or open the file and copy all content
```

### Step 3: Update GitHub Secret

1. Go to: https://github.com/chrisdemonxxx/loopjs/settings/secrets/actions
2. Click on `GCP_SA_KEY`
3. Click "Update"
4. Paste the **entire JSON content** from the key file
5. Click "Update secret"

### Step 4: Verify Service Account Permissions

The service account needs these roles:
- `Cloud Build Service Account`
- `Cloud Run Admin`
- `Service Account User`
- `Storage Admin` (for Container Registry)

**Check permissions:**
```bash
gcloud projects get-iam-policy code-assist-470813 \
  --flatten="bindings[].members" \
  --filter="bindings.members:github-actions@code-assist-470813.iam.gserviceaccount.com"
```

**Grant permissions if needed:**
```bash
gcloud projects add-iam-policy-binding code-assist-470813 \
  --member="serviceAccount:github-actions@code-assist-470813.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding code-assist-470813 \
  --member="serviceAccount:github-actions@code-assist-470813.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding code-assist-470813 \
  --member="serviceAccount:github-actions@code-assist-470813.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding code-assist-470813 \
  --member="serviceAccount:github-actions@code-assist-470813.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Step 5: Trigger New Deployment

After updating the secret:

1. **Option A: Manual trigger**
   - Go to: https://github.com/chrisdemonxxx/loopjs/actions/workflows/deploy-all.yml
   - Click "Run workflow"
   - Select main branch
   - Click "Run workflow"

2. **Option B: Push a commit**
   ```bash
   git commit --allow-empty -m "Trigger deployment after fixing GCP_SA_KEY"
   git push origin main
   ```

---

## 🔐 Security Best Practices

1. **Delete old key file** after uploading to GitHub:
   ```bash
   rm github-sa-key.json
   ```

2. **Rotate keys regularly** - Every 90 days is recommended

3. **Use least privilege** - Only grant necessary permissions

4. **Monitor key usage** - Check Cloud Logging for unexpected access

---

## 📊 Verification Steps

After updating the secret and triggering deployment:

1. **Check GitHub Actions:**
   - Go to: https://github.com/chrisdemonxxx/loopjs/actions
   - Watch the "Deploy All Services" workflow

2. **Check Build Logs:**
   - Look for "Authenticate to Google Cloud" step
   - Should see: ✅ Authentication successful

3. **Check Deployment:**
   - Frontend should deploy to: https://loopjs-frontend-361659024403.us-central1.run.app
   - Backend should deploy to: https://loopjs-backend-361659024403.us-central1.run.app

---

## 🚨 Alternative: Use Workload Identity Federation (Recommended)

For better security, consider using Workload Identity Federation instead of service account keys:

1. **Create Workload Identity Pool:**
   ```bash
   gcloud iam workload-identity-pools create github-pool \
     --project=code-assist-470813 \
     --location="global"
   ```

2. **Create Provider:**
   ```bash
   gcloud iam workload-identity-pools providers create-oidc github-provider \
     --project=code-assist-470813 \
     --location="global" \
     --workload-identity-pool="github-pool" \
     --issuer-uri="https://token.actions.githubusercontent.com" \
     --attribute-mapping="google.subject=assertion.sub"
   ```

3. **Update GitHub Actions workflow** to use Workload Identity instead of key file

---

## 📝 Summary

**Current Status:** ❌ Deployments failing due to invalid service account key

**Action Required:** 
1. Generate new service account key
2. Update `GCP_SA_KEY` secret in GitHub
3. Verify service account permissions
4. Trigger new deployment

**Expected Result:** ✅ Successful deployment to Google Cloud Run

---

**Last Updated:** 2025-11-13

