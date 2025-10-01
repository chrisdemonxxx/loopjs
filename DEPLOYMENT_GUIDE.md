# LoopJS Deployment Guide - Production Setup

## 🚀 Quick Deployment Commands

### Deploy Backend Only
```bash
# Using GitHub Actions (Recommended)
git push origin main

# Using Google Cloud Build
gcloud builds submit --config backend/cloudbuild.yaml backend/

# Using gcloud directly
gcloud run deploy loopjs-backend \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,SESSION_SECRET=SESSION_SECRET:latest" \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300
```

### Deploy Frontend Only
```bash
# Using GitHub Actions (Recommended)
git push origin main

# Using gcloud directly
gcloud run deploy loopjs-frontend \
  --source ./frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --port 80
```

### Deploy Both Services
```bash
# Using GitHub Actions (Recommended)
git push origin main

# Manual deployment
gcloud run deploy loopjs-backend --source ./backend --region us-central1 --platform managed --allow-unauthenticated
gcloud run deploy loopjs-frontend --source ./frontend --region us-central1 --platform managed --allow-unauthenticated
```

## 🔧 Configuration Updates

### Update Frontend Configuration
```typescript
// frontend/src/config.ts
const BACKEND_URL = 'https://loopjs-backend-361659024403.us-central1.run.app';
export const WS_URL = 'wss://loopjs-backend-361659024403.us-central1.run.app/ws';
```

### Update Backend Environment Variables
```bash
# Set secrets in Google Secret Manager
gcloud secrets create MONGODB_URI --data-file=mongodb-uri.txt
gcloud secrets create JWT_SECRET --data-file=jwt-secret.txt
gcloud secrets create SESSION_SECRET --data-file=session-secret.txt
```

## 🌐 Domain Configuration

### Custom Domain Setup
- **Frontend**: loopjs.vidai.sbs
- **Backend**: loopjs-backend-361659024403.us-central1.run.app
- **SSL**: Automatic via Google Cloud Run

### DNS Configuration
```
# A record for frontend
loopjs.vidai.sbs -> Cloud Run IP

# CNAME for backend (if needed)
api.loopjs.vidai.sbs -> loopjs-backend-361659024403.us-central1.run.app
```

## 🔍 Health Checks

### Backend Health Check
```bash
curl https://loopjs-backend-361659024403.us-central1.run.app/health
```

### Frontend Health Check
```bash
curl https://loopjs.vidai.sbs/
```

### WebSocket Test
```bash
wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws
```

## 📊 Monitoring & Logs

### View Backend Logs
```bash
gcloud run services logs read loopjs-backend --region us-central1
```

### View Frontend Logs
```bash
gcloud run services logs read loopjs-frontend --region us-central1
```

### Monitor Metrics
```bash
# CPU and Memory usage
gcloud run services describe loopjs-backend --region us-central1

# Request metrics
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=loopjs-backend"
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Client Not Showing in C2 Panel
**Problem**: Frontend shows 0 clients
**Solution**: 
```bash
# Check API endpoint
curl https://loopjs-backend-361659024403.us-central1.run.app/api/info/get-user-list

# Verify frontend configuration
grep -r "get-user-list" frontend/src/
```

#### 2. WebSocket Connection Failed
**Problem**: WebSocket fails to connect
**Solution**:
```bash
# Test WebSocket connection
wscat -c wss://loopjs-backend-361659024403.us-central1.run.app/ws

# Check CORS configuration
curl -H "Origin: https://loopjs.vidai.sbs" https://loopjs-backend-361659024403.us-central1.run.app/health
```

#### 3. SSL/TLS Issues
**Problem**: "No functional TLS backend was found"
**Solution**: Include SChannel backend DLLs in client deployment
```bash
# Copy TLS backends
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qschannelbackend.dll" dist\tls\
copy "C:\Qt\6.9.3\mingw_64\plugins\tls\qcertonlybackend.dll" dist\tls\
```

#### 4. Build Failures
**Problem**: CMake or build errors
**Solution**:
```bash
# Use existing build
.\build-standalone.bat

# Or install CMake
winget install Kitware.CMake
```

## 🔄 Rollback Procedures

### Rollback Backend
```bash
# List revisions
gcloud run revisions list --service loopjs-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic loopjs-backend \
  --region us-central1 \
  --to-revisions=REVISION_NAME=100
```

### Rollback Frontend
```bash
# List revisions
gcloud run revisions list --service loopjs-frontend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic loopjs-frontend \
  --region us-central1 \
  --to-revisions=REVISION_NAME=100
```

## 📈 Scaling Configuration

### Backend Scaling
```bash
gcloud run services update loopjs-backend \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 20 \
  --memory 1Gi \
  --cpu 2
```

### Frontend Scaling
```bash
gcloud run services update loopjs-frontend \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1
```

## 🔐 Security Configuration

### CORS Settings
```javascript
// backend/index.js
app.use(cors({
  origin: [
    'https://loopjs.vidai.sbs',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### JWT Configuration
```javascript
// JWT secret in Google Secret Manager
const jwtSecret = process.env.JWT_SECRET;
const tokenExpiry = '24h';
```

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Update configuration files
- [ ] Test locally
- [ ] Check Google Cloud credentials
- [ ] Verify secrets in Secret Manager

### During Deployment
- [ ] Monitor GitHub Actions
- [ ] Check Cloud Run logs
- [ ] Verify health checks
- [ ] Test WebSocket connections

### Post-Deployment
- [ ] Test frontend at https://loopjs.vidai.sbs/
- [ ] Verify client connections
- [ ] Check C2 panel functionality
- [ ] Monitor error logs

## 🎯 Production URLs

### Current Production Setup
- **Frontend**: https://loopjs.vidai.sbs/
- **Backend**: https://loopjs-backend-361659024403.us-central1.run.app
- **WebSocket**: wss://loopjs-backend-361659024403.us-central1.run.app/ws
- **Health Check**: https://loopjs-backend-361659024403.us-central1.run.app/health

### API Endpoints
- **Client List**: GET /api/info/get-user-list
- **Client Registration**: POST /api/info/register-client
- **Health Check**: GET /health
- **WebSocket**: /ws

---

**Last Updated**: October 1, 2025
**Status**: Production Ready
**Version**: 1.0.0
