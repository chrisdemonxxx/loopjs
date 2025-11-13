# 🎯 Deploy LoopJS from Cursor/Claude Code

**Deploy your LoopJS application to production directly from Cursor using CLI tools and APIs!**

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Deployment Tools
```bash
# In Cursor terminal (Ctrl+` or Cmd+`)
cd /media/cjs/ESD-ISO/Projects/loopjs
./setup-deployment.sh
```

This installs:
- ✅ Vercel CLI
- ✅ Deployment scripts
- ✅ Environment configuration

---

### Step 2: Deploy Backend to Render

**You have your Render API key:** `rnd_R2QLPilRlRJ0jglK1EckRfOBsJje`

#### Option A: Via Render Dashboard (Recommended - Easiest)

1. **Open Render Dashboard:**
   ```bash
   # From Cursor terminal
   xdg-open https://dashboard.render.com
   # Or manually go to: https://dashboard.render.com
   ```

2. **Login with GitHub** (sign up if needed)

3. **Deploy using Blueprint** (Auto-detects configuration!):
   - Click **"New +"** → **"Blueprint"**
   - Connect your `loopjs` GitHub repository
   - Render auto-detects `backend/render.yaml` ✨
   - Add environment variable:
     - Key: `MONGODB_URI`
     - Value: `mongodb+srv://chrisdemonxxx_db_user:Demon%4046@cluster0.1vs04ow.mongodb.net/loopjs?retryWrites=true&w=majority&appName=Cluster0`
   - Click **"Apply"**
   - Wait 5-10 minutes for deployment

4. **Copy your backend URL:**
   ```
   https://loopjs-backend-XXXX.onrender.com
   ```
   Save this - you'll need it for Vercel!

#### Option B: Via API Script (Check Render Status)

```bash
# In Cursor terminal
node deploy-render.js
```

This script will:
- ✅ Validate your Render API key
- ✅ List existing services
- ✅ Show deployment configuration
- ✅ Provide next steps

---

### Step 3: Deploy Frontend to Vercel

```bash
# In Cursor terminal
cd /media/cjs/ESD-ISO/Projects/loopjs

# Deploy (replace with YOUR Render backend URL)
./deploy-vercel.sh https://loopjs-backend-XXXX.onrender.com
```

**What happens:**
1. Vercel CLI will ask you to **login** (first time only)
   - Opens browser to authenticate
   - Choose "Continue with GitHub"

2. **Project setup** (first time):
   - Set up and deploy: **Yes**
   - Which scope: **Your personal account**
   - Link to existing project: **No**
   - Project name: **loopjs** (or your choice)
   - Directory: **./frontend**
   - Override settings: **No**

3. **Deployment:**
   - Builds your frontend
   - Deploys to Vercel
   - Shows your URL: `https://loopjs-XXXX.vercel.app`

---

## ✅ Post-Deployment Steps

### 1. Update CORS in Render

Add your Vercel URL to backend CORS:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your `loopjs-backend` service
3. Go to **"Environment"** tab
4. Find or add `ALLOWED_ORIGINS`:
   ```
   https://loopjs-XXXX.vercel.app,https://loopjs-backend-XXXX.onrender.com
   ```
   (Replace with your actual URLs)
5. **Save** - Render will auto-redeploy (2-3 minutes)

### 2. Test Your Deployment

```bash
# Test backend health
curl https://YOUR-BACKEND.onrender.com/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":123.456}
```

**Test frontend:**
1. Open your Vercel URL in browser
2. Open DevTools (F12) → Console
3. Should see no errors
4. Try logging in
5. Check Network tab for successful API calls

---

## 📋 Available Commands (From Cursor Terminal)

### Project Root Commands:
```bash
# Setup deployment tools
./setup-deployment.sh

# Check Render API and show steps
node deploy-render.js

# Deploy frontend to Vercel
./deploy-vercel.sh [BACKEND_URL]
```

### Backend Directory Commands:
```bash
cd backend

# Run locally
npm run dev

# Check Render deployment
npm run deploy:render
```

### Frontend Directory Commands:
```bash
cd frontend

# Run locally
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🔑 Environment Variables Reference

### Your Configuration:

**MongoDB Atlas:**
```
mongodb+srv://chrisdemonxxx_db_user:Demon%4046@cluster0.1vs04ow.mongodb.net/loopjs?retryWrites=true&w=majority&appName=Cluster0
```

**Render API Key:**
```
rnd_R2QLPilRlRJ0jglK1EckRfOBsJje
```

**Stored in:** `.env.deployment` (automatically created, not committed to Git)

---

## 🎨 Cursor Integration

### Using Claude Code Agent in Cursor:

You can ask me (Claude Code) to:

1. **Check deployment status:**
   ```
   "Check if my Render backend is deployed"
   "What's the status of my Vercel deployment?"
   ```

2. **Run deployment commands:**
   ```
   "Run the Render deployment script"
   "Deploy my frontend to Vercel"
   ```

3. **Debug issues:**
   ```
   "My backend won't connect to MongoDB, check the logs"
   "Frontend is getting CORS errors, help me fix it"
   ```

4. **Update configuration:**
   ```
   "Update my CORS to include the new Vercel URL"
   "Change the MongoDB connection string"
   ```

### Cursor Terminal Shortcuts:

- **Open Terminal:** `Ctrl+`` (backtick) or `Cmd+``
- **New Terminal:** `Ctrl+Shift+`` or `Cmd+Shift+``
- **Split Terminal:** Click the split icon in terminal
- **Run Command:** Type and press Enter

---

## 📁 Files Created for Cursor Deployment

| File | Purpose |
|------|---------|
| `setup-deployment.sh` | Install CLI tools and setup environment |
| `deploy-render.js` | Render API integration script |
| `deploy-vercel.sh` | Vercel CLI deployment wrapper |
| `.env.deployment` | Deployment secrets (gitignored) |
| `.cursorrules-deployment` | Cursor-specific deployment rules |
| `backend/render.yaml` | Render Blueprint configuration |
| `frontend/vercel.json` | Vercel deployment configuration |

---

## 🔧 Troubleshooting

### "Permission denied" when running scripts
```bash
chmod +x setup-deployment.sh deploy-vercel.sh deploy-render.js
```

### "Vercel command not found"
```bash
# Install globally
npm install -g vercel

# Or use npx
npx vercel --version
```

### "RENDER_API_KEY not found"
The key is hardcoded in `deploy-render.js`. If you need to change it:
```bash
export RENDER_API_KEY=your_new_key
```

### MongoDB connection fails
1. Check MongoDB Atlas Network Access allows 0.0.0.0/0
2. Verify connection string in Render environment variables
3. Check Render logs for specific error

### CORS errors on frontend
1. Ensure `ALLOWED_ORIGINS` in Render includes your Vercel URL
2. Wait 2-3 minutes for Render to redeploy after changing env vars
3. Clear browser cache and try again

---

## 🚀 Production URLs

After deployment, fill these in:

| Service | URL |
|---------|-----|
| **Frontend** | `https://_____________________.vercel.app` |
| **Backend** | `https://_____________________.onrender.com` |
| **Database** | `cluster0.1vs04ow.mongodb.net` ✅ |
| **Health** | `https://_____________________.onrender.com/health` |

---

## 💡 Pro Tips

### 1. Watch Deployment Logs
```bash
# Render logs (in dashboard)
https://dashboard.render.com → Your Service → Logs

# Vercel logs (in dashboard)
https://vercel.com → Your Project → Deployments → Latest → Logs
```

### 2. Redeploy on Code Changes
Both Render and Vercel auto-deploy on Git push to `main`:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Both services automatically rebuild! 🎉
```

### 3. Local Testing Before Deploy
```bash
# Test backend locally
cd backend
npm run dev
# Visit: http://localhost:8080/health

# Test frontend locally
cd frontend
npm run dev
# Visit: http://localhost:5173
```

### 4. Environment-Specific Configs
- Development: `backend/.env`, `frontend/.env.development`
- Production: `backend/.env.production`, `frontend/.env.production`
- Deployment: `.env.deployment` (deployment scripts only)

---

## 📞 Need Help?

**In Cursor, ask me (Claude Code):**
- "Help me deploy to Render"
- "My deployment failed, what's wrong?"
- "How do I update environment variables?"
- "Show me the deployment logs"

**External Resources:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/

---

**Ready to deploy? Start with Step 1!** 🚀

```bash
./setup-deployment.sh
```
