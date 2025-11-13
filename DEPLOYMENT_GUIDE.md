# LoopJS Production Deployment Guide

Complete guide for deploying LoopJS to production using **Vercel (Frontend)** + **Render (Backend)** + **MongoDB Atlas (Database)** - 100% FREE!

## 🎯 Deployment Stack

| Component | Platform | Cost | Free Tier Details |
|-----------|----------|------|-------------------|
| **Frontend** | Vercel | $0/month | 100GB bandwidth, unlimited deployments |
| **Backend** | Render | $0/month | 750 hours/month, sleeps after 15min inactivity |
| **Database** | MongoDB Atlas | $0/month | 512MB storage, shared cluster |
| **Total** | - | **$0/month** | Perfect for development and small-scale production |

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] GitHub account with repository access
- [x] Git installed locally
- [x] Node.js 18+ installed (for local testing)

You'll create these accounts during deployment:
- [ ] MongoDB Atlas account
- [ ] Render.com account
- [ ] Vercel account

**Estimated Time:** 60-90 minutes

---

## Phase 1: MongoDB Atlas Setup ✅ COMPLETED

### Your MongoDB Atlas Configuration:

**Connection String:**
```
mongodb+srv://chrisdemonxxx_db_user:Demon%4046@cluster0.1vs04ow.mongodb.net/loopjs?retryWrites=true&w=majority&appName=Cluster0
```

**Details:**
- ✅ **Database:** `loopjs`
- ✅ **User:** `chrisdemonxxx_db_user`
- ✅ **Password:** `Demon@46` (URL-encoded as `Demon%4046`)
- ✅ **Cluster:** `cluster0.1vs04ow.mongodb.net`
- ✅ **Network Access:** 0.0.0.0/0 (allows access from anywhere)

**Security Note:** The `@` symbol in your password has been URL-encoded to `%40` for the connection string.

✅ **MongoDB Atlas setup complete!**

---

## Phase 2: Backend Deployment to Render (15 minutes)

### Step 2.1: Create Render Account

1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub (recommended for auto-deploy)
3. Authorize Render to access your GitHub repositories

### Step 2.2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `your-username/loopjs`
3. **Service name:** `loopjs-backend`
4. **Root Directory:** `backend`
5. **Environment:** `Node`
6. **Region:** `Oregon (US West)` (free tier available)
7. **Branch:** `main`
8. **Build Command:** `npm install --legacy-peer-deps`
9. **Start Command:** `npm start`
10. **Instance Type:** **Free**

### Step 2.3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `8080` | Required |
| `MONGODB_URI` | `mongodb+srv://loopjs-user:...` | Your connection string from Phase 1 |
| `JWT_SECRET` | See backend/.env.production | Copy from file |
| `SESSION_SECRET` | See backend/.env.production | Copy from file |
| `JWT_ACCESS_TOKEN_EXPIRATION` | `1h` | Optional (has default) |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `7d` | Optional (has default) |
| `WS_HEARTBEAT_INTERVAL` | `30000` | Optional (has default) |
| `BYPASS_RATE_LIMIT` | `false` | Enable rate limiting |

**Finding secrets:**
```bash
# In your terminal:
cat backend/.env.production | grep JWT_SECRET
cat backend/.env.production | grep SESSION_SECRET
```

### Step 2.4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Monitor logs for errors
4. When complete, you'll see: ✅ **"Live"**

### Step 2.5: Get Backend URL

1. Copy your Render URL:
   ```
   https://loopjs-backend-XXXX.onrender.com
   ```
2. Test health check:
   ```bash
   curl https://loopjs-backend-XXXX.onrender.com/health
   ```
3. Should return:
   ```json
   {"status":"healthy","timestamp":"..."}
   ```

**Save this URL** - you'll need it for Vercel!

✅ **Backend deployed to Render!**

---

## Phase 3: Frontend Deployment to Vercel (15 minutes)

### Step 3.1: Update Frontend Environment Variables

**IMPORTANT:** Before deploying, update the frontend with your Render backend URL.

Edit `frontend/.env.production`:
```env
VITE_USE_LOCAL=false
VITE_API_URL=https://loopjs-backend-XXXX.onrender.com/api
VITE_WS_URL=wss://loopjs-backend-XXXX.onrender.com/ws
```

Replace `loopjs-backend-XXXX.onrender.com` with **your actual Render URL** from Phase 2.

### Step 3.2: Commit Changes

```bash
cd /media/cjs/ESD-ISO/Projects/loopjs
git add frontend/.env.production
git commit -m "Configure frontend for Render backend"
git push origin main
```

### Step 3.3: Create Vercel Account

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 3.4: Import Project

1. Click **"Add New..."** → **"Project"**
2. Select your **`loopjs`** repository
3. Click **"Import"**

### Step 3.5: Configure Project

**Framework Preset:** Vite
**Root Directory:** `frontend`

**Build & Development Settings:**
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install --legacy-peer-deps`

**Environment Variables:**
Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_USE_LOCAL` | `false` |
| `VITE_API_URL` | `https://loopjs-backend-XXXX.onrender.com/api` |
| `VITE_WS_URL` | `wss://loopjs-backend-XXXX.onrender.com/ws` |

### Step 3.6: Deploy

1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. When complete: ✅ **"Visit"**

### Step 3.7: Get Frontend URL

Your Vercel URL will be:
```
https://loopjs-XXXX.vercel.app
```

Or if you set a custom domain:
```
https://your-custom-domain.com
```

✅ **Frontend deployed to Vercel!**

---

## Phase 4: Final Configuration (10 minutes)

### Step 4.1: Update Backend CORS (If Needed)

The backend is already configured to allow all `.vercel.app` domains!

If you have a custom domain, add it to `backend/index.js`:

```javascript
const allowedOrigins = [
    // ... existing origins
    'https://your-custom-domain.com',  // Add your domain here
];
```

Then commit and Render will auto-redeploy:
```bash
git add backend/index.js
git commit -m "Add custom domain to CORS"
git push origin main
```

### Step 4.2: Test Production Deployment

1. **Visit Frontend:** Open your Vercel URL
2. **Login:** Use your credentials (default: admin/admin)
3. **Check Backend Connection:**
   - Open browser DevTools → Network tab
   - Login should call `/api/auth/login`
   - Should see successful response
4. **Check WebSocket:**
   - Look for WebSocket connection in Network → WS
   - Should see "connected" status

### Step 4.3: Test Client Connection

If you have the Qt/C# client built:

1. Update client `config.json`:
   ```json
   {
     "backendUrl": "https://loopjs-backend-XXXX.onrender.com"
   }
   ```
2. Run client
3. Should appear in C2 panel dashboard

---

## 🎉 Deployment Complete!

Your production URLs:
- **Frontend:** `https://loopjs-XXXX.vercel.app`
- **Backend:** `https://loopjs-backend-XXXX.onrender.com`
- **Database:** MongoDB Atlas cluster

---

## 📊 Monitoring & Maintenance

### Render Backend Monitoring

- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Monitor CPU, memory, requests
- **Free Tier Limit:** 750 hours/month (enough for 1 service running 24/7)
- **Sleep Behavior:** Sleeps after 15min inactivity, wakes on request (cold start ~30s)

### Vercel Frontend Monitoring

- **Analytics:** Vercel Dashboard → Your Project → Analytics
- **Deployments:** See all deployment history
- **Free Tier Limit:** 100GB bandwidth/month

### MongoDB Atlas Monitoring

- **Metrics:** Atlas Dashboard → Metrics
- **Free Tier Limit:** 512MB storage
- **Connections:** Monitor active connections

---

## 🔧 Troubleshooting

### Backend Not Starting
- Check Render logs for errors
- Verify `MONGODB_URI` is correct
- Test MongoDB connection from Atlas dashboard

### Frontend Can't Connect
- Check browser console for CORS errors
- Verify `VITE_API_URL` and `VITE_WS_URL` are correct
- Test backend health: `curl https://your-backend.onrender.com/health`

### WebSocket Connection Failed
- Ensure using `wss://` (not `ws://`)
- Check Render logs for WebSocket errors
- Verify firewall isn't blocking WebSocket

### Cold Start Delays
- **Render free tier sleeps after 15min inactivity**
- First request after sleep takes ~30 seconds
- Upgrade to paid tier ($7/month) for always-on

---

## 🚀 Next Steps

1. **Custom Domain:** Add custom domain in Vercel
2. **Monitoring:** Set up Sentry for error tracking
3. **Analytics:** Add Google Analytics to frontend
4. **Backups:** Configure MongoDB Atlas backups
5. **CI/CD:** Already configured with auto-deploy!

---

## 📝 Important Notes

- **Secrets:** Never commit `.env` files with real secrets
- **Backups:** MongoDB Atlas free tier has limited backups
- **Scaling:** Upgrade when you need more resources
- **Security:** Review CORS origins before production use

For issues, check the [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) or open a GitHub issue.
