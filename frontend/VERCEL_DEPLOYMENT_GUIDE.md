# Vercel Deployment Guide - LoopJS Frontend

## Prerequisites Verification

### Status: All Prerequisites Met ✅

- ✅ **vercel.json exists**: `/home/user/loopjs/frontend/vercel.json`
- ✅ **Build succeeds**: `npm run build` completed in 7.04s
- ✅ **Git status**: All files committed (working tree clean)
- ✅ **Build output**: `build/` directory with 467.32 kB bundle

---

## Deployment Options

### Option A: Deploy via Vercel Dashboard (Recommended for First Deployment)

This is the easiest method for first-time deployments and provides a visual interface.

#### Step 1: Push Your Code to GitHub

```bash
# Ensure you're on the correct branch
git status

# If you have changes, commit them
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### Step 2: Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository:
   - Select your repository: `loopjs`
   - Click "Import"

#### Step 3: Configure Project Settings

Vercel will auto-detect your configuration from `vercel.json`, but verify these settings:

**Framework Preset:** Vite

**Root Directory:** `frontend`

**Build Settings:**
- Build Command: `npm run build` (auto-detected from vercel.json)
- Output Directory: `build` (auto-detected from vercel.json)
- Install Command: `npm install` (auto-detected from vercel.json)

#### Step 4: Configure Environment Variables

Click "Environment Variables" and add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | Your backend URL (e.g., `https://your-backend.render.com`) | Production |
| `VITE_WS_URL` | Your WebSocket URL (e.g., `wss://your-backend.render.com/ws`) | Production |

**Important Notes:**
- For development/preview deployments, you can add the same variables with different values
- If your backend is not yet deployed, you can add these later and redeploy

#### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete (usually 1-2 minutes)
3. Your site will be available at `https://your-project.vercel.app`

---

### Option B: Deploy via Vercel CLI

For developers who prefer command-line tools and automated workflows.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

#### Step 3: Navigate to Frontend Directory

```bash
cd /home/user/loopjs/frontend
```

#### Step 4: Deploy to Production

```bash
# First deployment (will prompt for configuration)
vercel --prod

# Follow the prompts:
# ? Set up and deploy "~/loopjs/frontend"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? loopjs-frontend
# ? In which directory is your code located? ./
```

#### Step 5: Set Environment Variables via CLI

```bash
# Set production environment variables
vercel env add VITE_API_URL production
# Enter value: https://your-backend.render.com

vercel env add VITE_WS_URL production
# Enter value: wss://your-backend.render.com/ws
```

#### Step 6: Redeploy with Environment Variables

```bash
vercel --prod
```

#### Subsequent Deployments

After the first deployment, simply run:

```bash
cd /home/user/loopjs/frontend
vercel --prod
```

---

## How vercel.json Works

Your `vercel.json` configuration is automatically detected and used:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_URL": "@vite_api_url"
  }
}
```

**What this does:**
- **buildCommand**: Runs `npm run build` to compile your Vite app
- **outputDirectory**: Serves files from the `build/` directory
- **rewrites**: Enables client-side routing (all routes point to index.html)
- **headers**: Sets cache headers for static assets (1 year cache for immutability)
- **env**: References environment variables

---

## Required Environment Variables

### Backend Connection

Your frontend uses these environment variables (found in your codebase):

#### 1. VITE_API_URL
**Used in:**
- `/home/user/loopjs/frontend/src/services/api.ts`
- `/home/user/loopjs/frontend/src/services/buildService.ts`

**Purpose:** Base URL for REST API calls

**Example Values:**
- Production: `https://your-backend.render.com`
- Development: `http://localhost:8080`

**Code Reference:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
```

#### 2. VITE_WS_URL
**Used in:**
- `/home/user/loopjs/frontend/src/services/websocketService.ts`

**Purpose:** WebSocket connection URL

**Example Values:**
- Production: `wss://your-backend.render.com/ws`
- Development: `ws://localhost:8080/ws`

**Code Reference:**
```typescript
const host = import.meta.env.VITE_WS_URL || window.location.host;
this.url = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;
```

### Setting Environment Variables

#### Via Vercel Dashboard:
1. Go to your project on Vercel
2. Click "Settings" → "Environment Variables"
3. Add each variable
4. Redeploy for changes to take effect

#### Via Vercel CLI:
```bash
vercel env add VITE_API_URL production
vercel env add VITE_WS_URL production
```

---

## Build Configuration Verification

### Current Build Settings

Your project is configured with:

**Package.json:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

**Vite Config (vite.config.ts):**
```typescript
{
  build: {
    target: 'esnext',
    outDir: 'build',
  }
}
```

**Build Output:**
- `build/index.html` (0.44 kB)
- `build/assets/index-1hB1OBGF.css` (4.43 kB)
- `build/assets/index-DVwptm_o.js` (467.32 kB)

### Verifying Build Locally

Before deploying, you can verify the build:

```bash
cd /home/user/loopjs/frontend

# Clean previous build
rm -rf build

# Build
npm run build

# Preview the production build locally
npx serve build
```

Then open `http://localhost:3000` to test the production build.

---

## Post-Deployment Steps

### 1. Update Backend CORS Configuration

After deploying, you'll get a Vercel URL like `https://loopjs-frontend-xyz.vercel.app`

**Update Backend CORS:**

Edit `/home/user/loopjs/backend/index.js` (lines 31-41):

```javascript
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:4173',
    'http://localhost:4174',
    'http://localhost',
    'https://loopjs.vidai.sbs',
    'https://loopjs-frontend.onrender.com',
    'https://frontend-c6l7dzrkd-chrisdemonxxxs-projects.vercel.app',
    'https://YOUR-NEW-VERCEL-URL.vercel.app'  // Add your new URL here
];
```

**Note:** Your backend already has this wildcard rule (line 50-53):
```javascript
else if (origin.endsWith('.vercel.app')) {
    // Allow all Vercel deployments
    console.log(`CORS: Allowing Vercel origin: ${origin}`);
    callback(null, true);
}
```

This means **all Vercel deployments are automatically allowed** - no changes needed!

### 2. Test the Deployed Frontend

#### A. Basic Functionality Tests

1. **Visit your deployed URL**
   ```
   https://your-project.vercel.app
   ```

2. **Check the browser console** (F12)
   - Look for any errors
   - Verify API calls are going to the correct backend URL

3. **Test routing**
   - Navigate to different pages
   - Use browser back/forward buttons
   - Refresh the page on a non-home route

#### B. API Connection Test

Open browser DevTools (F12) → Console and run:

```javascript
// Test API connection
fetch(import.meta.env.VITE_API_URL + '/health')
  .then(r => r.json())
  .then(d => console.log('Backend health:', d))
  .catch(e => console.error('Backend error:', e));
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T18:15:00.000Z",
  "uptime": 123.45,
  "port": 8080,
  "initialized": true
}
```

### 3. Test WebSocket Connections

In the deployed app:

1. Open the main dashboard
2. Check browser console for WebSocket messages
3. Look for successful connection logs

**Expected Console Output:**
```
WebSocket connecting to: wss://your-backend.render.com/ws
WebSocket connected successfully
```

**Test WebSocket manually:**
```javascript
// In browser console
const ws = new WebSocket(import.meta.env.VITE_WS_URL);
ws.onopen = () => console.log('WS Connected');
ws.onerror = (e) => console.error('WS Error:', e);
ws.onmessage = (m) => console.log('WS Message:', m.data);
```

### 4. Test Authentication Flow

1. Navigate to login page
2. Enter credentials
3. Verify successful login
4. Check that protected routes work
5. Test logout functionality

**Check for:**
- Successful API calls to `/api/auth/login`
- JWT token stored in localStorage/cookies
- Proper redirects after login/logout
- Protected routes redirect to login when not authenticated

### 5. Performance Checks

Use Vercel's built-in analytics:

1. Go to your project on Vercel
2. Click "Analytics" tab
3. Monitor:
   - Page load times
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

**Recommended Actions:**
- LCP should be < 2.5s
- FID should be < 100ms
- CLS should be < 0.1

### 6. Configure Custom Domain (Optional)

1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take 24-48 hours)

**Update CORS after adding custom domain:**
```javascript
// In backend/index.js
const allowedOrigins = [
    // ... existing origins
    'https://your-custom-domain.com'
];
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Failures

**Error: "Command failed: npm run build"**

**Solutions:**
```bash
# Test build locally first
cd /home/user/loopjs/frontend
rm -rf node_modules build
npm install
npm run build

# Check Node.js version compatibility
node --version  # Should be 18+

# Review build logs on Vercel for specific errors
```

**Error: "Cannot find module 'vite'"**

**Solution:**
```bash
# Ensure all dependencies are in package.json (not devDependencies for production)
# Vite should be in devDependencies, which Vercel installs by default
```

#### 2. Environment Variable Problems

**Issue: API calls failing with 404**

**Check:**
1. Are environment variables set in Vercel?
   - Go to Project → Settings → Environment Variables
2. Did you redeploy after adding variables?
   - Environment changes require a new deployment
3. Are variable names correct?
   - Must start with `VITE_` for Vite to expose them
   - Check exact spelling: `VITE_API_URL` not `VITE_API_URL_`

**Debug in Browser Console:**
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('WS URL:', import.meta.env.VITE_WS_URL);
```

**If showing `undefined`:**
- Variables weren't available at build time
- Redeploy after setting environment variables
- Check variable names start with `VITE_`

#### 3. CORS Errors

**Error in browser console:**
```
Access to fetch at 'https://your-backend.com/api/...' from origin
'https://your-frontend.vercel.app' has been blocked by CORS policy
```

**Solutions:**

**A. Verify Backend CORS Configuration**

Your backend at `/home/user/loopjs/backend/index.js` should have:

```javascript
// Line 50-53
else if (origin.endsWith('.vercel.app')) {
    // Allow all Vercel deployments
    console.log(`CORS: Allowing Vercel origin: ${origin}`);
    callback(null, true);
}
```

This is already in your code, so all `*.vercel.app` domains are allowed.

**B. Check Backend Logs**

Look for CORS logs:
```
CORS: Allowing Vercel origin: https://your-app.vercel.app
```

or

```
CORS: Blocking origin: https://your-app.vercel.app
```

**C. Manually Add Origin (if needed)**

If the wildcard isn't working, add explicitly:

```javascript
const allowedOrigins = [
    // ... existing origins
    'https://your-specific-deployment.vercel.app'
];
```

**D. Test CORS with curl**

```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-backend.com/api/health \
     -v
```

Look for response headers:
```
Access-Control-Allow-Origin: https://your-app.vercel.app
Access-Control-Allow-Credentials: true
```

#### 4. WebSocket Connection Issues

**Error: "WebSocket connection failed"**

**Check:**

1. **Protocol Mismatch**
   - Frontend HTTPS → Backend must use WSS (not WS)
   - Set `VITE_WS_URL=wss://your-backend.com/ws` (not `ws://`)

2. **Backend WebSocket Support**
   - Ensure backend is listening for WebSocket connections
   - Check backend logs for WebSocket upgrade requests

3. **Firewall/Proxy Issues**
   - Some hosting providers block WebSocket connections
   - Verify your backend host supports WebSockets

**Debug WebSocket:**

```javascript
// In browser console
const ws = new WebSocket('wss://your-backend.com/ws');

ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('Connection closed:', e.code, e.reason);
```

**Common WebSocket Error Codes:**
- 1000: Normal closure
- 1006: Abnormal closure (connection failed)
- 1011: Server error

#### 5. Routing Issues (404 on Page Refresh)

**Issue: Page works on first load, but 404 on refresh**

**Solution:**

Your `vercel.json` already has the fix (lines 6-11):
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

This ensures all routes serve `index.html` for client-side routing.

**If still having issues:**
- Verify `vercel.json` is in the correct directory (`/frontend/vercel.json`)
- Check Vercel build logs to ensure `vercel.json` was detected
- Manually add the rewrite rule in Vercel Dashboard:
  - Project → Settings → Redirects
  - Add rewrite: `/*` → `/index.html` (200)

#### 6. Static Assets Not Loading

**Error: "Failed to load resource: 404"**

**Check:**

1. **Build Output Directory**
   - Verify `outputDirectory` in `vercel.json` is `build`
   - Check that `build/assets/` contains your files

2. **Asset Paths**
   - Ensure Vite is using relative paths
   - Check `vite.config.ts` doesn't set incorrect `base`

3. **Cache Headers**
   - Your `vercel.json` sets cache headers (lines 12-22)
   - This is correct and optimizes asset delivery

**Test Asset Loading:**
```bash
# Check if assets exist after build
ls -la /home/user/loopjs/frontend/build/assets/

# Should show:
# index-HASH.css
# index-HASH.js
```

#### 7. Performance Issues

**Issue: Slow page loads**

**Solutions:**

1. **Enable Compression**
   - Vercel automatically compresses assets (Brotli/Gzip)
   - Verify in Network tab: `Content-Encoding: br`

2. **Optimize Bundle Size**
   ```bash
   # Analyze bundle
   npm install -D vite-bundle-visualizer

   # Add to package.json scripts
   "analyze": "vite-bundle-visualizer"

   # Run analysis
   npm run analyze
   ```

3. **Code Splitting**
   - Vite automatically code-splits
   - Consider lazy loading routes

4. **Image Optimization**
   - Use Vercel Image Optimization
   - Compress images before uploading

#### 8. Deployment Logs Show Errors

**How to View Logs:**

1. Go to your project on Vercel
2. Click "Deployments"
3. Click on the failed deployment
4. View "Build Logs" and "Function Logs"

**Common Log Errors:**

**"npm ERR! code ELIFECYCLE"**
```bash
# Build failed during npm run build
# Check your build script locally first
cd /home/user/loopjs/frontend
npm run build
```

**"Error: No Output Directory named 'build' found"**
```bash
# Verify build actually creates build/ folder
# Check vite.config.ts: outDir: 'build'
```

**"Module not found: Can't resolve 'X'"**
```bash
# Missing dependency
npm install X
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

---

## Advanced Configuration

### A. Custom Build Commands

If you need custom build steps, update `vercel.json`:

```json
{
  "buildCommand": "npm run build && npm run post-build",
  "installCommand": "npm ci"
}
```

### B. Multiple Environments

Set different environment variables for preview vs production:

```bash
# Production
vercel env add VITE_API_URL production
# Enter: https://api.production.com

# Preview (for PR deployments)
vercel env add VITE_API_URL preview
# Enter: https://api.staging.com

# Development
vercel env add VITE_API_URL development
# Enter: http://localhost:8080
```

### C. Deployment Protection

Enable deployment protection for production:

1. Go to Project → Settings → Deployment Protection
2. Enable "Vercel Authentication"
3. Add allowed email addresses or teams

### D. Preview Deployments

Every git push creates a preview deployment:

```bash
# Push to feature branch
git checkout -b feature/new-ui
git push origin feature/new-ui

# Vercel automatically creates preview at:
# https://loopjs-frontend-git-feature-new-ui.vercel.app
```

### E. Monitoring and Alerts

Set up monitoring:

1. Project → Settings → Monitoring
2. Enable alerts for:
   - Build failures
   - High error rates
   - Slow page loads
   - Downtime

### F. Serverless Functions (Optional)

If you need serverless API routes:

Create `/home/user/loopjs/frontend/api/hello.ts`:
```typescript
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello from Vercel!' });
}
```

Access at: `https://your-app.vercel.app/api/hello`

---

## Deployment Checklist

Use this checklist before deploying:

### Pre-Deployment

- [ ] Code is committed to git
- [ ] `npm run build` succeeds locally
- [ ] Environment variables documented
- [ ] Backend CORS configured for Vercel domains
- [ ] Backend is deployed and accessible
- [ ] WebSocket endpoint is accessible

### Initial Deployment

- [ ] Project imported to Vercel (or CLI configured)
- [ ] Build settings verified (build command, output directory)
- [ ] Environment variables added (`VITE_API_URL`, `VITE_WS_URL`)
- [ ] First deployment successful
- [ ] Deployment URL accessible

### Post-Deployment Testing

- [ ] Frontend loads without errors
- [ ] API calls succeed (check browser console)
- [ ] WebSocket connection established
- [ ] Authentication flow works
- [ ] Routing works (test multiple pages)
- [ ] Page refresh doesn't cause 404
- [ ] Static assets load correctly
- [ ] No CORS errors in console

### Production Readiness

- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Performance metrics acceptable (Analytics)
- [ ] Error tracking enabled
- [ ] Monitoring/alerts configured
- [ ] Team members have access
- [ ] Documentation updated with production URLs

---

## Quick Reference

### Vercel CLI Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Set environment variable
vercel env add VARIABLE_NAME production

# List environment variables
vercel env ls

# Remove deployment
vercel rm [deployment-name]

# Link local project to Vercel project
vercel link
```

### Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev/guide/
- **Your Project**: `/home/user/loopjs/frontend`
- **vercel.json**: `/home/user/loopjs/frontend/vercel.json`

---

## Getting Help

### Vercel Support

- **Documentation**: https://vercel.com/docs
- **Community**: https://github.com/vercel/vercel/discussions
- **Support**: https://vercel.com/support

### Project-Specific Issues

- **Backend Deployment Guide**: `/home/user/loopjs/backend/DEPLOYMENT_SUMMARY.md`
- **Main README**: `/home/user/loopjs/README.md`
- **Deployment Checklist**: `/home/user/loopjs/DEPLOYMENT_CHECKLIST.md`

---

## Summary

Your LoopJS frontend is ready for Vercel deployment:

1. ✅ **Build Configuration**: Properly configured with Vite
2. ✅ **Vercel Configuration**: `vercel.json` is properly set up
3. ✅ **Environment Variables**: VITE_API_URL and VITE_WS_URL identified
4. ✅ **CORS**: Backend already supports `*.vercel.app` wildcard
5. ✅ **Routing**: Client-side routing configured via rewrites
6. ✅ **Build Test**: Successfully builds (467.32 kB bundle)

**Next Steps:**
1. Choose deployment method (Dashboard or CLI)
2. Set environment variables with your backend URL
3. Deploy to Vercel
4. Test the deployment
5. Monitor and optimize

**Estimated Deployment Time**: 5-10 minutes

Good luck with your deployment!
