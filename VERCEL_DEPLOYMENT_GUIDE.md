# Vercel Deployment Guide

## ⚠️ Important Notes

**Backend on Vercel:** Vercel Serverless Functions don't support persistent WebSocket connections. Keep the backend on Render for WebSocket support.

**Recommended Setup:**
- ✅ **Frontend:** Deploy to Vercel
- ✅ **Backend:** Keep on Render (for WebSocket support)

---

## 🚀 Deploy Frontend to Vercel

### Option 1: Vercel Dashboard (Recommended - Easiest)

1. **Go to Vercel:**
   - Open: https://vercel.com/new
   - Sign in with GitHub (if not already)

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select: `chrisdemonxxx/loopjs`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `frontend` ⚠️ **Important**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`

4. **Environment Variables:**
   Click "Add" for each:
   - **Name:** `VITE_USE_LOCAL` → **Value:** `false`
   - **Name:** `VITE_API_URL` → **Value:** `https://loopjs-backend-s3ja.onrender.com`
   - **Name:** `VITE_WS_URL` → **Value:** `wss://loopjs-backend-s3ja.onrender.com/ws`

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your deployment URL

### Option 2: Vercel CLI (npx - no install needed)

```bash
cd frontend
npx vercel --prod

# When prompted:
# - Set up and deploy? Yes
# - Which scope? [Select your account]
# - Link to existing project? No
# - Project name: loopjs-frontend
# - Directory: ./
# - Override settings? No

# Then set environment variables:
npx vercel env add VITE_USE_LOCAL production
# Enter: false

npx vercel env add VITE_API_URL production
# Enter: https://loopjs-backend-s3ja.onrender.com

npx vercel env add VITE_WS_URL production
# Enter: wss://loopjs-backend-s3ja.onrender.com/ws

# Redeploy with env vars:
npx vercel --prod
```

### Option 3: GitHub Integration (Auto-deploy)

1. **Connect to GitHub:**
   - Go to: https://vercel.com/dashboard
   - Settings → Git → Connect GitHub

2. **Create New Project:**
   - Click "Add New..." → "Project"
   - Select: `chrisdemonxxx/loopjs`
   - Configure:
     - **Root Directory:** `frontend`
     - **Framework:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`

3. **Environment Variables:**
   - Add all three env vars (same as Option 1)

4. **Auto-deploy:**
   - Every push to `main` will auto-deploy
   - Pull requests get preview deployments

---

## ⚠️ Backend on Vercel - Limitations

**Vercel Serverless Functions don't support:**
- ❌ Persistent WebSocket connections
- ❌ Long-running processes
- ❌ Stateful connections

**Your backend uses:**
- ✅ WebSocket for real-time communication (`ws` package)
- ✅ Persistent connections for client management
- ✅ Long-running server process

**Recommendation:** Keep backend on Render where it's currently working.

---

## 🔧 Fixed Build Issues

1. **Sourcemap errors fixed:**
   - Disabled sourcemaps in `vite.config.js`
   - Set `sourcemap: false` in build config

2. **Config updated:**
   - Frontend points to Render backend
   - WebSocket URL configured correctly
   - Vercel config updated with backend URLs

---

## 📊 Current Status

### Render
- ✅ **Backend:** LIVE at https://loopjs-backend-s3ja.onrender.com
- ❌ **Frontend:** Build failed (sourcemap errors - now fixed)

### Vercel
- ⏳ **Frontend:** Ready to deploy (follow steps above)

---

## 🔗 URLs After Deployment

### Render
- **Backend:** https://loopjs-backend-s3ja.onrender.com
- **WebSocket:** wss://loopjs-backend-s3ja.onrender.com/ws
- **Health:** https://loopjs-backend-s3ja.onrender.com/health

### Vercel (After Deployment)
- **Frontend:** https://loopjs-frontend-*.vercel.app
- **Custom Domain:** [Can be added in Vercel dashboard]

---

## 📝 Quick Deploy Command

If you have Vercel CLI installed globally:

```bash
cd frontend
vercel --prod
```

Or use npx (no install needed):

```bash
cd frontend
npx vercel --prod
```

---

## ✅ Verification Checklist

After deploying to Vercel:

- [ ] Frontend loads at Vercel URL
- [ ] Login page appears correctly
- [ ] Can login with test credentials
- [ ] API calls go to Render backend
- [ ] WebSocket connects successfully
- [ ] No console errors

---

**Last Updated:** 2025-11-13  
**Build Issues:** Fixed (sourcemap disabled)  
**Ready for Deployment:** ✅ Yes

