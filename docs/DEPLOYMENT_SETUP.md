# LoopJS Deployment Setup Guide

This guide will help you set up automated deployment from GitHub to Google Cloud Run for the backend and Vercel for the frontend.

## 🚀 Overview

Your deployment pipeline:
1. **GitHub** → Push code to `main` branch
2. **GitHub Actions** → Automatically builds and tests
3. **Google Cloud Run** → Deploys backend with health checks
4. **Vercel** → Deploys frontend automatically
5. **Zero Downtime** → Gradual rollout with automatic rollback on failure

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ GitHub account with repository access
- ✅ Google Cloud Platform account
- ✅ Vercel account
- ✅ MongoDB Atlas account (or other MongoDB hosting)
- ✅ Domain name (optional, but recommended)

---

## 🔧 Part 1: Google Cloud Platform Setup

### 1.1 Create/Configure GCP Project

```bash
# Install gcloud CLI (if not already installed)
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create new project (or use existing)
gcloud projects create loopjs-backend --name="LoopJS Backend"

# Set as default project
gcloud config set project loopjs-backend

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### 1.2 Create Service Account for GitHub Actions

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment Account"

# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

# This creates github-actions-key.json - you'll need this for GitHub Secrets
```

### 1.3 Create Secrets in Google Secret Manager

```bash
# Create MongoDB URI secret
echo -n "mongodb+srv://user:password@cluster.mongodb.net/database" | \
  gcloud secrets create MONGODB_URI --data-file=-

# Create JWT Secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create JWT_SECRET --data-file=-

# Create Session Secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# Grant Cloud Run service access to secrets
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding MONGODB_URI \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🔐 Part 2: GitHub Secrets Configuration

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Description | Where to Get It |
|------------|-------------|-----------------|
| `GCP_PROJECT_ID` | Your GCP project ID | From `gcloud config get-value project` |
| `GCP_SA_KEY` | Service account JSON key | Contents of `github-actions-key.json` |
| `VERCEL_TOKEN` | Vercel deployment token | Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel whoami` or check Vercel settings |
| `VERCEL_PROJECT_ID` | Vercel project ID | From Vercel project settings |

### To get Vercel secrets:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link your project
cd frontend
vercel link

# Get organization and project IDs
vercel whoami
# Shows your org ID

# Check .vercel/project.json for project ID
cat .vercel/project.json
```

---

## 📦 Part 3: Backend Configuration

### 3.1 Update Dockerfile (if needed)

The existing `Dockerfile` in `backend/` should work, but verify:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 8080
CMD ["node", "index.js"]
```

### 3.2 Update CORS Origins

Edit `backend/index.js` to add your production domains:

```javascript
const allowedOrigins = [
    'https://your-frontend-domain.vercel.app',
    'https://your-custom-domain.com',
    // ... keep existing origins for development
];
```

---

## 🌐 Part 4: Frontend Configuration

### 4.1 Update API URL

Edit `frontend/src/config.ts` (or wherever API URL is configured):

```typescript
export const API_URL = process.env.VITE_API_URL || 
  'https://loopjs-backend-PROJECT_ID.us-central1.run.app';

export const WS_URL = process.env.VITE_WS_URL || 
  'wss://loopjs-backend-PROJECT_ID.us-central1.run.app/ws';
```

### 4.2 Configure Vercel Environment Variables

In Vercel dashboard → Your Project → **Settings** → **Environment Variables**

Add:
- `VITE_API_URL` = Your Cloud Run backend URL
- `VITE_WS_URL` = Your Cloud Run backend WebSocket URL

---

## 🚀 Part 5: Deploy!

### 5.1 Initial Manual Deployment (Recommended)

First, test deployment manually:

```bash
# Backend
cd backend
gcloud run deploy loopjs-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080

# Frontend
cd ../frontend
vercel --prod
```

### 5.2 Enable Automatic Deployments

Once manual deployment works:

1. Commit and push the new GitHub Actions workflows:
```bash
git add .github/workflows/
git commit -m "Add automated deployment workflows"
git push origin main
```

2. GitHub Actions will automatically:
   - Detect changes in `backend/` or `frontend/`
   - Build Docker image for backend
   - Deploy to Cloud Run with health checks
   - Deploy frontend to Vercel
   - Run verification tests
   - Rollback automatically on failure

---

## 📊 Part 6: Monitoring Your Deployment

### Backend (Google Cloud Run)

```bash
# View logs
gcloud run services logs read loopjs-backend --region us-central1

# Get service URL
gcloud run services describe loopjs-backend \
  --region us-central1 \
  --format="value(status.url)"

# Test health endpoint
curl https://your-backend-url.run.app/health
```

### Frontend (Vercel)

- Visit Vercel dashboard for deployment logs
- Check runtime logs in Vercel Functions tab

---

## 🔄 Part 7: Update Client Configuration

Once backend is deployed, update your Qt Client:

1. Get your production backend URL:
```bash
gcloud run services describe loopjs-backend \
  --region us-central1 \
  --format="value(status.url)"
```

2. Update `clients/qt-client/config.json`:
```json
{
  "server": {
    "url": "wss://loopjs-backend-YOUR-PROJECT.us-central1.run.app/ws"
  }
}
```

3. Update `clients/qt-client/mainwindow.cpp`:
```cpp
#define DEF_WS_URL "wss://loopjs-backend-YOUR-PROJECT.us-central1.run.app/ws"
```

4. Rebuild client:
```bash
cd clients/qt-client
build.bat
```

---

## 🐛 Troubleshooting

### Deployment Fails with "Permission Denied"

```bash
# Verify service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions@*"
```

### Health Check Fails

```bash
# Check Cloud Run logs
gcloud run services logs tail loopjs-backend --region us-central1

# Test health endpoint locally
docker run -p 8080:8080 gcr.io/$PROJECT_ID/loopjs-backend:latest
curl http://localhost:8080/health
```

### WebSocket Connection Issues

1. Verify backend URL in client matches Cloud Run URL
2. Check CORS origins in `index.js`
3. Verify secrets are properly loaded:
```bash
gcloud secrets versions access latest --secret=MONGODB_URI
```

### Frontend Can't Connect to Backend

1. Verify CORS origins include your Vercel domain
2. Check environment variables in Vercel dashboard
3. Check browser console for CORS errors

---

## 📝 Best Practices

1. **Never commit secrets** - Use GitHub Secrets and GCP Secret Manager
2. **Use staging environment** - Test changes before production
3. **Monitor logs** - Set up Cloud Logging alerts
4. **Backup database** - Regular MongoDB Atlas backups
5. **Version tagging** - Tag releases in Git
6. **Health checks** - Always include `/health` endpoint

---

## 🎯 Quick Reference Commands

```bash
# Deploy backend manually
gcloud run deploy loopjs-backend --source backend --region us-central1

# Deploy frontend manually
cd frontend && vercel --prod

# View backend logs
gcloud run services logs read loopjs-backend --region us-central1

# Test health endpoint
curl https://$(gcloud run services describe loopjs-backend --region us-central1 --format="value(status.url)")/health

# Rollback backend
gcloud run services update-traffic loopjs-backend --region us-central1 --to-revisions=PREVIOUS_REVISION=100

# List all revisions
gcloud run revisions list --service loopjs-backend --region us-central1
```

---

## ✅ Checklist

Before going live, ensure:

- [ ] All secrets configured in GCP Secret Manager
- [ ] GitHub secrets added to repository
- [ ] CORS origins updated for production domains
- [ ] Frontend environment variables set in Vercel
- [ ] Client configuration points to production backend
- [ ] Health checks passing
- [ ] WebSocket connections working
- [ ] MongoDB connection verified
- [ ] Domain configured (if using custom domain)
- [ ] SSL/TLS certificates valid
- [ ] Monitoring and logging enabled

---

## 📞 Support

If you encounter issues:

1. Check GitHub Actions logs in repository
2. Check Cloud Run logs: `gcloud run services logs read loopjs-backend`
3. Check Vercel deployment logs in dashboard
4. Review this guide's troubleshooting section

---

## 🎉 Success!

Once everything is set up, your deployment will:
- ✅ Automatically deploy on every push to `main`
- ✅ Run health checks before promoting
- ✅ Rollback automatically on failure
- ✅ Provide zero-downtime updates
- ✅ Scale automatically based on traffic

Your backend will be at: `https://loopjs-backend-PROJECT_ID.us-central1.run.app`
Your frontend will be at: `https://your-project.vercel.app`