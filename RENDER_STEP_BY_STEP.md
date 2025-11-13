# Render Deployment - Step by Step

## Prerequisites
- [ ] MongoDB connection string ready
- [ ] Render account (create at https://dashboard.render.com if needed)

## Step 1: Connect GitHub to Render

1. Go to: https://dashboard.render.com
2. Click "New +" button (top right)
3. Select "Web Service"
4. Click "Connect account" under GitHub
5. Authorize Render to access your repositories
6. Search for: `loopjs`
7. Click "Connect" next to your loopjs repository

## Step 2: Configure Service

**Root Directory:**
```
backend
```

**Build Command:**
```
npm ci --production=false
```

**Start Command:**
```
npm start
```

**Environment:**
- Select: `Node`
- Region: `Oregon (US West)`
- Branch: `claude/frontend-ui-rebuild-01XAcyr1NCQ3VamfXgARfpg9` (or `main` if merged)
- Plan: `Free`

## Step 3: Add Environment Variables

Click "Advanced" → "Add Environment Variable"

### Required Variables (Add these now):

**Variable 1:**
- Key: `MONGODB_URI`
- Value: Your MongoDB connection string from previous step
  ```
  mongodb+srv://loopjs-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/loopjs?retryWrites=true&w=majority
  ```

**Variable 2:**
- Key: `ALLOWED_ORIGINS`
- Value: `https://localhost:3000,http://localhost:5173`
  (We'll add your Vercel URL after frontend deployment)

### Auto-Generated Variables (Render creates these automatically):
- `JWT_SECRET` - Click "Generate"
- `SESSION_SECRET` - Click "Generate"

## Step 4: Create Web Service

1. Review the configuration
2. Click "Create Web Service"
3. Watch the deployment logs

## Step 5: Wait for Deployment (3-5 minutes)

Look for these success messages in logs:
```
✅ Installing dependencies...
✅ Starting server...
✅ MongoDB connected successfully
✅ Server running on port 10000
```

## Step 6: Save Your Backend URL

After deployment completes, you'll see your URL at the top:
```
https://loopjs-backend-XXXX.onrender.com
```

**COPY THIS URL - YOU'LL NEED IT FOR FRONTEND!**

## Step 7: Test Backend

Open this URL in your browser:
```
https://your-backend-url.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "uptime": 123.45,
  "initialized": true
}
```

---

✅ Backend deployed!
Next: Deploy Frontend to Vercel
