# LoopJS Production Deployment Checklist

Quick reference checklist for deploying LoopJS to production.

## ✅ Pre-Deployment Checklist

### Repository Preparation
- [ ] Code is committed and pushed to GitHub
- [ ] `.github/workflows/deploy-all.yml` exists in project root
- [ ] `backend/render.yaml` configuration file exists
- [ ] `frontend/vercel.json` configuration file exists
- [ ] `.env` files are in `.gitignore` (never commit secrets!)

### Code Review
- [ ] All tests passing locally
- [ ] No critical TODOs or FIXMEs in code
- [ ] Security middleware enabled (JWT, CORS, rate limiting)
- [ ] Health check endpoints working (`/health`)

---

## 🗄️ MongoDB Atlas Setup

- [ ] Created MongoDB Atlas account
- [ ] Created M0 (free) cluster
- [ ] Created database user with password
- [ ] Saved password securely
- [ ] Whitelisted IP addresses (`0.0.0.0/0` for development)
- [ ] Obtained connection string
- [ ] Replaced `<password>` in connection string
- [ ] Added `/loopjs` database name to connection string
- [ ] Tested connection string locally (optional)

**Connection String Format:**
```
mongodb+srv://loopjs-user:YOUR_PASSWORD@cluster.mongodb.net/loopjs?retryWrites=true&w=majority
```

---

## 🔧 Backend Deployment (Render.com)

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service
- [ ] Set root directory to `backend`
- [ ] Set build command: `npm install --legacy-peer-deps`
- [ ] Set start command: `npm start`
- [ ] Selected Free instance type
- [ ] Added environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=8080`
  - [ ] `MONGODB_URI=<your_connection_string>`
  - [ ] `JWT_SECRET=<from .env.production>`
  - [ ] `SESSION_SECRET=<from .env.production>`
  - [ ] `JWT_ACCESS_TOKEN_EXPIRATION=1h`
  - [ ] `JWT_REFRESH_TOKEN_EXPIRATION=7d`
  - [ ] `BYPASS_RATE_LIMIT=false`
- [ ] Deployed service successfully
- [ ] Service shows "Live" status
- [ ] Tested health endpoint: `/health`
- [ ] Saved Render backend URL

**Backend URL:** `https://loopjs-backend-XXXX.onrender.com`

---

## 🎨 Frontend Deployment (Vercel)

### Pre-Deployment
- [ ] Updated `frontend/.env.production` with Render backend URL
- [ ] Set `VITE_API_URL=https://your-backend.onrender.com/api`
- [ ] Set `VITE_WS_URL=wss://your-backend.onrender.com/ws`
- [ ] Committed changes to Git
- [ ] Pushed to GitHub

### Vercel Setup
- [ ] Created Vercel account
- [ ] Connected GitHub repository
- [ ] Imported loopjs project
- [ ] Set framework preset: **Vite**
- [ ] Set root directory: `frontend`
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Set install command: `npm install --legacy-peer-deps`
- [ ] Added environment variables:
  - [ ] `VITE_USE_LOCAL=false`
  - [ ] `VITE_API_URL=<your_render_url>/api`
  - [ ] `VITE_WS_URL=<your_render_wss_url>/ws`
- [ ] Deployed successfully
- [ ] Deployment shows "Ready" status
- [ ] Saved Vercel frontend URL

**Frontend URL:** `https://loopjs-XXXX.vercel.app`

---

## 🔄 Post-Deployment Configuration

### Backend CORS Update (if needed)
- [ ] Added Vercel domain to CORS whitelist (auto-allowed for `.vercel.app`)
- [ ] If using custom domain, added to `backend/index.js` allowedOrigins
- [ ] Committed and pushed changes (triggers auto-redeploy on Render)

### Production Testing
- [ ] Frontend loads successfully
- [ ] Can login to admin panel
- [ ] Backend API calls working (check Network tab)
- [ ] WebSocket connection established (check WS tab in DevTools)
- [ ] No CORS errors in console
- [ ] Dashboard displays correctly
- [ ] Can execute commands (if clients connected)

### Client Testing (Optional)
- [ ] Updated client `config.json` with production backend URL
- [ ] Client connects to production backend
- [ ] Client appears in C2 panel
- [ ] Commands execute successfully

---

## 📊 Monitoring Setup

### Render Backend
- [ ] Checked deployment logs for errors
- [ ] Verified health check passing
- [ ] Noted cold start behavior (sleeps after 15min inactivity)
- [ ] Set up email notifications for deployment failures (optional)

### Vercel Frontend
- [ ] Checked build logs for warnings
- [ ] Verified deployment preview
- [ ] Enabled Vercel Analytics (optional)
- [ ] Set up error tracking with Sentry (optional)

### MongoDB Atlas
- [ ] Verified connections from Render
- [ ] Checked database metrics
- [ ] Set up alerts for storage limit (optional)

---

## 📝 Documentation Updates

- [ ] Updated `README.md` with production URLs
- [ ] Created `PRODUCTION_URLS.md` with deployment info
- [ ] Documented environment variables in team wiki (if applicable)
- [ ] Shared deployment guide with team

---

## 🔒 Security Checklist

- [ ] JWT secrets are strong and unique (64+ characters)
- [ ] Session secrets are strong and unique
- [ ] MongoDB password is strong
- [ ] No secrets committed to Git
- [ ] CORS configured correctly (not allowing all origins)
- [ ] Rate limiting enabled (`BYPASS_RATE_LIMIT=false`)
- [ ] MongoDB IP whitelist configured (consider restricting later)
- [ ] HTTPS enforced (automatic on Vercel/Render)

---

## 🎉 Deployment Complete!

Once all items are checked, your deployment is complete!

### Quick Links

- **Frontend:** https://loopjs-XXXX.vercel.app
- **Backend:** https://loopjs-backend-XXXX.onrender.com
- **Health Check:** https://loopjs-backend-XXXX.onrender.com/health
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Render Dashboard:** https://dashboard.render.com
- **Vercel Dashboard:** https://vercel.com/dashboard

### Common Commands

```bash
# View backend logs
# Go to Render Dashboard → Service → Logs

# Redeploy backend
git push origin main  # Auto-deploys on push

# Redeploy frontend
git push origin main  # Auto-deploys on push

# Test backend health
curl https://your-backend.onrender.com/health

# Monitor MongoDB
# Go to Atlas Dashboard → Metrics
```

---

## 🆘 Troubleshooting

If you encounter issues, check:

1. **Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Render Logs:** Dashboard → Service → Logs
3. **Vercel Logs:** Dashboard → Project → Deployments → Logs
4. **Browser Console:** F12 → Console (for frontend errors)
5. **Network Tab:** F12 → Network (for API/WebSocket errors)

---

## 📞 Support

- **GitHub Issues:** Open an issue in the repository
- **Render Support:** https://render.com/docs
- **Vercel Support:** https://vercel.com/docs
- **MongoDB Support:** https://www.mongodb.com/docs/atlas/

**Last Updated:** October 25, 2025
