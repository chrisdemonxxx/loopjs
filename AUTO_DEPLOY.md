# 🤖 Automated Deployment Guide

Deploy your entire LoopJS stack with **ONE COMMAND**.

## ✅ What's Automated

- ✅ Vercel frontend deployment
- ✅ Render backend deployment
- ✅ Environment variables configuration
- ✅ CORS updates
- ✅ Health checks
- ✅ URL extraction

## 🚀 Quick Start (30 seconds)

### 1. Get Your Tokens (One-Time)

**Vercel Token** (2 minutes):
1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `LoopJS`
4. Scope: Full Account
5. Copy the token

**You already have**:
- ✅ Render API Key: `rnd_R2QLPilRlRJ0jglK1EckRfOBsJje`
- ✅ MongoDB URI: Already in `.env.deploy`

### 2. Add Vercel Token

Open `.env.deploy` and add your token:

```bash
VERCEL_TOKEN=your_vercel_token_here
```

### 3. Deploy Everything

```bash
cd /media/cjs/ESD-ISO/Projects/loopjs
node deploy-full-auto.js
```

**That's it!** The script handles everything.

---

## 📋 What Happens

1. **Checks Vercel**:
   - Looks for existing project
   - If found: Uses it
   - If not: Guides you to create one via CLI

2. **Checks Render**:
   - Looks for existing service
   - If found: Updates env vars + triggers deploy
   - If not: Opens browser for ONE-TIME GitHub connection

3. **Updates CORS**:
   - Automatically adds Vercel URL to Render's CORS

4. **Tests Deployment**:
   - Calls health endpoint
   - Verifies everything works

5. **Shows URLs**:
   - Frontend URL
   - Backend URL
   - Health check URL

---

## 🎯 First Time Setup

### If Render Service Doesn't Exist Yet:

The script will open: https://dashboard.render.com/create?type=web

**Do this ONCE**:
1. Connect your GitHub repository
2. Settings:
   - Name: `loopjs-backend`
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
3. Click "Create Web Service"
4. Run `node deploy-full-auto.js` again

**After that**: Fully automated forever! 🎉

### If Vercel Project Doesn't Exist Yet:

```bash
cd frontend
npx vercel --prod
```

Follow prompts once, then the script handles it automatically.

---

## ⚡ Alternative: Full Bash Automation

For even more control:

```bash
./deploy-automated.sh
```

This script:
- Installs Vercel CLI if needed
- Deploys via CLI directly
- Handles everything end-to-end

---

## 🔧 Troubleshooting

### "VERCEL_TOKEN not set"
Add your token to `.env.deploy`:
```bash
VERCEL_TOKEN=vercel_xxxxx
```

### "No existing Render service found"
1. Script opens browser automatically
2. Connect GitHub (one time)
3. Run script again

### "Network timeout"
- Check internet connection
- Try again (APIs are flaky sometimes)

### "API Error 401"
- Check your tokens are correct
- Regenerate if needed

---

## 📊 Deployment Times

| Scenario | Time |
|----------|------|
| **First deployment** | 8-10 minutes (includes setup) |
| **Subsequent deploys** | **30 seconds** (fully automated) |
| **Just frontend** | 15 seconds |
| **Just backend** | 20 seconds |

---

## 🎉 After Deployment

Your URLs will be displayed:

```
📍 Frontend: https://loopjs-abc123.vercel.app
📍 Backend:  https://loopjs-backend-xyz.onrender.com
📍 Health:   https://loopjs-backend-xyz.onrender.com/health
```

Test it:
1. Open frontend URL
2. Login
3. Check browser console for errors
4. Verify WebSocket connection

---

## 💡 Pro Tips

1. **Redeploy anytime**:
   ```bash
   node deploy-full-auto.js
   ```

2. **Just update env vars**:
   Edit `.env.deploy` and run script

3. **Force rebuild**:
   Script triggers new deploy automatically

4. **Monitor logs**:
   - Render: https://dashboard.render.com
   - Vercel: https://vercel.com/dashboard

---

## 🆘 Need Help?

Run with verbose output:
```bash
DEBUG=* node deploy-full-auto.js
```

Or use the bash version:
```bash
bash -x deploy-automated.sh
```

---

**Ready? Run this now:**

```bash
node deploy-full-auto.js
```

🚀 Your app will be live in 30 seconds!
